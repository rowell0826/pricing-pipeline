"use client";
import { CardContextProps, Task } from "@/lib/types/cardProps";
import { createContext, useContext, useState } from "react";
import { useAuth } from "../authContext/AuthContext";

import { useTheme } from "../themeContext/ThemeContext";

const CardContext = createContext<CardContextProps | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [file, setFile] = useState<File | null>(null);
	const [openCreateTaskModal, setOpenCreateTaskModal] = useState<boolean>(false);
	const [taskTitle, setTaskTitle] = useState<string>("");
	const [tasks, setTasks] = useState<Task[]>([]); //Task in "Raw folder"

	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	const { role } = useAuth();
	const { showAlert } = useTheme();

	const sortFilter = (key: string) => {
		setSortConfig((prevConfig) => {
			const newOrder = prevConfig.key === key && prevConfig.order === "asc" ? "desc" : "asc";
			return { key, order: newOrder };
		});
	};

	const modalHandler = () => {
		if (role === "admin" || role === "client") {
			setOpenCreateTaskModal(!openCreateTaskModal);
		} else {
			showAlert("warning", "You're not authorized to create task");
		}
	};

	return (
		<CardContext.Provider
			value={{
				openCreateTaskModal,
				sortConfig,
				tasks,
				file,
				taskTitle,
				setSortConfig,
				setTaskTitle,
				setTasks,
				setFile,
				modalHandler,
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
