import { FileUpload } from "./cardProps";

export interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	taskTitle: string;
	setTaskTitle: (title: string) => void;
	dueDateInput: string | Date;
	setDueDateInput: (date: string) => void;
	file: File | null;
	setFile: (file: File | null) => void;
	handleAddTask: () => Promise<void>;
}


export interface FileListModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fileList: FileUpload[]; // Updated type
}
