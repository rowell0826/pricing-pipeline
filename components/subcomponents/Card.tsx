import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/lib/types/cardProps";
import Link from "next/link";
import { FaFile } from "react-icons/fa";
import { Button } from "../ui/button";

const CardComponent: React.FC<{ task: Task }> = ({ task }) => {
	const { title, createdAt, createdBy, dueDate, downloads } = task;

	const formatDate = (date: Date | null) => {
		if (!date) return "Unknown Date";
		return date.toLocaleDateString();
	};

	const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ul>
					{downloads.length > 0 ? (
						downloads.map((fileUrl, index) => (
							<li key={index} className="flex items-center">
								<FaFile className="mr-2" />
								{getFilenameFromUrl(fileUrl)}
							</li>
						))
					) : (
						<p>No files uploaded.</p>
					)}
					<div className="flex justify-between">
						<span className="text-xs text-slate-500">Created At:</span>
						<span className="text-xs text-slate-500">{formatDate(createdAt)}</span>
					</div>
				</ul>
				<div>
					<Button>Edit</Button>
					<Button>Remove</Button>
				</div>
			</CardContent>
		</Card>
	);
};

export default CardComponent;
