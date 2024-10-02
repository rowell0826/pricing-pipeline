"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import CardComponent from "@/components/subcomponents/Card";
import { Task } from "@/lib/types/cardProps";
import { auth, db } from "@/lib/utils/firebase/firebase";
import { BiSolidSortAlt } from "react-icons/bi";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
	DropdownMenuItem,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SortList {
	input: string;
	filterBy: string;
}

interface ContainerList {
	input: string;
}

const sortCategories: SortList[] = [
	{
		input: "Sort by Task",
		filterBy: "title",
	},
	{
		input: "Sort by Owner",
		filterBy: "createdBy",
	},
	{
		input: "Sort by Date Created",
		filterBy: "createdAt",
	},
	{
		input: "Sort by Due Date",
		filterBy: "dueDate",
	},
];

const cardContainer: ContainerList[] = [
	{ input: "Raw files" },
	{ input: "Filtering" },
	{ input: "Pricing" },
	{ input: "Done" },
];

export default function Home() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	// Function to add a new task to the state
	const addTaskToClientInput = (taskTitle: string) => {
		const currentUser = auth.currentUser;

		const createdBy = currentUser ? currentUser.displayName || currentUser.uid : "Anonymous";

		const newTask: Task = {
			id: Date.now().toString(),
			title: taskTitle,
			createdBy: createdBy,
			createdAt: new Date(),
			dueDate: null,
			downloads: [],
		};

		setTasks((prevTasks) => [...prevTasks, newTask]);
	};

	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const q = query(collection(db, "tasks"), orderBy(sortConfig.key, sortConfig.order));
				const querySnapshot = await getDocs(q);
				const fetchedTasks = querySnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const downloads = data.fileUpload;
					const title = data.title;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						downloads,
						dueDate,
					} as Task;
				});

				setTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [sortConfig.key, sortConfig.order]);

	const sortFilter = (key: string) => {
		setSortConfig((prevConfig) => {
			const newOrder = prevConfig.key === key && prevConfig.order === "asc" ? "desc" : "asc";
			return { key, order: newOrder };
		});
	};

	const removeTask = async (taskID: string) => {
		const taskDocRef = doc(db, "tasks", taskID);

		try {
			await deleteDoc(taskDocRef);
			setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen">
				<SideBar onAddTask={addTaskToClientInput} />

				<main className="w-full flex justify-center mt-20">
					<div className="grid grid-cols-1 md:grid-cols-2 w-full h-full gap-2 p-4 overflow-y-scroll">
						{cardContainer.map(({ input }, idx) => (
							<div
								className="border-2 border-zinc-800 w-[400px] h-[300px] md:h-[350px] text-center flex flex-col justify-start items-center rounded-md text-foreground bg-white/10 backdrop-blur-lg shadow-lg"
								key={idx}
							>
								<h3 className="p-4">{input}</h3>
								<div className="w-full flex justify-end items-center p-2">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button className="mr-2">
												<BiSolidSortAlt />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent>
											<DropdownMenuGroup>
												{sortCategories.map(({ input, filterBy }, idx) => (
													<DropdownMenuItem
														onClick={() => sortFilter(filterBy)}
														className="cursor-pointer"
														key={idx}
													>
														{input}
													</DropdownMenuItem>
												))}
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{idx === 0 && (
									<ul className="overflow-y-scroll min-w-[300px] w-[350px] flex flex-col gap-2 justify-start items-center rounded-md custom-scrollbar scrollbar-hidden border-2 border-border">
										{tasks.map((task, index) => (
											<CardComponent
												key={index}
												task={task}
												onRemove={removeTask}
											/>
										))}
									</ul>
								)}
							</div>
						))}
					</div>
				</main>
			</div>
		</PrivateRoute>
	);
}
