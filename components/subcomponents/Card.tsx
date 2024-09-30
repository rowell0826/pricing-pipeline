import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types/cardProps";
import { FaFile } from "react-icons/fa";
import { Button } from "../ui/button";
import { Timestamp } from "firebase/firestore";

const CardComponent: React.FC<{ task: Task }> = ({ task }) => {
	const { title, createdAt, createdBy, dueDate, downloads } = task;

	const formatDate = (date: Date | null | Timestamp) => {
		if (!date) return "Unknown Date";

		// Check if the date is a Firestore Timestamp
		if (date instanceof Timestamp) {
			return date.toDate().toLocaleDateString(); // Convert to Date and format
		}

		// If it's already a Date object
		if (date instanceof Date) {
			return date.toLocaleDateString();
		}

		return "Unknown Date"; // Fallback
	};

	/* const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	}; */

	return (
		<Card className="w-full h-[250px]">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{createdBy}</CardDescription>
			</CardHeader>
			<CardContent>
				<ul>
					{downloads.length > 0 ? (
						<li className="flex items-center">
							<FaFile className="mr-2" />
							Number of Files: {downloads.length}
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
					<Button>Remove</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default CardComponent;
