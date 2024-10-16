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
import { IoCloseSharp } from "react-icons/io5";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { useCard } from "@/lib/context/cardContext/CardContext";

interface DraggableProps {
	id: string | number;
	task: Task;
	containerTitle: string;
	getInitials: (name: string) => string;
	onRemove: (taskID: string, container: string, fileUpload: FileUpload[]) => void;
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
	// const [editedDueDate, setEditedDueDate] = useState(formatDate(dueDate));
	const [filesMarkedForDeletion, setFilesMarkedForDeletion] = useState<string[]>([]);
	const [formattedDate, setFormattedDate] = useState("");
	const [downloadedFiles, setDownloadedFiles] = useState<(string | File | FileUpload)[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const { dueDateInput, setDueDateInput } = useCard();

	useEffect(() => {
		const fetchTaskData = async () => {
			const taskRef = doc(db, containerTitle, id);
			const taskSnapshot = await getDoc(taskRef);
			const taskData = taskSnapshot.data();

			if (taskData) {
				setDownloadedFiles(taskData.fileUpload || []);
			}
		};

		if (dueDate) {
			const formatted = formatDate(dueDate as Date);
			setDueDateInput(dueDate.toString());
			setFormattedDate(formatted);
		}

		fetchTaskData();
	}, [containerTitle, id, dueDate, setDueDateInput]);

	const getFilenameFromUrl = (url: string) => {
		if (typeof url !== "string") {
			throw new TypeError(`Expected a string, but received: ${typeof url}`);
		}
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace(
			/^(raw|filtering|pricing|done)\//,
			""
		);

		return decodedFilename;
	};

	// Function to group files by folder
	const groupFilesByFolder = (files: FileUpload[]) => {
		return files.reduce((acc, file) => {
			if (acc[file.folder]) {
				acc[file.folder].push(file.filePath);
			} else {
				acc[file.folder] = [file.filePath];
			}
			return acc;
		}, {} as Record<string, string[]>);
	};

	const groupedDownloadFiles = groupFilesByFolder(downloadedFiles as FileUpload[]);

	const isFileUpload = (file: string | File | FileUpload): file is FileUpload => {
		return (file as FileUpload).filePath !== undefined;
	};

	const handleDownload = async (url: string) => {
		const storage = getStorage();
		const fileRef = ref(storage, url);

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

			const fileSnapshot = await clientFileUpload(containerTitle, selectedFile as File);
			const fileUrl = await getDownloadURL(fileSnapshot?.ref as StorageReference);

			const taskDoc = await getDoc(taskRef);
			const currentFileUpload = taskDoc.data()?.fileUpload || [];

			// Update Firestore document
			await updateDoc(taskRef, {
				title: editedTitle,
				dueDate: dueDateInput ? new Date(dueDateInput) : dueDate,
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

	const handleFileDelete = (file: string) => {
		// Add the file to the list of files marked for deletion
		setFilesMarkedForDeletion((prev) => [...prev, file]);

		// Update the state to remove the deleted file from the UI
		setDownloadedFiles((prevFiles) =>
			prevFiles.filter(
				(prevFile) =>
					// Check if the previous file matches the file to delete
					!(isFileUpload(prevFile) && prevFile.filePath === file)
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
		<Card
			key={id}
			ref={setNodeRef}
			style={style}
			{...attributes}
			className="h-[115px] w-full rounded-md bg-white"
		>
			<CardHeader className="h-[30%] py-2" {...listeners}>
				<CardTitle className="text-left text-xs text-black">{title}</CardTitle>
				<Avatar className="mr-2 w-6 h-6">
					<AvatarFallback className="text-xs">{getInitials(createdBy)}</AvatarFallback>
				</Avatar>
			</CardHeader>

			<div className="p-2 mt-2 rounded-md">
				<div>
					<Badge className="text-[8px] bg-black text-white">
						Created: {formatDate(createdAt)}
					</Badge>

					<Badge className="text-[8px] bg-black text-white">
						Due: {formattedDate || "N/A"}
					</Badge>
				</div>
				<div className="w-full flex justify-evenly items-center gap-2 pt-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button
								size={"xs"}
								onClick={(e) => {
									e.stopPropagation();
								}}
								className="text-[8px] bg-black text-white"
							>
								Edit
							</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader className="text-sidebartx">
								<DialogTitle className="p-2">Edit Task</DialogTitle>
								<DialogDescription className="text-sidebartx p-2">
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
										value={dueDateInput.toString()}
										onChange={(e) => setDueDateInput(e.target.value)}
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
																{getFilenameFromUrl(
																	fileUrl.filePath
																)}
															</a>
															<IoCloseSharp
																onClick={() =>
																	handleFileDelete(
																		fileUrl.filePath
																	)
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

							const filePaths: FileUpload[] = task.fileUpload
								.map((file) => {
									if (typeof file === "string") {
										const match = file.match(/\/o\/([^?]*)/);
										if (match) {
											const decodedPath = decodeURIComponent(match[1]);

											return {
												folder: containerTitle,
												filePath: decodedPath,
											};
										}
									} else if (file instanceof File) {
										// Create a FileUpload object
										return { folder: containerTitle, filePath: file.name };
									}
									return undefined;
								})
								.filter((path): path is FileUpload => path !== undefined);

							onRemove(task.id, containerTitle, filePaths);
						}}
						size={"xs"}
						className="text-[8px] bg-black text-white"
					>
						Remove
					</Button>

					<Dialog>
						<DialogTrigger asChild>
							<Button
								size={"xs"}
								onClick={(e) => e.stopPropagation()}
								className="text-[8px] bg-black text-white"
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
							<div className="space-y-4 overflow-y-scroll">
								{Object.keys(groupedDownloadFiles).length > 0 ? (
									Object.keys(groupedDownloadFiles).map((folder) => (
										<div key={folder} id={folder}>
											<h4>{folder}</h4>
											{groupedDownloadFiles[folder].map((filePath, index) => (
												<div
													key={index}
													className="flex items-center justify-between"
												>
													<p>{getFilenameFromUrl(filePath)}</p>
													<p
														className="text-foreground underline cursor-pointer"
														onClick={() => handleDownload(filePath)}
													>
														Download
													</p>
												</div>
											))}
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
