"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import CardComponent from "@/components/subcomponents/Card";
import { Task } from "@/lib/types/cardProps";
import { auth, db } from "@/lib/utils/firebase/firebase";
import { BiSolidSortAlt } from "react-icons/bi";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
	DropdownMenuItem,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Dnd Imports
import { DndContext, DragEndEvent } from "@dnd-kit/core";
// import { Droppable } from "@/components/droppable/Droppable";
import { Draggable } from "@/components/droppable/Draggable";
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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [tasks, setTasks] = useState<Task[]>([]);
	const [rawTasks, setRawTasks] = useState<Task[]>([]); // Tasks in "Raw files"
	const [userRole, setUserRole] = useState<string | null>(null);

	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	const currentUser = auth.currentUser;

	useEffect(() => {
		console.log("Raw tasks:", rawTasks);
	}, [rawTasks]);

	// Fetch user role
	useEffect(() => {
		if (currentUser) {
			const fetchUserRole = async () => {
				const userDocRef = doc(db, "users", currentUser.uid);
				const userSnapshot = await getDoc(userDocRef);

				if (userSnapshot.exists()) {
					const userData = userSnapshot.data();
					setUserRole(userData.role);
				}
			};

			fetchUserRole();
		}
	}, [currentUser]);

	// Render results to "raw files" container
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
				setRawTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [sortConfig.key, sortConfig.order]);

	// Function to add a new task to the state
	const addTaskToClientInput = (taskTitle: string) => {
		const createdBy = currentUser ? currentUser.displayName || currentUser.uid : "Anonymous";

		if (userRole === "admin" || userRole === "client") {
			const newTask: Task = {
				id: Date.now().toString(),
				title: taskTitle,
				createdBy: createdBy,
				createdAt: new Date(),
				dueDate: null,
				downloads: [],
				status: "raw",
			};

			setTasks((prevTasks) => [...prevTasks, newTask]);
		} else {
			alert("You do not have permission to add a task.");
		}
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

	const sortFilter = (key: string) => {
		setSortConfig((prevConfig) => {
			const newOrder = prevConfig.key === key && prevConfig.order === "asc" ? "desc" : "asc";
			return { key, order: newOrder };
		});
	};

	// Dnd droppable
	const [isDropped, setIsDropped] = useState<number | null>(null);

	const handleDragEnd = (event: DragEndEvent) => {
		if (event.over) {
			const id = parseInt(event.over.id as string, 10);
			setIsDropped(isNaN(id) ? null : id);
		}
	};

	// Dnd Draggable

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen">
				<SideBar onAddTask={addTaskToClientInput} />

				<main className="w-full flex justify-center mt-10">
					<DndContext onDragEnd={handleDragEnd}>
						{!isDropped ? (
							<div className="grid grid-cols-1 md:grid-cols-2 w-full h-full justify-center gap-2 p-4 overflow-y-scroll">
								{cardContainer.map(({ input }, idx) => (
									<div
										key={idx}
										className="border-2 border-zinc-800 w-[320px] h-[300px] md:h-[350px] text-center flex flex-col justify-start items-center rounded-md text-foreground bg-sidebar backdrop-blur-lg shadow-lg"
									>
										<h3 className="p-4 text-background">{input}</h3>
										<div className="w-full flex justify-end items-center p-2">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button>
														<BiSolidSortAlt />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent className="bg-sidebar">
													<DropdownMenuGroup>
														{sortCategories.map(
															({ input, filterBy }, idx) => (
																<DropdownMenuItem
																	onClick={() =>
																		sortFilter(filterBy)
																	}
																	className="cursor-pointer text-sidebartx"
																	key={idx}
																>
																	{input}
																</DropdownMenuItem>
															)
														)}
													</DropdownMenuGroup>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
										{idx === 0 && (
											// Raw files container
											<ul className="overflow-y-scroll min-w-[300px] w-[300px] flex flex-col gap-2 justify-start items-center rounded-md custom-scrollbar scrollbar-hidden border-2 border-border">
												{rawTasks.map((task) => (
													<Draggable id={task.id} key={task.id}>
														<CardComponent
															task={task}
															onRemove={removeTask}
														/>
													</Draggable>
												))}
											</ul>
										)}
										{idx === 1 && (
											<ul className="overflow-y-scroll min-w-[300px] w-[300px] flex flex-col gap-2 justify-start items-center rounded-md custom-scrollbar scrollbar-hidden border-2 border-border"></ul>
										)}
									</div>
								))}
							</div>
						) : null}
					</DndContext>
				</main>
			</div>
		</PrivateRoute>
	);
}
