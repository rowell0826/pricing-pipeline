import { FileUpload } from "./cardProps";

export interface FileListModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fileList: FileUpload[]; // Updated type
}
