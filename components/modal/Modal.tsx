import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { ModalProps } from "@/lib/types/modalProps";

const Modal: React.FC<ModalProps> = ({
	open,
	onOpenChange,
	taskTitle,
	setTaskTitle,
	dueDateInput,
	setDueDateInput,
	file,
	setFile,
	handleAddTask,
}) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogOverlay />
			<DialogContent>
				<DialogTitle>Create a New Task</DialogTitle>
				<DialogDescription>
					<label>
						Task Title:
						<input
							type="text"
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
						/>
					</label>
					<label>
						Due Date (MM/DD/YYYY):
						<input
							type="text"
							value={dueDateInput}
							onChange={(e) => setDueDateInput(e.target.value)}
						/>
					</label>
					<label>
						Upload File:
						<input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
					</label>
					{file && <p>Selected File: {file.name}</p>}
				</DialogDescription>
				<div className="flex justify-end">
					<Button onClick={handleAddTask}>Add Task</Button>
					<Button onClick={() => onOpenChange(false)}>Cancel</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
