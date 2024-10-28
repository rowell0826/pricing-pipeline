import { FileListModalProps } from "@/lib/types/modalProps";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
// import { useEffect } from "react";

const FileListModal: React.FC<FileListModalProps> = ({ open, onOpenChange, fileList }) => {
	const getFilenameFromUrl = (url: string, removeSegment?: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";

		const decodedFilename = decodeURIComponent(filename);

		return removeSegment ? decodedFilename.replace(removeSegment, "") : decodedFilename;
	};

	// Function to group files by folder type
	const groupFilesByFolder = (files: { filePath: string; folder: string }[]) => {
		return files.reduce((acc, { filePath, folder }) => {
			if (!acc[folder]) {
				acc[folder] = [];
			}
			acc[folder].push(filePath);
			return acc;
		}, {} as Record<string, string[]>);
	};

	const groupedFiles = groupFilesByFolder(fileList);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[70%]">
				<DialogHeader>
					<DialogTitle className="text-foreground">Uploaded Files</DialogTitle>
				</DialogHeader>

				<div className="space-y-2 overflow-y-scroll">
					{Object.keys(groupedFiles).length > 0 ? (
						Object.entries(groupedFiles).map(([folderType, urls]) => (
							<div key={folderType}>
								<h2 className="font-semibold">{folderType}</h2>
								{urls.map((url, idx) => (
									<a
										key={`${folderType}-${idx}`}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="block text-foreground underline"
									>
										{getFilenameFromUrl(url, `${folderType}/`)}
									</a>
								))}
							</div>
						))
					) : (
						<p>No files uploaded yet.</p>
					)}
				</div>

				<DialogClose asChild>
					<Button className="mt-4 w-full text-background py-2 px-4 rounded">Close</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
};

export default FileListModal;
