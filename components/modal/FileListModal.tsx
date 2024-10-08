import { FileListModalProps } from "@/lib/types/modalProps";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

const FileListModal: React.FC<FileListModalProps> = ({ open, onOpenChange, fileList }) => {
	/* const getFilenameFromUrl = (url: string | undefined) => {
		if (!url) {
			return "unknown_filename"; // Handle undefined or empty URL
		}

		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	}; */

	const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	};

	// Function to group files by folder type
	const groupFilesByFolder = (files: { url: string; folderType: string }[]) => {
		return files.reduce((acc, { url, folderType }) => {
			if (!acc[folderType]) {
				acc[folderType] = [];
			}
			acc[folderType].push(url);
			return acc;
		}, {} as Record<string, string[]>);
	};

	const groupedFiles = groupFilesByFolder(fileList);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-foreground">Uploaded Files</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					{Object.keys(groupedFiles).length > 0 ? (
						Object.entries(groupedFiles).map(([folderType, urls]) => (
							<div key={folderType}>
								<h2 className="font-semibold">{folderType}</h2>
								{urls.map((url, idx) => (
									<a
										key={idx}
										href={url}
										target="_blank"
										rel="noopener noreferrer"
										className="block text-foreground underline"
									>
										{getFilenameFromUrl(url)}
									</a>
								))}
							</div>
						))
					) : (
						<p>No files uploaded yet.</p>
					)}
				</div>

				<DialogClose asChild>
					<Button className="mt-4 w-full text-sidebartx py-2 px-4 rounded">Close</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
};

export default FileListModal;
