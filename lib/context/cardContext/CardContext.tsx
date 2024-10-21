"use client";
import { CardContextProps, FileUpload, Task } from "@/lib/types/cardProps";
import { clientFileUpload, db, storage } from "@/lib/utils/firebase/firebase";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { createContext, useContext, useState } from "react";
import { useAuth } from "../authContext/AuthContext";
import { AuthRole } from "@/lib/types/authTypes";

const folderAccessByRole: Record<AuthRole, string[]> = {
	admin: ["raw", "filtering", "pricing", "done"],
	client: ["raw", "done"],
	dataManager: ["raw", "filtering"],
	dataQA: ["raw", "filtering"],
	dataScientist: ["pricing", "done"],
	promptEngineer: ["pricing", "done"],
};

const CardContext = createContext<CardContextProps | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [dueDateInput, setDueDateInput] = useState<string | Date>("");
	const [file, setFile] = useState<File | null>(null);
	const [openFileModal, setOpenFileModal] = useState<boolean>(false);
	const [openCreateTaskModal, setOpenCreateTaskModal] = useState<boolean>(false);
	const [taskTitle, setTaskTitle] = useState<string>("");
	const [rawTasks, setRawTasks] = useState<Task[]>([]); //Task in "Raw folder"
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]); //Task in "Filtered folder"
	const [pricingTasks, setPricingTasks] = useState<Task[]>([]); // Task in "Pricing folder"
	const [done, setDone] = useState<Task[]>([]); // Task in "Done folder"
	const [fileList, setFileList] = useState<FileUpload[]>([]);
	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	const { userName, role, user } = useAuth();

	const fetchFiles = async (role: AuthRole) => {
		try {
			// Get the accessible folders for the user's role
			const accessibleFolders = folderAccessByRole[role];

			// Variable to Store file objects with URLs and folder types
			let fileObjects: { filePath: string; folder: string }[] = [];

			// Loop through each accessible folder and fetch the files
			for (const folder of accessibleFolders) {
				// Create a storage reference to the folder
				const folderRef = ref(storage, `/${folder}`);

				// List all files in the folder
				const folderContents = await listAll(folderRef);

				// Fetch file URLs for the current folder and map them to the expected shape
				const filePaths = await Promise.all(
					folderContents.items.map(async (fileRef) => {
						const filePath = await getDownloadURL(fileRef);
						return { filePath, folder: folder };
					})
				);

				// Add the file objects from this folder to the overall list
				fileObjects = [...fileObjects, ...filePaths];
			}

			// Set the state with all fetched file objects
			setFileList(fileObjects);
		} catch (error) {
			console.error("Error fetching files: ", error);
		}
	};

	const handleViewFiles = async () => {
		if (role) {
			await fetchFiles(role as AuthRole);
		}
		setOpenFileModal(true);
	};

	const sortFilter = (key: string) => {
		setSortConfig((prevConfig) => {
			const newOrder = prevConfig.key === key && prevConfig.order === "asc" ? "desc" : "asc";
			return { key, order: newOrder };
		});
	};

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

	const modalHandler = () => {
		setOpenCreateTaskModal(!openCreateTaskModal);
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
				setDueDateInput(dueDateInput);
				console.log("Due Date Input: ", dueDateInput);

				// Ensure task title and due date are provided
				if (taskTitle && dueDateInput) {
					const docRef = await addDoc(collection(db, "raw"), {
						title: taskTitle,
						createdAt: new Date(),
						createdBy: userName,
						dueDate: new Date(dueDateInput),
						fileUpload: [{ folder: "raw", filePath: fileUrl }], // Use the file URL from the upload
					});

					// Update the document with its ID
					const documentId = docRef.id;
					await updateDoc(docRef, { id: documentId });

					alert("Task added successfully!");

					addTaskToClientInput(taskTitle);

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
		<CardContext.Provider
			value={{
				dueDateInput,
				openFileModal,
				openCreateTaskModal,
				sortConfig,
				rawTasks,
				filteredTasks,
				pricingTasks,
				done,
				fileList,
				file,
				taskTitle,
				setSortConfig,
				setTaskTitle,
				setRawTasks,
				setFilteredTasks,
				setPricingTasks,
				setDone,
				setFile,
				setDueDateInput,
				handleViewFiles,
				fetchFiles,
				modalHandler,
				handleAddTask,
				setOpenCreateTaskModal,
				sortFilter,
			}}
		>
			{children}
		</CardContext.Provider>
	);
};

export const useCard = (): CardContextProps => {
	const context = useContext(CardContext);

	if (!context) {
		throw new Error("useCard must be used within a CardProvider");
	}

	return context;
};
