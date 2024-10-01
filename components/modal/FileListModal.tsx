import { FileListModalProps } from "@/lib/types/modalProps";
import { Dialog } from "@radix-ui/react-dialog";
import { DialogClose, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";

const FileListModal: React.FC<FileListModalProps> = ({ open, onOpenChange, fileList }) => {
	const getFilenameFromUrl = (url: string) => {
		const urlParts = url.split("/");
		const filename =
			urlParts[urlParts.length - 1].split("?")[0].split("/").pop() || "unknown_filename";
		const decodedFilename = decodeURIComponent(filename).replace("raw/", "");

		return decodedFilename;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="text-foreground">Uploaded Files</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					{fileList.length > 0 ? (
						fileList.map((fileUrl, index) => (
							<a
								key={index}
								href={fileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="block text-blue-500 underline"
							>
								{getFilenameFromUrl(fileUrl)}
							</a>
						))
					) : (
						<p>No files uploaded yet.</p>
					)}
				</div>

				<DialogClose asChild>
					<Button className="mt-4 w-full text-white py-2 px-4 rounded">Close</Button>
				</DialogClose>
			</DialogContent>
		</Dialog>
	);
};

export default FileListModal;
