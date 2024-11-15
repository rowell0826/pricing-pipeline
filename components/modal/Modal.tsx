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
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";
import { generateUniqueId } from "@/lib/utils/helperFunc";
import { webHookMessage } from "@/lib/utils/discord/discordWebhook";

const Modal: React.FC = () => {
	const {
		file,
		setFile,
		setTaskTitle,
		taskTitle,
		openCreateTaskModal,
		setOpenCreateTaskModal,
		setTasks,
		editLink,
		setEditLink,
		ensureHttps,
	} = useCard();

	const [dueDateInput, setDueDateInput] = useState<string | Date>("");
	const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
	const { userName, role } = useAuth();
	const { showAlert } = useTheme();

	const today = new Date().toISOString().split("T")[0];

	// Function to add a new task to the state
	const handleAddTask = async () => {
		try {
			if (isAddingTask) return;

			setIsAddingTask(true);

			if (!file) {
				showAlert("info", "Please upload a file before adding a task.");
				setIsAddingTask(false);
				return;
			}

			const fileUrl = await clientFileUpload("raw", file);

			// Check if the upload succeeded
			if (!fileUrl) {
				showAlert("error", "Error uploading file. Please try again.");
				setIsAddingTask(false);
				return;
			}

			const taskId = generateUniqueId();
			const sanitizedLink = ensureHttps(editLink);

			// Ensure the user role is either 'client' or 'admin'
			if ((fileUrl && role === "client") || (fileUrl && role === "admin")) {
				// Ensure task title and due date are provided
				if (taskTitle && dueDateInput) {
					const dueDate = new Date(dueDateInput);

					const newTask: Task = {
						id: taskId,
						title: taskTitle,
						createdAt: new Date(),
						createdBy: userName as string,
						dueDate: dueDate,
						link: sanitizedLink,
						fileUpload: [{ folder: "raw", filePath: fileUrl }],
						status: "raw",
					};

					// Add the task to Firestore
					await setDoc(doc(db, "tasks", taskId), newTask, { merge: true });

					// Update local state immediately
					setTasks((prevTasks) => [...prevTasks, newTask]);

					showAlert("success", "Task added successfully!");

					webHookMessage({
						title: taskTitle,
						message: `**Task has been created by ${userName}.**`,
						link: sanitizedLink,
					});

					// Reset the form/modal state
					setDueDateInput(new Date());
					setOpenCreateTaskModal(!openCreateTaskModal);
					setEditLink("");
					setTaskTitle("");
					setFile(null);
				} else {
					showAlert("info", "Please provide a task title and due date.");
					setIsAddingTask(false);
					return;
				}
			} else {
				showAlert("error", "You do not have permission to add a task.");
				setIsAddingTask(false);
				return;
			}
		} catch (error) {
			console.error("Error adding task:", error);

			setIsAddingTask(false);

			showAlert("error", "There was an error adding the task. Please try again.");
		} finally {
			setIsAddingTask(false);
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
							min={today}
							onChange={(e) => setDueDateInput(e.target.value)}
							className="mt-1 border rounded px-2 py-1 !text-black"
						/>
					</label>
					<label className="text-foreground">
						Pricing spreadsheet link:{" "}
						<input
							type="url"
							placeholder="Enter url link"
							value={editLink}
							onChange={(e) => setEditLink(e.target.value)}
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
					<Button onClick={handleAddTask} disabled={isAddingTask}>
						Add Task
					</Button>
					<Button onClick={() => setOpenCreateTaskModal(false)}>Cancel</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Modal;
