import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types/cardProps";
import { FaFile } from "react-icons/fa";
import { Button } from "../ui/button";
import { IoCloseSharp } from "react-icons/io5";
import { doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { db, deleteFileFromStorage } from "@/lib/utils/firebase/firebase";
import { getDownloadURL, getStorage, ref } from "firebase/storage";

const CardComponent: React.FC<{ task: Task; onRemove: (taskId: string) => void }> = ({
	task,
	onRemove,
}) => {
	const { id, title, createdAt, createdBy, dueDate, downloads } = task;

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
			const taskRef = doc(db, "tasks", id);
			await updateDoc(taskRef, {
				title: editedTitle,
				dueDate: new Date(editedDueDate),
			});
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

	const handleFileDelete = async (fileUrl: string) => {
		try {
			await deleteFileFromStorage(fileUrl); // Call the deletion function

			// Update the state to remove the deleted file from the list
			setDownloadedFiles((prevFiles) => prevFiles.filter((file) => file !== fileUrl));

			console.log(`File deleted: ${fileUrl}`);
		} catch (error) {
			console.error("Failed to delete file:", error);
		}
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
		<Card key={id} className="w-full h-[220px]">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{createdBy}</CardDescription>
			</CardHeader>
			<CardContent>
				<ul>
					{downloadedFiles.length > 0 ? (
						<li className="flex items-center">
							<FaFile className="mr-2" />
							Number of Files: {downloadedFiles.length}
						</li>
					) : (
						<p>No files uploaded.</p>
					)}
					<div className="flex justify-between">
						<span className="text-xs text-slate-500">Created At:</span>
						<span className="text-xs text-slate-500">{formatDate(createdAt)}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-xs text-slate-500">Due Date:</span>
						<span className="text-xs text-slate-500">{formatDate(dueDate)}</span>
					</div>
				</ul>
				<div className="w-full flex justify-end items-center gap-4 pt-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button>Edit</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader className="text-foreground">
								<DialogTitle>Edit Task</DialogTitle>
								<DialogDescription className="text-foreground">
									Modify the task details below.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium text-foreground">
										Title
									</label>
									<input
										type="text"
										value={editedTitle}
										onChange={(e) => setEditedTitle(e.target.value)}
										className="mt-1 block w-full border border-gray-300 rounded-md p-2"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground">
										Due Date
									</label>
									<input
										type="date"
										value={editedDueDate}
										onChange={(e) => setEditedDueDate(e.target.value)}
										className="mt-1 block w-full border border-gray-300 rounded-md p-2"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-foreground">
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
								<div>
									<label className="block text-sm font-medium text-foreground">
										Upload File
									</label>
									<input
										type="file"
										onChange={handleFileChange}
										className="mt-1 block w-full text-foreground"
									/>
								</div>
							</div>
							<div className="flex justify-end mt-4">
								<Button onClick={handleEditSubmit}>
									<DialogClose>Save</DialogClose>
								</Button>

								<Button variant="outline" className="ml-2 text-foreground">
									<DialogClose>Cancel</DialogClose>
								</Button>
							</div>
						</DialogContent>
					</Dialog>

					<Button onClick={() => onRemove(id)}>Remove</Button>

					<Dialog>
						<DialogTrigger asChild>
							<Button className="text-foreground">View Files</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader>
								<DialogTitle className="text-foreground">
									Attached Files
								</DialogTitle>
								<DialogDescription className="text-foreground">
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
											<p className="text-foreground">
												{getFilenameFromUrl(url)}
											</p>

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

export default CardComponent;
