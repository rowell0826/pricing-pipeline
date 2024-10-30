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
import { useTheme } from "@/lib/context/themeContext/ThemeContext";

const NEXT_PUBLIC_DISCORD_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK;

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
	const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
	const { userName, role } = useAuth();
	const { showAlert } = useTheme();

	const today = new Date().toISOString().split("T")[0];

	const webHookMessageTaskCreation = async (title: string, message: string) => {
		try {
			const res = await fetch(NEXT_PUBLIC_DISCORD_WEBHOOK as string, {
				method: "POST",
				headers: {
					"Content-type": "application/json",
				},
				body: JSON.stringify({
					content: message,
					embeds: [
						{
							title: title,
							description: "Please go to the link provided below.",
							color: 3447003,
							fields: [
								{
									name: "Barker Pricing Pipeline",
									value: "https://pricing-pipeline-alpha.vercel.app/",
									inline: true,
								},
							],
						},
					],
				}),
			});

			if (!res.ok) {
				throw new Error("Failed to send message to Discord");
			}
		} catch (error) {
			console.log("Error sending discord: ", error);
		}
	};

	const generateUniqueId = (length = 5) => {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		const numbers = "0123456789";

		if (length < 5) {
			throw new Error("Length must be at least 5 to accommodate 2 letters and 3 numbers.");
		}

		// Generate the first two letters
		let result = "";
		for (let i = 0; i < 2; i++) {
			result += letters.charAt(Math.floor(Math.random() * letters.length));
		}

		// Generate the remaining three numbers
		for (let i = 0; i < length - 2; i++) {
			result += numbers.charAt(Math.floor(Math.random() * numbers.length));
		}

		// Shuffle the result to randomize letter and number positions
		return shuffleString(result);
	};

	// Helper function to shuffle a string
	const shuffleString = (str: string) => {
		return str
			.split("")
			.sort(() => 0.5 - Math.random())
			.join("");
	};

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

			// Ensure the user role is either 'client' or 'admin'
			if ((fileUrl && role === "client") || (fileUrl && role === "admin")) {
				// Ensure task title and due date are provided
				if (taskTitle && dueDateInput) {
					const dueDate = new Date(dueDateInput);

					const newTask: Omit<Task, "link"> = {
						id: taskId,
						title: taskTitle,
						createdAt: new Date(),
						createdBy: userName as string,
						dueDate: dueDate, // Set dueDate immediately here
						fileUpload: [{ folder: "raw", filePath: fileUrl }],
						status: "raw",
					};

					// Add the task to Firestore
					const docRef = await addDoc(collection(db, "tasks"), newTask);

					// Update the document with its ID
					await updateDoc(docRef, { id: taskId }); // Add the ID if required

					// Update local state immediately
					setTasks((prevTasks) => [...prevTasks, { ...newTask, id: docRef.id } as Task]);

					showAlert("success", "Task added successfully!");

					webHookMessageTaskCreation(
						taskTitle,
						`**Task has been created by ${userName}.**`
					);

					// Reset the form/modal state
					setDueDateInput(new Date());
					setOpenCreateTaskModal(!openCreateTaskModal);
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
