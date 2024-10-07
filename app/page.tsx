"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import { Task } from "@/lib/types/cardProps";
import { auth, db } from "@/lib/utils/firebase/firebase";
import { BiSolidSortAlt } from "react-icons/bi";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
} from "firebase/firestore";
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
import { Droppable } from "@/components/droppable/Droppable";
import { DraggableCard } from "@/components/droppable/Draggable";
interface SortList {
	input: string;
	filterBy: string;
}

export interface ContainerList {
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
	const [rawTasks, setRawTasks] = useState<Task[]>([]); // Tasks in "Raw files"
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]); //Task in "Filtered files"
	const [pricingTasks, setPricingTasks] = useState<Task[]>([]); // Task in "Pricing files"
	const [done, setDone] = useState<Task[]>([]); // Task in "Done folder"
	const [userRole, setUserRole] = useState<string | null>(null);

	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	const currentUser = auth.currentUser;

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
				const raw = query(collection(db, "raw"), orderBy(sortConfig.key, sortConfig.order));

				const rawSnapshot = await getDocs(raw);

				const fetchedTasks = rawSnapshot.docs.map((doc) => {
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

				setRawTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [sortConfig.key, sortConfig.order]);

	useEffect(() => {
		const fetchFiltered = async () => {
			try {
				const filtering = query(
					collection(db, "filtering"),
					orderBy(sortConfig.key, sortConfig.order)
				);
				const filterSnapshot = await getDocs(filtering);
				const fetchedFilteredTasks = filterSnapshot.docs.map((doc) => {
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

				setFilteredTasks(fetchedFilteredTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchFiltered();
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

			setRawTasks((prevTasks) => [...prevTasks, newTask]);
		} else {
			alert("You do not have permission to add a task.");
		}
	};

	const addTaskToFiltering = async (task: Task) => {
		try {
			if (userRole === "admin" || userRole === "data manager" || userRole === "data QA") {
				const taskData: Task = {
					id: task.id,
					title: task.title,
					createdBy: task.createdBy,
					createdAt: task.createdAt,
					dueDate: task.dueDate,
					downloads: task.downloads,
					status: "filtering", // Set status to filtering
				};

				setFilteredTasks((prev) => [...prev, taskData]);

				// Add the task to the filtering collection
				const filteringCollectionRef = collection(db, "filtering");
				await addDoc(filteringCollectionRef, taskData);
			}
		} catch (error) {
			console.error("Error adding task to filtering: ", error);
		}
	};

	const addTaskToPricing = async (task: Task) => {
		try {
			if (
				userRole === "admin" ||
				userRole === "data scientist" ||
				userRole === "prompt engineer"
			) {
				const taskData: Task = {
					id: task.id,
					title: task.title,
					createdBy: task.createdBy,
					createdAt: task.createdAt,
					dueDate: task.dueDate,
					downloads: task.downloads,
					status: "pricing", // Set status to filtering
				};

				setPricingTasks((prev) => [...prev, taskData]);

				// Add the task to the filtering collection
				const filteringCollectionRef = collection(db, "filtering");
				await addDoc(filteringCollectionRef, taskData);
			}
		} catch (error) {
			console.error("Error adding task to pricing: ", error);
		}
	};

	const addTaskToDone = async (task: Task) => {
		try {
			if (
				userRole === "admin" ||
				userRole === "data scientist" ||
				userRole === "prompt engineer"
			) {
				const taskData: Task = {
					id: task.id,
					title: task.title,
					createdBy: task.createdBy,
					createdAt: task.createdAt,
					dueDate: task.dueDate,
					downloads: task.downloads,
					status: "done", // Set status to filtering
				};

				setDone((prev) => [...prev, taskData]);

				// Add the task to the filtering collection
				const filteringCollectionRef = collection(db, "done");
				await addDoc(filteringCollectionRef, taskData);
			}
		} catch (error) {
			console.error("Error adding task to done: ", error);
		}
	};

	const removeTask = async (taskID: string) => {
		const taskDocRef = doc(db, "raw", taskID);

		try {
			await deleteDoc(taskDocRef);
			setRawTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	const removeTaskFromFilter = async (taskID: string) => {
		const taskDocRef = doc(db, "filter", taskID);

		try {
			await deleteDoc(taskDocRef);
			setFilteredTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	const removeTaskFromPricing = async (taskID: string) => {
		const taskDocRef = doc(db, "pricing", taskID);

		try {
			await deleteDoc(taskDocRef);
			setPricingTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
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
	const [isDropped, setIsDropped] = useState<number | string | null>(null);

	// Dnd Draggable
	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over) {
			const droppedTaskID = active.id;

			if (over.id === "filter") {
				const taskToMove = rawTasks.find((task) => task.id === droppedTaskID);

				if (taskToMove) {
					// Add the task to Firestore
					await addTaskToFiltering(taskToMove);

					removeTask(droppedTaskID as string);

					// Optionally remove from raw tasks
					setRawTasks((prev) => prev.filter((task) => task.id !== droppedTaskID));
				}
			}

			if (over.id === "pricing") {
				const taskToMove = filteredTasks.find((task) => task.id === droppedTaskID);

				if (taskToMove) {
					// Add the task to Firestore
					await addTaskToPricing(taskToMove);

					removeTask(droppedTaskID as string);

					setFilteredTasks((prev) => prev.filter((task) => task.id !== droppedTaskID));
				}
			}

			if (over.id === "done") {
				const taskToMove = filteredTasks.find((task) => task.id === droppedTaskID);

				if (taskToMove) {
					// Add the task to Firestore
					await addTaskToDone(taskToMove);

					removeTask(droppedTaskID as string);

					setPricingTasks((prev) => prev.filter((task) => task.id !== droppedTaskID));
				}
			}
			setIsDropped(over.id);
		}
	};

	console.log("Filtered tasks: ", filteredTasks);
	console.log("Pricing tasks: ", pricingTasks);

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen items-start">
				<SideBar onAddTask={addTaskToClientInput} />

				<main className="w-full max-h-[92%] flex justify-start mt-10">
					<DndContext onDragEnd={handleDragEnd}>
						<div className="flex flex-col md:flex-row max-h-full w-full gap-4 p-4 overflow-y-scroll">
							<div className="border-2 border-zinc-800 min-w-[200px] w-[200px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-foreground bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4">
								<h3 className="p-4 text-background">Raw Files</h3>
								<div className="w-full flex justify-end items-center p-2">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button>
												<BiSolidSortAlt />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="bg-sidebar">
											<DropdownMenuGroup>
												{sortCategories.map(({ input, filterBy }, idx) => (
													<DropdownMenuItem
														onClick={() => sortFilter(filterBy)}
														className="cursor-pointer text-sidebartx"
														key={idx}
													>
														{input}
													</DropdownMenuItem>
												))}
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{rawTasks.map((task) =>
									!isDropped ? (
										<DraggableCard
											id={task.id}
											key={task.id}
											task={task}
											onRemove={removeTask}
										/>
									) : null
								)}
							</div>

							{/* Filtering Container */}
							<Droppable
								id="filter"
								sortCategories={sortCategories}
								sortFilter={sortFilter}
								containerTask={filteredTasks}
								isDropped={isDropped}
								removeTaskFromPreviousContainer={removeTaskFromFilter}
								containerTitle={cardContainer[1]}
							/>

							{/* Pricing Container */}
							<Droppable
								id="pricing"
								sortCategories={sortCategories}
								sortFilter={sortFilter}
								containerTask={pricingTasks}
								isDropped={isDropped}
								removeTaskFromPreviousContainer={removeTaskFromPricing}
								containerTitle={cardContainer[2]}
							/>

							{/* Done */}
							<Droppable
								id="done"
								sortCategories={sortCategories}
								sortFilter={sortFilter}
								containerTask={done}
								isDropped={isDropped}
								removeTaskFromPreviousContainer={removeTaskFromPricing}
								containerTitle={cardContainer[3]}
							/>
						</div>
					</DndContext>
				</main>
			</div>
		</PrivateRoute>
	);
}
