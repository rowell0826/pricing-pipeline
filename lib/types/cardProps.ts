export interface Task {
	id: string;
	title: string;
	createdBy: string;
	createdAt: Date | null;
	dueDate: Date | null;
	fileUpload: string[];
	status: TaskStatus;
}

export type TaskStatus = "raw" | "filtering" | "pricing" | "done";
