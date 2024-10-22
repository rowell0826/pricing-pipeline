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
import { addDoc, collection, updateDoc } from "firebase/firestore";

const Modal: React.FC = () => {
	const {
		file,
		setFile,
		setTaskTitle,
		taskTitle,
		openCreateTaskModal,
		setOpenCreateTaskModal,
		setRawTasks,
	} = useCard();

	const [dueDateInput, setDueDateInput] = useState<string | Date>("");
	const { user, userName, role } = useAuth();

	// Function to add a new task to the state
	const addTaskToClientInput = (taskTitle: string) => {
		const createdBy = user ? user.displayName || user.uid : "Anonymous";

		if (role === "admin" || role === "client") {
			const newTask: Task = {
				id: Date.now().toString(),
				title: taskTitle,
				createdBy: createdBy,
				createdAt: new Date(),
				dueDate: null,
				fileUpload: [],
				status: "raw",
			};

			setRawTasks((prevTasks) => [...prevTasks, newTask]);
		} else {
			alert("You do not have permission to add a task.");
		}
	};

	const handleAddTask = async () => {
		try {
			if (!file) {
				alert("Please upload a file before adding a task.");
				return;
			}

			const fileUrl = await clientFileUpload("raw", file);

			// Check if the upload succeeded
			if (!fileUrl) {
				alert("Error uploading file. Please try again.");
				return;
			}

			// Ensure the user role is either 'client' or 'admin'
			if ((fileUrl && role === "client") || (fileUrl && role === "admin")) {
				console.log("Due Date Input: ", dueDateInput);

				// Ensure task title and due date are provided
				if (taskTitle && dueDateInput) {
					const docRef = await addDoc(collection(db, "raw"), {
						title: taskTitle,
						createdAt: new Date(),
						createdBy: userName,
						dueDate: new Date(dueDateInput),
						fileUpload: [{ folder: "raw", filePath: fileUrl }],
					});

					// Update the document with its ID
					const documentId = docRef.id;
					await updateDoc(docRef, { id: documentId });

					alert("Task added successfully!");

					addTaskToClientInput(taskTitle);
					setDueDateInput(new Date());
					setOpenCreateTaskModal(!openCreateTaskModal);
					setTaskTitle("");
					setFile(null);
				} else {
					alert("Please provide a task title and due date.");
				}
			} else {
				alert("You do not have permission to add a task.");
			}
		} catch (error) {
			console.error("Error adding task:", error);
			alert("There was an error adding the task. Please try again.");
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
