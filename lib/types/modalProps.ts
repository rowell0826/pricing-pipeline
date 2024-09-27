export interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	taskTitle: string;
	setTaskTitle: (title: string) => void;
	dueDateInput: string;
	setDueDateInput: (date: string) => void;
	file: File | null;
	setFile: (file: File | null) => void;
	handleAddTask: () => Promise<void>; // Adjust based on your actual function type
}
