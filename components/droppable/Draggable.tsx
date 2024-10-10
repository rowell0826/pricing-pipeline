import { FileUpload, Task } from "@/lib/types/cardProps";
import { clientFileUpload, db, deleteFileFromStorage } from "@/lib/utils/firebase/firebase";
import { useDraggable } from "@dnd-kit/core";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, StorageReference } from "firebase/storage";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { FaFile } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";

interface DraggableProps {
	id: string | number;
	task: Task;
	containerTitle: string;
	getInitials: (name: string) => string;
	onRemove: (taskID: string, container: string, filePaths: string[]) => void;
}

export const DraggableCard = (props: React.PropsWithChildren<DraggableProps>) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: props.id,
	});

	const { task, onRemove, getInitials, containerTitle } = props;
	const { id, title, createdAt, createdBy, dueDate } = task;

	// Declare the style object and cast it as React.CSSProperties
	const style: React.CSSProperties = {
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
		zIndex: isDragging ? 10 : "auto",
	};

	const formatDate = (date: Date | null | Timestamp) => {
		if (!date) return "Unknown Date";

		// Check if the date is a Firestore Timestamp
		if (date instanceof Timestamp) {
			return date.toDate().toLocaleDateString();
		}

		if (date instanceof Date) {
			return date.toLocaleDateString();
		}

		return "Unknown Date";
	};

	// State handlers
	const [editedTitle, setEditedTitle] = useState(title);
	const [editedDueDate, setEditedDueDate] = useState(formatDate(dueDate));
	const [filesMarkedForDeletion, setFilesMarkedForDeletion] = useState<string[]>([]);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [downloadedFiles, setDownloadedFiles] = useState<(string | File | FileUpload)[]>([]);

	useEffect(() => {
		const fetchTaskData = async () => {
			const taskRef = doc(db, containerTitle, id);
			const taskSnapshot = await getDoc(taskRef);
			const taskData = taskSnapshot.data();

			if (taskData) {
				setDownloadedFiles(taskData.fileUpload || []);
			}
		};
		fetchTaskData();
	}, [containerTitle, id]);

	const getFilenameFromUrl = (url: FileUpload) => {
		const urlParts = url.filePath?.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace(`${containerTitle}/`, "");

		return decodedFilename;
	};

	const isFileUpload = (file: string | File | FileUpload): file is FileUpload => {
		return (file as FileUpload).filePath !== undefined;
	};

	const handleDownload = async (url: FileUpload) => {
		const storage = getStorage();
		const fileRef = ref(storage, url.filePath);

		console.log("handleDownload URL: ", url);

		try {
			const downloadUrl = await getDownloadURL(fileRef);

			window.open(downloadUrl, "_blank");
		} catch (error) {
			console.error("Error downloading file:", error);
			alert("There was an error downloading the file.");
		}
	};

	const handleEditSubmit = async () => {
		try {
			// Delete the files from Firebase that are marked for deletion
			for (const files of filesMarkedForDeletion) {
				await deleteFileFromStorage(files);
			}

			const taskRef = doc(db, containerTitle, id);

			const fileSnapshot = await clientFileUpload(selectedFile as File);
			const fileUrl = await getDownloadURL(fileSnapshot?.ref as StorageReference);

			const taskDoc = await getDoc(taskRef);
			const currentFileUpload = taskDoc.data()?.fileUpload || [];

			// Update Firestore document
			await updateDoc(taskRef, {
				title: editedTitle,
				dueDate: editedDueDate ? new Date(editedDueDate) : editedDueDate,
				fileUpload: [...currentFileUpload, { folder: containerTitle, filePath: fileUrl }],
			});

			console.log("Task updated: ", fileUrl);
		} catch (error) {
			console.error("Error updating task:", error);
			console.log("Downloaded files: ", downloadedFiles);
			alert("There was an error updating the task.");
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleFileDelete = (file: FileUpload) => {
		// Add the file to the list of files marked for deletion
		setFilesMarkedForDeletion((prev) => [...prev, file.filePath]); // Store the filePath or any unique identifier

		// Update the state to remove the deleted file from the UI
		setDownloadedFiles((prevFiles) =>
			prevFiles.filter(
				(prevFile) =>
					// Check if the previous file matches the file to delete
					!(isFileUpload(prevFile) && prevFile.filePath === file.filePath)
			)
		);
	};

	const handleCancelEdit = () => {
		// Revert any marked deletions by adding the marked files back to downloadedFiles
		setDownloadedFiles((prevFiles) => [...prevFiles, ...filesMarkedForDeletion]);

		// Clear the markedForDeletionFiles array
		setFilesMarkedForDeletion([]);
	};

	return (
		<Card key={id} ref={setNodeRef} style={style} {...attributes} className="h-[190px] w-full">
			<CardHeader className="h-[30%] py-2" {...listeners}>
				<CardTitle className="text-left text-xs">{title}</CardTitle>
				<Avatar className="mr-2 w-6 h-6">
					<AvatarFallback className="text-xs">{getInitials(createdBy)}</AvatarFallback>
				</Avatar>
			</CardHeader>

			<div className="p-2">
				<div>
					{downloadedFiles.length > 0 ? (
						<p className="flex items-center text-[8px]">
							<FaFile className="mr-2" />
							Number of Files: {downloadedFiles.length}
						</p>
					) : (
						<p className="text-[8px]">No files uploaded.</p>
					)}
				</div>
				<div className="">
					<Badge className="text-[8px]">Created: {formatDate(createdAt)}</Badge>

					<Badge className="text-[8px]">Due: {formatDate(dueDate)}</Badge>
				</div>
				<div className="w-full flex justify-evenly items-center gap-2 pt-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button
								size={"xs"}
								onClick={(e) => {
									e.stopPropagation();
								}}
								className="text-[8px]"
							>
								Edit
							</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader className="text-foreground">
								<DialogTitle className="p-2">Edit Task</DialogTitle>
								<DialogDescription className="text-foreground p-2">
									Modify the task details below.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 h-full p-2">
								<div>
									<label className="block text-sm font-medium ">Title</label>
									<input
										type="text"
										value={editedTitle}
										onChange={(e) => setEditedTitle(e.target.value)}
										className="mt-1 block w-full border border-gray-300 rounded-md p-2"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium ">Due Date</label>
									<input
										type="date"
										value={editedDueDate}
										onChange={(e) => setEditedDueDate(e.target.value)}
										className="mt-1 block w-full border border-gray-300 rounded-md p-2"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium ">
										Uploaded Files
									</label>
									{downloadedFiles.length > 0 ? (
										<ul className="mt-2 space-y-2 bg-white px-2 py-1">
											{downloadedFiles.map((fileUrl, index) => (
												<li
													key={index}
													className="flex justify-between items-center"
												>
													{isFileUpload(fileUrl) ? (
														<>
															<a
																href={fileUrl.filePath}
																target="_blank"
																rel="noopener noreferrer"
																className="text-cyan-800 hover:underline"
															>
																{getFilenameFromUrl(fileUrl)}
															</a>
															<IoCloseSharp
																onClick={() =>
																	handleFileDelete(fileUrl)
																}
																className="cursor-pointer"
															/>
														</>
													) : (
														<span className="text-gray-500">
															Invalid file type
														</span>
													)}
												</li>
											))}
										</ul>
									) : (
										<p className="text-sm text-gray-500">
											No files uploaded yet.
										</p>
									)}
								</div>
								<div className="p-1">
									<label className="block text-sm font-medium ">
										Upload File
									</label>
									<input
										type="file"
										onChange={handleFileChange}
										className="mt-1 block w-full "
									/>
								</div>
							</div>
							<div className="flex justify-end mt-4 gap-4">
								<Button onClick={handleEditSubmit}>
									<DialogClose>Save</DialogClose>
								</Button>

								<Button onClick={handleCancelEdit}>
									<DialogClose>Cancel</DialogClose>
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<Button
						onClick={(e) => {
							e.stopPropagation();

							console.log("File Upload Array: ", task.fileUpload); // Log the file upload array

							const filePaths: string[] = task.fileUpload
								.map((file) => {
									if (typeof file === "string") {
										const match = file.match(/\/o\/([^?]*)/);

										return match ? decodeURIComponent(match[1]) : undefined;
									} else if (file instanceof File) {
										return file.name; // Extract name or any property from File
									}
									return undefined; // In case of an unexpected type
								})
								.filter((path): path is string => path !== undefined);

							// Log the valid file paths
							console.log("Valid File Paths: ", filePaths);

							onRemove(task.id, containerTitle, filePaths);
						}}
						size={"xs"}
						className="text-[8px]"
					>
						Remove
					</Button>

					<Dialog>
						<DialogTrigger asChild>
							<Button
								size={"xs"}
								onClick={(e) => e.stopPropagation()}
								className="text-[8px]"
							>
								View Files
							</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader>
								<DialogTitle>Attached Files</DialogTitle>
								<DialogDescription>
									Here are the files attached to this task. You can download them
									below.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								{downloadedFiles.length > 0 ? (
									downloadedFiles.map((url, index) => (
										<div
											key={index}
											className="flex items-center justify-between"
										>
											{isFileUpload(url) ? (
												<>
													<p>{getFilenameFromUrl(url)}</p>

													<p
														className="text-foreground underline cursor-pointer"
														onClick={() => handleDownload(url)}
													>
														Download
													</p>
												</>
											) : (
												<span className="text-gray-500">
													Invalid file type
												</span>
											)}
										</div>
									))
								) : (
									<p>No files available for download.</p>
								)}
							</div>
							<Button className="mt-4" asChild>
								<DialogClose>Close</DialogClose>
							</Button>
						</DialogContent>
					</Dialog>
				</div>
			</div>
		</Card>
	);
};
