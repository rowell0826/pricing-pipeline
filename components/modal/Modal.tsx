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
				<DialogTitle className="text-foreground">Create a New Task</DialogTitle>
				<DialogDescription className="flex flex-col justify-center items-start gap-2">
					<label className="text-foreground">
						Task Title:{"  "}
						<input
							type="text"
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
							className="mt-1 border rounded px-2 py-1 !text-black"
						/>
					</label>
					<label className="text-foreground">
						Due Date (MM/DD/YYYY):{"  "}
						<input
							type="date"
							value={dueDateInput}
							onChange={(e) => setDueDateInput(e.target.value)}
							className="mt-1 border rounded px-2 py-1 !text-black"
						/>
					</label>
					<label className="text-foreground">
						Upload File:{"  "}
						<input
							type="file"
							onChange={(e) => setFile(e.target.files?.[0] || null)}
							className="mt-1 border rounded px-2 py-1 !text-black"
						/>
					</label>
					{file && <p>Selected File: {file.name}</p>}
				</DialogDescription>
				<div className="flex justify-end gap-4">
					<Button onClick={handleAddTask}>Add Task</Button>
					<Button onClick={() => onOpenChange(false)}>Cancel</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
