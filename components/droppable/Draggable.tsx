import { FileUpload, Task } from "@/lib/types/cardProps";
import {
	clientFileUpload,
	db,
	deleteFileFromStorage,
	storage,
} from "@/lib/utils/firebase/firebase";
import { useDraggable } from "@dnd-kit/core";
import { deleteDoc, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import {
	deleteObject,
	getDownloadURL,
	getStorage,
	ref,
	//StorageReference
} from "firebase/storage";
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
import { useAuth } from "@/lib/context/authContext/AuthContext";
import { AuthRole } from "@/lib/types/authTypes";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";
import Link from "next/link";

interface DraggableProps {
	id: string | number;
	task: Task;
	containerTitle: string;
	getInitials: (name: string) => string;
}

const folderAccessByRole: Record<AuthRole, string[]> = {
	admin: ["raw", "filtering", "pricing", "done"],
	client: ["raw", "pricing", "done"],
	dataManager: ["raw", "filtering"],
	dataQA: ["raw", "filtering"],
	dataScientist: ["filtering", "pricing"],
	promptEngineer: ["filtering", "pricing"],
};

export const DraggableCard = (props: React.PropsWithChildren<DraggableProps>) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: props.id,
	});

	const { task, getInitials, containerTitle } = props;
	const { id, title, createdAt, createdBy, dueDate, link, status } = task;
	const { role } = useAuth();
	const { setTasks, editLink, setEditLink } = useCard();
	const { showAlert } = useTheme();

	const today = new Date().toISOString().split("T")[0];

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
	// const [editLink, setEditLink] = useState<string>("");
	const [filesMarkedForDeletion, setFilesMarkedForDeletion] = useState<string[]>([]);
	const [formattedDate, setFormattedDate] = useState<Date | string>("");
	const [localDueDateInput, setLocalDueDateInput] = useState<Date | string>("");
	const [downloadedFiles, setDownloadedFiles] = useState<(string | File | FileUpload)[]>([]);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	useEffect(() => {
		const fetchTaskData = async () => {
			const taskRef = doc(db, "tasks", id); // Updated to use a static folder name
			const taskSnapshot = await getDoc(taskRef);
			const taskData = taskSnapshot.data();

			if (taskData) {
				setDownloadedFiles(taskData.fileUpload || []);
				if (taskData.dueDate) {
					const dueDate = taskData.dueDate.toDate();
					setFormattedDate(dueDate.toLocaleDateString());
				}
			}
		};

		fetchTaskData();
	}, [id]);

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

	const removeTask = async (taskId: string) => {
		const taskDocRef = doc(db, "tasks", taskId);

		const taskSnapshot = await getDoc(taskDocRef);
		const taskDetails = taskSnapshot.data();

		console.log("Tasks Details: ", taskDetails);

		const taskFileStorage = taskDetails?.fileUpload;

		task.fileUpload
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
					return {
						folder: containerTitle,
						filePath: file.name,
					};
				}
				return undefined;
			})
			.filter((path): path is FileUpload => path !== undefined);

		try {
			await deleteDoc(taskDocRef);

			await Promise.all(
				taskFileStorage.map(async (file: FileUpload) => {
					// Create a reference to the file in Firebase Storage
					const fileRef = ref(storage, decodeURIComponent(file.filePath));

					if (fileRef != null) {
						await deleteObject(fileRef); // Delete the file from firebase storage
					} else {
						return; // 10/28/2024
					}
				})
			);

			setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

			showAlert("success", "Ticket deleted.");
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	const moveToArchive = async (taskId: string) => {
		const taskRef = doc(db, "tasks", taskId);

		try {
			const taskSnapshot = await getDoc(taskRef);

			if (!taskSnapshot.exists()) {
				throw new Error("Task does not exist.");
			}

			// Update the task status to 'archive'
			await updateDoc(taskRef, {
				status: "archive", // Change status to 'archive'
			});

			// Optionally, remove the task from the local state
			setTasks((prevTasks) =>
				prevTasks.map((task) =>
					task.id === taskId ? { ...task, status: "archive" } : task
				)
			);

			showAlert("success", "Task has been archived.");
		} catch (error) {
			console.error("Unable to move to archive.", error);
			showAlert("error", "Failed to archive the task.");
		}
	};

	const groupFilesByFolder = (files: { fileUpload: FileUpload[] }) => {
		return files.fileUpload.reduce((acc, file) => {
			if (acc[file.folder]) {
				acc[file.folder].push(file.filePath);
			} else {
				acc[file.folder] = [file.filePath];
			}
			return acc;
		}, {} as Record<string, string[]>);
	};

	const groupedDownloadFiles = groupFilesByFolder({
		fileUpload: downloadedFiles as FileUpload[],
	});

	const getAccessibleFolders = (role: AuthRole): AuthRole | string[] => {
		return folderAccessByRole[role] || [];
	};

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
			showAlert("error", "There was an error downloading the file.");
		}
	};

	const ensureHttps = (url: string): string => {
		if (!/^https?:\/\//i.test(url)) {
			return `https://${url}`;
		}
		return url;
	};

	const handleEditSubmit = async () => {
		try {
			// Delete the files from Firebase that are marked for deletion
			for (const file of filesMarkedForDeletion) {
				await deleteFileFromStorage(file);
			}

			const taskRef = doc(db, "tasks", id);

			// Check if a file has been selected for upload
			let fileUrl = null;
			if (selectedFile) {
				fileUrl = await clientFileUpload(containerTitle, selectedFile as File);
			}

			const taskDoc = await getDoc(taskRef);
			const currentFileUpload = taskDoc.data()?.fileUpload || [];

			const updatedFileUpload = currentFileUpload.filter(
				(file: FileUpload) => !filesMarkedForDeletion.includes(file.filePath)
			);

			if (fileUrl) {
				updatedFileUpload.push({ folder: containerTitle, filePath: fileUrl });
			}

			const sanitizedLink = ensureHttps(editLink);

			// Update Firestore document, include the new file URL only if a file was uploaded
			const updatedFields: Partial<Task> = {
				title: editedTitle,
				link: sanitizedLink,
				dueDate: localDueDateInput ? new Date(localDueDateInput) : dueDate,
				fileUpload: updatedFileUpload,
			};

			setEditLink(sanitizedLink);

			await updateDoc(taskRef, updatedFields);
		} catch (error) {
			console.error("Error updating task:", error);

			showAlert("info", "There was an error updating the task.");
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

	if (isDragging) {
		return <></>;
	}

	return role === null ? null : (
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
					<Badge className="text-[8px] bg-black text-white hover:bg-gray-800">
						Created: {formatDate(createdAt)}
					</Badge>

					<Badge className="text-[8px] bg-black text-white hover:bg-gray-800">
						Due: {formattedDate ? formattedDate.toString() : "loading"}
					</Badge>
				</div>
				<div className="w-full flex justify-evenly items-center gap-2 pt-2">
					{status === "done" ? null : (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									size={"xs"}
									onClick={(e) => {
										e.stopPropagation();
									}}
									className="text-[8px] bg-black text-white hover:bg-gray-800"
								>
									Edit
								</Button>
							</DialogTrigger>

							<DialogContent className="max-h-[95%]">
								<DialogHeader className="text-sidebartx">
									<DialogTitle className="p-2">Edit Task</DialogTitle>
									<DialogDescription className="text-sidebartx p-2">
										Modify the task details below.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 p-2">
									<div>
										<label className="block text-sm font-medium ">Title</label>
										<input
											type="text"
											value={editedTitle}
											onChange={(e) => setEditedTitle(e.target.value)}
											className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium ">
											Due Date
										</label>
										<input
											type="date"
											value={(localDueDateInput as string) || ""}
											min={today}
											onChange={(e) => setLocalDueDateInput(e.target.value)}
											className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
										/>
									</div>
									{status === "pricing" ? (
										<div>
											<label className="block text-sm font-medium ">
												Pricing Link
											</label>
											<input
												type="url"
												placeholder="Enter url link"
												value={editLink}
												onChange={(e) => setEditLink(e.target.value)}
												className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
											/>
										</div>
									) : (
										<>
											<div>
												<label className="block text-sm font-medium ">
													Uploaded Files
												</label>
												{downloadedFiles.length > 0 ? (
													<ul className="mt-2 space-y-2 bg-white px-2 py-1 h-[50px] overflow-y-scroll">
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
																			className="cursor-pointer text-black mr-1"
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
										</>
									)}
								</div>
								<div className="flex justify-end gap-4">
									<Button onClick={handleEditSubmit} size={"xs"}>
										<DialogClose>Save</DialogClose>
									</Button>

									<Button onClick={handleCancelEdit} size={"xs"}>
										<DialogClose>Cancel</DialogClose>
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					)}

					{status === "done" ? (
						<Button
							size={"xs"}
							className="text-[8px] bg-black  text-white hover:bg-gray-800"
							onClick={(e) => {
								e.stopPropagation();
								moveToArchive(task.id);
							}}
						>
							Archive
						</Button>
					) : role === "client" || role === "admin" ? (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									size={"xs"}
									className="text-[8px] bg-black  text-white hover:bg-gray-800"
								>
									Remove
								</Button>
							</DialogTrigger>

							<DialogContent>
								<div className="text-cn">
									<p>Are you sure you want to remove the task?</p>
								</div>
								<div className="flex justify-end items-center gap-4">
									<Button
										size={"sm"}
										onClick={(e) => {
											e.stopPropagation();

											removeTask(task.id);
										}}
									>
										<DialogClose>Proceed</DialogClose>
									</Button>
									<Button size={"sm"} asChild>
										<DialogClose>Cancel</DialogClose>
									</Button>
								</div>
							</DialogContent>
						</Dialog>
					) : null}

					{status === "done" ? (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									size={"xs"}
									onClick={(e) => e.stopPropagation()}
									className="text-[8px] bg-black text-white hover:bg-gray-800"
								>
									View Link
								</Button>
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>File Link</DialogTitle>
									<DialogDescription>
										Here&apos;s the link for the CSV file.
									</DialogDescription>
								</DialogHeader>
								{link ? (
									<div>
										<Link href={link as string} target="_blank">
											{link}
										</Link>
									</div>
								) : null}

								<DialogClose asChild>
									<Button>Close</Button>
								</DialogClose>
							</DialogContent>
						</Dialog>
					) : (
						<Dialog>
							<DialogTrigger asChild>
								<Button
									size={"xs"}
									onClick={(e) => e.stopPropagation()}
									className="text-[8px] bg-black text-white hover:bg-gray-800"
								>
									View Files
								</Button>
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>Attached Files</DialogTitle>
									<DialogDescription>
										Here are the files attached to this task. You can download
										them below.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 overflow-y-scroll max-h-60">
									{Object.keys(groupedDownloadFiles).length > 0 ? (
										Object.keys(groupedDownloadFiles)
											.filter((folder) =>
												getAccessibleFolders(role as AuthRole).includes(
													folder
												)
											)
											.map((folder) => (
												<div key={folder}>
													<h4 className="font-bold">{folder}</h4>
													{groupedDownloadFiles[folder].map(
														(filePath, index) => (
															<div
																key={index}
																className="flex items-center justify-between"
															>
																<p className="truncate">
																	{getFilenameFromUrl(filePath)}
																</p>
																<p
																	className="text-foreground underline cursor-pointer"
																	onClick={() =>
																		handleDownload(filePath)
																	}
																>
																	Download
																</p>
															</div>
														)
													)}
												</div>
											))
									) : (
										<p>No files available for download.</p>
									)}
								</div>
								<DialogClose asChild>
									<Button className="mt-4">Close</Button>
								</DialogClose>
							</DialogContent>
						</Dialog>
					)}
				</div>
			</div>
		</Card>
	);
};
