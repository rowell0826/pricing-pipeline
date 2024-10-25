import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { useCard } from "@/lib/context/cardContext/CardContext";
import { useState } from "react";
import { useAuth } from "@/lib/context/authContext/AuthContext";
import { Task } from "@/lib/types/cardProps";
import { clientFileUpload, db } from "@/lib/utils/firebase/firebase";
import { addDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";

const Modal: React.FC = () => {
	const {
		file,
		setFile,
		setTaskTitle,
		taskTitle,
		openCreateTaskModal,
		setOpenCreateTaskModal,
		setTasks,
	} = useCard();

	const [dueDateInput, setDueDateInput] = useState<string | Date>("");
	const { userName, role } = useAuth();
	const { showAlert } = useTheme();

	// Function to add a new task to the state
	const handleAddTask = async () => {
		try {
			if (!file) {
				showAlert("info", "Please upload a file before adding a task.");
				return;
			}

			const fileUrl = await clientFileUpload("raw", file);

			// Check if the upload succeeded
			if (!fileUrl) {
				showAlert("error", "Error uploading file. Please try again.");
				return;
			}

			// Ensure the user role is either 'client' or 'admin'
			if ((fileUrl && role === "client") || (fileUrl && role === "admin")) {
				// Ensure task title and due date are provided
				if (taskTitle && dueDateInput) {
					const newTask: Omit<Task, "id" | "link"> = {
						title: taskTitle,
						createdAt: new Date(),
						createdBy: userName as string,
						dueDate: new Date(dueDateInput),
						fileUpload: [{ folder: "raw", filePath: fileUrl }],
						status: "raw",
					};

					const docRef = await addDoc(collection(db, "tasks"), newTask);

					await updateDoc(docRef, { id: docRef.id });

					// Update the document with its ID
					const taskDocs = await getDocs(collection(db, "tasks"));
					const updatedTasks = taskDocs.docs.map((doc) => {
						const data = doc.data() as Omit<Task, "id">;
						return {
							id: doc.id,
							...data,
						};
					});
					setTasks(updatedTasks);

					showAlert("success", "Task added successfully!");

					// Reset the form/modal state
					setDueDateInput(new Date());
					setOpenCreateTaskModal(!openCreateTaskModal);
					setTaskTitle("");
					setFile(null);
				} else {
					showAlert("info", "Please provide a task title and due date.");
				}
			} else {
				showAlert("error", "You do not have permission to add a task.");
			}
		} catch (error) {
			console.error("Error adding task:", error);

			showAlert("error", "There was an error adding the task. Please try again.");
		}
	};

	return (
		<Dialog open={openCreateTaskModal} onOpenChange={setOpenCreateTaskModal}>
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
						Due Date:{"  "}
						<input
							type="date"
							value={dueDateInput.toString()}
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
					<Button onClick={() => setOpenCreateTaskModal(false)}>Cancel</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
