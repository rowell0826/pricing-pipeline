export interface Task {
	id: string;
	title: string;
	createdBy: string;
	createdAt: Date | null;
	dueDate: Date | null;
	fileUpload: (string | File | FileUpload)[];
	status: TaskStatus;
}

export interface FileUpload {
	folder: string;
	filePath: string;
}

export type TaskStatus = "raw" | "filtering" | "pricing" | "done";
