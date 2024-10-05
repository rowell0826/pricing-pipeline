import { Task } from "@/lib/types/cardProps";
import { db, deleteFileFromStorage } from "@/lib/utils/firebase/firebase";
import { useDraggable } from "@dnd-kit/core";
import { doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
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

interface DraggableProps {
	id: string | number;
	task: Task;
	onRemove: (taskId: string) => void;
}

export const DraggableCard = (props: React.PropsWithChildren<DraggableProps>) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: props.id,
	});

	const { task, onRemove } = props;
	const { id, title, createdAt, createdBy, dueDate, downloads } = task;

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
	const [downloadedFiles, setDownloadedFiles] = useState<string[]>(downloads || []);

	const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
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
			for (const fileUrl of filesMarkedForDeletion) {
				await deleteFileFromStorage(fileUrl);
			}

			const taskRef = doc(db, "tasks", id);

			// Update Firestore document
			await updateDoc(taskRef, {
				title: editedTitle,
				dueDate: new Date(editedDueDate),
				downloads: downloadedFiles,
			});

			setFilesMarkedForDeletion([]);
			alert("Task updated successfully!");
		} catch (error) {
			console.error("Error updating task:", error);
			alert("There was an error updating the task.");
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0]);
		}
	};

	const handleFileDelete = (fileUrl: string) => {
		// Add the file to the list of files marked for deletion
		setFilesMarkedForDeletion((prev) => [...prev, fileUrl]);

		// Update the state to remove the deleted file from the UI
		setDownloadedFiles((prevFiles) => prevFiles.filter((file) => file !== fileUrl));
	};

	const handleCancelEdit = () => {
		// Revert any marked deletions by adding the marked files back to downloadedFiles
		setDownloadedFiles((prevFiles) => [...prevFiles, ...filesMarkedForDeletion]);

		// Clear the markedForDeletionFiles array
		setFilesMarkedForDeletion([]);
	};

	useEffect(() => {
		// Subscribe to Firestore updates for this task
		const unsubscribe = onSnapshot(doc(db, "tasks", task.id), (doc) => {
			const updatedTask = doc.data();
			if (updatedTask?.downloads) {
				setDownloadedFiles(updatedTask.downloads);
			}
		});

		// Cleanup listener on component unmount
		return () => unsubscribe();
	}, [task.id]);

	return (
		<Card key={id} ref={setNodeRef} style={style} {...listeners} {...attributes}>
			<CardHeader className="h-[30%] py-2">
				<CardTitle className="text-left">{title}</CardTitle>
				<CardDescription className="text-left">{createdBy}</CardDescription>
			</CardHeader>

			<CardContent>
				<ul>
					{downloadedFiles.length > 0 ? (
						<li className="flex items-center text-sm">
							<FaFile className="mr-2" />
							Number of Files: {downloadedFiles.length}
						</li>
					) : (
						<p>No files uploaded.</p>
					)}
					<div className="flex justify-between">
						<span className="text-xs ">Created At:</span>
						<span className="text-xs ">{formatDate(createdAt)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-xs ">Due Date:</span>
						<span className="text-xs ">{formatDate(dueDate)}</span>
					</div>
				</ul>
				<div className="w-full flex justify-evenly items-center gap-4 pt-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button size={"sm"} onClick={(e) => e.stopPropagation()}>
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
													<a
														href={fileUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="text-cyan-800 hover:underline"
													>
														{getFilenameFromUrl(fileUrl)}
													</a>
													<IoCloseSharp
														onClick={() => handleFileDelete(fileUrl)}
														className="cursor-pointer"
													/>
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

							onRemove(id);
						}}
						size={"sm"}
					>
						Remove
					</Button>

					<Dialog>
						<DialogTrigger asChild>
							<Button size={"sm"} onClick={(e) => e.stopPropagation}>
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
											<p>{getFilenameFromUrl(url)}</p>

											<p
												className="text-foreground underline cursor-pointer"
												onClick={() => handleDownload(url)}
											>
												Download
											</p>
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
			</CardContent>
		</Card>
	);
};
