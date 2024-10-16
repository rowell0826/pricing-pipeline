import { Dispatch, SetStateAction } from "react";

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
	filteredTasks: Task[];
	pricingTasks: Task[];
	done: Task[];
	fileList: FileUpload[];
	file: File | null;
	taskTitle: string;
	setTaskTitle: Dispatch<SetStateAction<string>>;
	setRawTasks: Dispatch<SetStateAction<Task[]>>;
	setFilteredTasks: Dispatch<SetStateAction<Task[]>>;
	setPricingTasks: Dispatch<SetStateAction<Task[]>>;
	setDone: Dispatch<SetStateAction<Task[]>>;
	setFile: Dispatch<SetStateAction<File | null>>;
	setDueDateInput: Dispatch<SetStateAction<string | Date>>;
	handleViewFiles: () => Promise<void>;
	modalHandler: () => void;
	handleAddTask: () => void;
	setOpenCreateTaskModal: Dispatch<SetStateAction<boolean>>;
}
export type TaskStatus = "raw" | "filtering" | "pricing" | "done";
