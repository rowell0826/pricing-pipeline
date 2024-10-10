"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import { Task, TaskStatus } from "@/lib/types/cardProps";
import { auth, db, storage } from "@/lib/utils/firebase/firebase";
import { BiSolidSortAlt } from "react-icons/bi";
import {
	addDoc,
	// addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
	DropdownMenuItem,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Dnd Imports
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Droppable } from "@/components/droppable/Droppable";
import { DraggableCard } from "@/components/droppable/Draggable";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { deleteObject, ref } from "firebase/storage";
import { AuthRole } from "@/lib/types/authTypes";
interface SortList {
	input: string;
	filterBy: string;
}

export interface ContainerList {
	id: string;
	items: Task[]; // Store the tasks in this container
	setter: React.Dispatch<React.SetStateAction<Task[]>>;
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

export default function Home() {
	const [rawTasks, setRawTasks] = useState<Task[]>([]); // Tasks in "Raw files"
	const [filteredTasks, setFilteredTasks] = useState<Task[]>([]); //Task in "Filtered files"
	const [pricingTasks, setPricingTasks] = useState<Task[]>([]); // Task in "Pricing files"
	const [done, setDone] = useState<Task[]>([]); // Task in "Done folder"
	const [userRole, setUserRole] = useState<AuthRole | null>(null);

	const cardContainer: ContainerList[] = [
		{ id: "raw", items: rawTasks, setter: setRawTasks },
		{ id: "filtering", items: filteredTasks, setter: setFilteredTasks },
		{ id: "pricing", items: pricingTasks, setter: setPricingTasks },
		{ id: "done", items: done, setter: setDone },
	];

	const [sortConfig, setSortConfig] = useState<{ key: string; order: "asc" | "desc" }>({
		key: "createdAt", // Default sort by createdAt
		order: "asc",
	});

	const currentUser = auth.currentUser;

	// Fetch user role
	/* useEffect(() => {
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
	}, [currentUser]); */

	// Render results to "raw files" container
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

		const fetchTasks = async () => {
			try {
				const raw = query(collection(db, "raw"), orderBy(sortConfig.key, sortConfig.order));
				const filtering = query(
					collection(db, "filtering"),
					orderBy(sortConfig.key, sortConfig.order)
				);
				const pricing = query(
					collection(db, "pricing"),
					orderBy(sortConfig.key, sortConfig.order)
				);
				const done = query(
					collection(db, "done"),
					orderBy(sortConfig.key, sortConfig.order)
				);

				const rawSnapshot = await getDocs(raw);
				const filteringSnapshot = await getDocs(filtering);
				const pricingSnapshot = await getDocs(pricing);
				const doneSnapshot = await getDocs(done);

				const fetchedRawTasks = rawSnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const fileUpload = data.fileUpload;
					const title = data.title;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						dueDate,
						status,
					} as Task;
				});

				const fetchedFilteringTasks = filteringSnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const fileUpload = data.fileUpload;
					const title = data.title;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						dueDate,
						status,
					} as Task;
				});

				const fetchedPricingTasks = pricingSnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const fileUpload = data.fileUpload;
					const title = data.title;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						dueDate,
						status,
					} as Task;
				});

				const fetchedDoneTasks = doneSnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const fileUpload = data.fileUpload;
					const title = data.title;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						dueDate,
						status,
					} as Task;
				});

				setRawTasks(fetchedRawTasks);
				setFilteredTasks(fetchedFilteringTasks);
				setPricingTasks(fetchedPricingTasks);
				setDone(fetchedDoneTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [sortConfig.key, sortConfig.order, currentUser]);

	// Get user's initials
	const getInitials = (name: string) => {
		const nameParts = name.split(" ");
		const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join("");
		return initials.length > 2 ? initials.slice(0, 2) : initials; // Limit to 2 characters
	};

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
				fileUpload: [],
				status: "raw",
			};

			setRawTasks((prevTasks) => [...prevTasks, newTask]);
		} else {
			alert("You do not have permission to add a task.");
		}
	};

	const addTaskToFiltering = async (task: Task, container: string) => {
		try {
			if (userRole === "admin" || userRole === "dataManager" || userRole === "dataQA") {
				// Add the task to the filtering collection
				const filteringCollectionRef = collection(db, container);

				await addDoc(filteringCollectionRef, task);
			}
		} catch (error) {
			console.error("Error adding task to filtering: ", error);
		}
	};

	const addTaskToPricing = async (task: Task, container: string) => {
		try {
			if (userRole === "admin" || userRole === "dataManager" || userRole === "dataQA") {
				// Add the task to the pricing collection
				const filteringCollectionRef = collection(db, container);

				await addDoc(filteringCollectionRef, task);
			}
		} catch (error) {
			console.error("Error adding task to pricing: ", error);
		}
	};

	const addTaskToDone = async (task: Task, container: string) => {
		try {
			if (
				userRole === "admin" ||
				userRole === "dataScientist" ||
				userRole === "promptEngineer"
			) {
				// Add the task to the done collection
				const filteringCollectionRef = collection(db, container);
				await addDoc(filteringCollectionRef, task);
			}
		} catch (error) {
			console.error("Error adding task to done: ", error);
		}
	};

	const removeTask = async (taskID: string, container: string, filePaths: string[] = []) => {
		const taskDocRef = doc(db, container, taskID);

		try {
			await Promise.all(
				filePaths.map(async (filePath) => {
					// Create a reference to the file in Firebase Storage
					const fileRef = ref(storage, decodeURIComponent(filePath));
					await deleteObject(fileRef); // Delete the file
				})
			);

			await deleteDoc(taskDocRef);
			switch (container) {
				case "raw":
					setRawTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
					break;
				case "filtering":
					setFilteredTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskID));
					break;
				case "pricing":
					setPricingTasks((prevTask) => prevTask.filter((task) => task.id !== taskID));
					break;
				case "done":
					setDone((prevTask) => prevTask.filter((task) => task.id !== taskID));
					break;
				default:
					throw Error("Cannot delete ticket.");
			}
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	const removeTaskByDragging = async (collectionName: string, taskID: string) => {
		// Fetch the task database before deleting to get the file path
		const taskDocRef = doc(db, collectionName, taskID);

		// Fetch the task document before deleting to get the file path
		const taskDocSnapshot = await getDoc(taskDocRef);

		try {
			if (taskDocSnapshot.exists()) {
				const taskData = taskDocSnapshot.data();

				// Assuming the file name is stored in the task document
				console.log("Task data: ", taskData);
				console.log(`Doc Snapshot: ${taskDocSnapshot}`);

				const fileUpload = taskData?.fileUpload;

				if (fileUpload && Array.isArray(fileUpload)) {
					for (const fileUrl of fileUpload) {
						// Extract the file path from the URL
						const decodedPath = decodeURIComponent(
							fileUrl.split("/o/")[1].split("?")[0]
						);

						// Create a reference to the file in Firebase Storage
						const fileRef = ref(storage, decodedPath);

						try {
							// Delete the file from Firebase Storage
							await deleteObject(fileRef);
							console.log(`File deleted successfully: ${decodedPath}`);
						} catch (error) {
							console.error("Error deleting file from storage: ", error);
						}
					}
				}

				// After the file(s) are deleted, delete the document from Firestore
				await deleteDoc(taskDocRef);
				console.log(`Task deleted successfully from collection: ${collectionName}`);
			} else {
				console.log("No task found with the given ID");
			}
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

	// Dnd context
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Dnd droppable
	const [activeId, setActiveId] = useState<string | null>(null);

	// Dnd Draggable
	const handleDragStart = (e: DragStartEvent) => {
		const { active } = e;

		setActiveId(String(active.id));
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		if (over) {
			// Determine the active and over containers
			const activeContainer = rawTasks.some((task) => {
				console.log("Task.id: ", task.id);
				return task.id === active.id;
			})
				? "raw"
				: filteredTasks.some((task) => task.id === active.id)
				? "filtering"
				: pricingTasks.some((task) => task.id === active.id)
				? "pricing"
				: "done";

			const overContainer = over.id;

			const draggedItem =
				activeContainer === "raw"
					? rawTasks.find((task) => task.id === active.id)
					: activeContainer === "filtering"
					? filteredTasks.find((task) => task.id === active.id)
					: activeContainer === "pricing"
					? pricingTasks.find((task) => task.id === active.id)
					: done.find((task) => task.id === active.id);

			if (draggedItem) {
				const newItem: Task = {
					id: Date.now().toString(),
					title: draggedItem.title,
					createdBy: draggedItem.createdBy,
					createdAt: draggedItem.createdAt,
					dueDate: draggedItem.dueDate,
					fileUpload: draggedItem.fileUpload,
					status: overContainer as TaskStatus,
				};

				if (activeContainer !== overContainer) {
					// Move between different containers
					switch (overContainer) {
						case "filtering":
							addTaskToFiltering(newItem, overContainer);
							setFilteredTasks((prev) => {
								console.log("Task transferred to filtering");

								return [...prev, newItem];
							});

							break;
						case "pricing":
							addTaskToPricing(newItem, overContainer);
							setPricingTasks((prev) => {
								console.log("Task transferred to pricing");

								return [...prev, newItem];
							});

							break;
						case "done":
							addTaskToDone(newItem, overContainer);
							setDone((prev) => {
								console.log("Task transferred to done");

								return [...prev, newItem];
							});

							break;
						default:
							throw Error("Container does not exist");
					}

					// Remove from the previous container
					switch (activeContainer) {
						case "raw":
							setRawTasks((prev) =>
								prev.filter((task) => task.id !== String(active.id))
							);
							removeTaskByDragging(activeContainer, String(active.id));
							console.log("Active Container: ", activeContainer);

							break;
						case "filtering":
							setFilteredTasks((prev) =>
								prev.filter((task) => task.id !== String(active.id))
							);
							removeTaskByDragging(activeContainer, String(active.id));
							break;
						case "pricing":
							setPricingTasks((prev) =>
								prev.filter((task) => task.id !== String(active.id))
							);
							removeTaskByDragging(activeContainer, String(active.id));
							break;
						case "done":
							setDone((prev) => prev.filter((task) => task.id !== String(active.id)));
							removeTaskByDragging(activeContainer, String(active.id));
							break;
						default:
							throw Error("Task does not exist");
					}
				} else {
					const items =
						activeContainer === "raw"
							? rawTasks
							: activeContainer === "filtering"
							? filteredTasks
							: activeContainer === "pricing"
							? pricingTasks
							: done;

					const index = items.findIndex((item) => item.id === active.id);
					const newItems = arrayMove(
						items,
						index,
						items.findIndex((item) => item.id === over.id)
					);

					switch (activeContainer) {
						case "raw":
							setRawTasks(newItems);
							break;
						case "filtering":
							setFilteredTasks(newItems);
							break;
						case "pricing":
							setFilteredTasks(newItems);
							break;
						case "done":
							setDone(newItems);
							break;
						default:
							break;
					}
				}
			}

			setActiveId(null);
		}
	};

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen items-start">
				<SideBar onAddTask={addTaskToClientInput} />

				<main className="w-full h-[92.5%] max-h-full flex justify-start mt-10">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<div className="flex flex-col md:flex-row max-h-full w-full gap-4 p-4 overflow-y-scroll">
							{cardContainer.map(({ id, items }) => (
								<div
									key={id}
									className="border-2 border-zinc-800 min-w-[200px] w-[200px] min-h-[300px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-foreground bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4"
								>
									<h3 className="p-4 text-background">{id}</h3>
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
																onClick={() => sortFilter(filterBy)}
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
									<SortableContext
										items={items.map((item) => item.id)}
										strategy={verticalListSortingStrategy}
									>
										<Droppable id={id}>
											{items.map((task) => (
												<DraggableCard
													containerTitle={id}
													id={task.id}
													key={task.id}
													task={task}
													onRemove={removeTask}
													getInitials={getInitials}
												/>
											))}
										</Droppable>
									</SortableContext>
								</div>
							))}
						</div>
						<DragOverlay>
							{activeId
								? (() => {
										// Find the item in any of the containers
										const draggedItem =
											rawTasks.find((item) => item.id === activeId) ||
											filteredTasks.find((item) => item.id === activeId) ||
											pricingTasks.find((item) => item.id === activeId) ||
											done.find((item) => item.id === activeId);

										// Return the dragged item component, styled or structured appropriately for both vertical and horizontal containers
										if (draggedItem) {
											return (
												<Card>
													<CardHeader className="h-[30%] py-2">
														<CardTitle className="text-left text-xs">
															{draggedItem.title}
														</CardTitle>
														<Avatar className="mr-2 w-6 h-6">
															<AvatarFallback className="text-xs">
																{getInitials(draggedItem.createdBy)}
															</AvatarFallback>
														</Avatar>
													</CardHeader>
												</Card>
											);
										} else {
											return null;
										}
								  })()
								: null}
						</DragOverlay>
					</DndContext>
				</main>
			</div>
		</PrivateRoute>
	);
}
