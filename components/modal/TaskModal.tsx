import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

const TaskModal: React.FC = () => {
	return (
		<Dialog>
			<DialogOverlay />
			<DialogContent>
				<DialogTitle></DialogTitle>
				<DialogDescription></DialogDescription>
				<Button></Button>
			</DialogContent>
			Task Modal
		</Dialog>
	);
};

export default TaskModal;
