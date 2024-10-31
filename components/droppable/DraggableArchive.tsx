import { FileUpload, Task } from "@/lib/types/cardProps";
import { db, storage } from "@/lib/utils/firebase/firebase";
import { useDraggable } from "@dnd-kit/core";
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { deleteObject, getDownloadURL, getStorage, ref } from "firebase/storage";
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

	getInitials: (name: string) => string;
}

const folderAccessByRole: Record<AuthRole, string[]> = {
	admin: ["raw", "filtering", "pricing", "done"],
	client: ["raw", "pricing", "done"],
	dataManager: ["raw", "filtering"],
	dataQA: ["filtering"],
	dataScientist: ["filtering", "pricing"],
	promptEngineer: ["filtering", "pricing"],
};

export const DraggableArchiveCard = (props: React.PropsWithChildren<DraggableProps>) => {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: props.id,
	});

	const { task, getInitials } = props;
	const { id, title, createdAt, createdBy, link } = task;
	const { role } = useAuth();
	const { setTasks } = useCard();
	const { showAlert } = useTheme();

	// Declare the style object and cast it as React.CSSProperties
	const style: React.CSSProperties = {
		transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
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

	const [formattedDate, setFormattedDate] = useState<Date | string>("");

	const [downloadedFiles, setDownloadedFiles] = useState<(string | File | FileUpload)[]>([]);

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

		try {
			// Retrieve task data to access fileUpload paths
			const taskSnapshot = await getDoc(taskDocRef);
			const taskDetails = taskSnapshot.data();

			if (!taskDetails) throw new Error("Task data not found.");

			const taskFileStorage = taskDetails.fileUpload;

			// Delete the task document in Firestore
			await deleteDoc(taskDocRef);

			// Delete files from Firebase Storage
			await Promise.all(
				taskFileStorage.map(async (file: FileUpload) => {
					const fileRef = ref(storage, decodeURIComponent(file.filePath));
					await deleteObject(fileRef); // Delete each file
				})
			);

			// Update the task state to remove the deleted task from the UI
			setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

			showAlert("success", "Ticket deleted.");

			// dialogCloseRef.current?.click();
		} catch (error) {
			console.error("Error removing task: ", error);
			showAlert("error", "Failed to delete the task.");
		}
	};

	const moveToTaskCollection = async (taskId: string) => {
		const taskRef = doc(db, "tasks", taskId);

		try {
			const taskSnapshot = await getDoc(taskRef);

			if (!taskSnapshot.exists()) {
				throw new Error("Task does not exist.");
			}

			const taskData = taskSnapshot.data();

			// Update the task status to "done"
			const updatedTaskData = {
				...taskData,
				status: "done", // Change the status to "done"
			};

			// Update the task in the archive collection
			await setDoc(taskRef, updatedTaskData);

			// Optionally, if you want to update the local state to reflect this change
			setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

			showAlert("success", "Task has been unarchive.");
		} catch (error) {
			console.error("Unable to unarchive the task.", error);
			showAlert("error", "Failed to mark the task as done.");
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

	if (isDragging) {
		return <></>;
	}

	return role === null ? null : (
		<Card
			key={id}
			ref={setNodeRef}
			style={style}
			{...attributes}
			className="h-[120px] min-w-[250px] max-w-[300px] rounded-md bg-white"
		>
			<CardHeader className="h-[35%] py-2" {...listeners}>
				<CardTitle className="text-left text-xs text-black">{title}</CardTitle>
				<Avatar className="mr-2 w-6 h-6 -top-1">
					<AvatarFallback className="text-xs">{getInitials(createdBy)}</AvatarFallback>
				</Avatar>
			</CardHeader>

			<div className="p-2 mt-2 rounded-md">
				<div className="flex justify-evenly items-center">
					<Badge className="text-[8px] bg-black text-white hover:bg-gray-800">
						Created: {formatDate(createdAt)}
					</Badge>

					<Badge className="text-[8px] bg-black text-white hover:bg-gray-800">
						Due: {formattedDate ? formattedDate.toString() : "loading"}
					</Badge>
				</div>
				<div className="w-full flex justify-evenly items-center gap-2 pt-2">
					{role === "admin" ? (
						<>
							<Button
								size={"xs"}
								className="text-[8px] bg-black  text-white hover:bg-gray-800"
								onClick={(e) => {
									e.stopPropagation();
									moveToTaskCollection(task.id);
								}}
							>
								Unarchive
							</Button>
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
									<div className="text-center">
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
						</>
					) : null}

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
									Here are the files attached to this task. You can download them
									below.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4 overflow-y-scroll max-h-60">
								{Object.keys(groupedDownloadFiles).length > 0 ? (
									Object.keys(groupedDownloadFiles)
										.filter((folder) =>
											getAccessibleFolders(role as AuthRole).includes(folder)
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
				</div>
			</div>
		</Card>
	);
};
