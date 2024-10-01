import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types/cardProps";
import { FaFile } from "react-icons/fa";
import { Button } from "../ui/button";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/utils/firebase/firebase";

const CardComponent: React.FC<{ task: Task; onRemove: (taskId: string) => void }> = ({
	task,
	onRemove,
}) => {
	const { id, title, createdAt, createdBy, dueDate, downloads } = task;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [downloadedFiles, setDownloadedFiles] = useState<string[]>(downloads || []);

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

	const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	};

	console.log("Task:", task);
	console.log("Task downloads:", downloads);
	console.log("Downloaded Files:", downloadedFiles);

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
		<Card key={id} className="w-full h-[250px]">
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
					<Button>Edit</Button>
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
											<Link
												href={url}
												download
												className="text-foreground underline"
												target="_blank"
												rel="noopener noreferrer"
											>
												Download
											</Link>
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
