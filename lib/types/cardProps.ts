import { Dispatch, SetStateAction } from "react";

export interface Task {
	id: string;
	title: string;
	createdBy: string;
	createdAt: Date | null;
	dueDate: Date | null;
	fileUpload: (string | File | FileUpload)[];
	link?: string;
	status: TaskStatus;
}

export interface ContainerList {
	id: string;
	items: Task[];
	setter: React.Dispatch<React.SetStateAction<Task[]>>;
}

export interface FileUpload {
	folder: string;
	filePath: string;
}

export interface SortList {
	input: string;
	filterBy: string;
}

export interface CardContextProps {
	openCreateTaskModal: boolean;
	sortConfig: { key: string; order: "asc" | "desc" };
	rawTasks: Task[];
	filteredTasks: Task[];
	pricingTasks: Task[];
	done: Task[];
	file: File | null;
	taskTitle: string;
	setSortConfig: Dispatch<SetStateAction<{ key: string; order: "asc" | "desc" }>>;
	setTaskTitle: Dispatch<SetStateAction<string>>;
	setRawTasks: Dispatch<SetStateAction<Task[]>>;
	setFilteredTasks: Dispatch<SetStateAction<Task[]>>;
	setPricingTasks: Dispatch<SetStateAction<Task[]>>;
	setDone: Dispatch<SetStateAction<Task[]>>;
	setFile: Dispatch<SetStateAction<File | null>>;
	modalHandler: () => void;
	setOpenCreateTaskModal: Dispatch<SetStateAction<boolean>>;
	sortFilter: (key: string) => void;
}

export type TaskStatus = "raw" | "filtering" | "pricing" | "done";
