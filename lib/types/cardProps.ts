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

export interface CardContextProps {
	dueDateInput: string | Date;
	openFileModal: boolean;
	openCreateTaskModal: boolean;
	rawTasks: Task[];
	fileList: FileUpload[];
	file: File | null;
	taskTitle: string;
	setTaskTitle: (taskTitle: string) => void;
	setFile: (file: File | null) => void;
	setDueDateInput: (event: string) => void;
	handleViewFiles: () => Promise<void>;
	modalHandler: () => void;
	handleAddTask: () => void;
	setOpenCreateTaskModal: (taskModal: boolean) => void;
}

export type TaskStatus = "raw" | "filtering" | "pricing" | "done";
