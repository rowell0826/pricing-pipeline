"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import { ContainerList, SortList, Task, TaskStatus } from "@/lib/types/cardProps";
import { db } from "@/lib/utils/firebase/firebase";
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

import { AuthRole } from "@/lib/types/authTypes";
import { useAuth } from "@/lib/context/authContext/AuthContext";
import { useCard } from "@/lib/context/cardContext/CardContext";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";

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
	const [refresh, setRefresh] = useState(false);

	const { user, role } = useAuth();
	const { sortConfig, sortFilter } = useCard();
	const { showAlert } = useTheme();

	const {
		rawTasks,
		setRawTasks,
		filteredTasks,
		setFilteredTasks,
		pricingTasks,
		setPricingTasks,
		done,
		setDone,
	} = useCard();

	const cardContainer: ContainerList[] = [
		{ id: "raw", items: rawTasks, setter: setRawTasks },
		{ id: "filtering", items: filteredTasks, setter: setFilteredTasks },
		{ id: "pricing", items: pricingTasks, setter: setPricingTasks },
		{ id: "done", items: done, setter: setDone },
	];

	// Fetch user role and files
	useEffect(() => {
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
					const link = data.link;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						link,
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
					const link = data.link;
					const title = data.title;
					const status = data.status;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						link,
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
	}, [
		setDone,
		setFilteredTasks,
		setPricingTasks,
		setRawTasks,
		sortConfig.key,
		sortConfig.order,
		user,
	]);

	// Get user's initials
	const getInitials = (name: string) => {
		const nameParts = name.split(" ");
		const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join("");
		return initials.length > 2 ? initials.slice(0, 2) : initials; // Limit to 2 characters
	};

	const transferTaskToNextContainer = async (
		task: Task,
		prevContainer: string,
		currContainer: string
	) => {
		const nextCollectionRef = collection(db, currContainer);

		try {
			const isTransferAllowed = (): boolean => {
				const roleAndContainerMap: Record<AuthRole, string[]> = {
					client: [],
					admin: ["raw", "filtering", "pricing"],
					dataManager: ["raw", "filtering"],
					dataQA: [],
					dataScientist: ["pricing"],
					promptEngineer: ["pricing"],
				};

				// Ensure userRole is valid and check allowed containers
				if (!role || !(role in roleAndContainerMap)) {
					throw new Error("Invalid or undefined user role");
				}

				// Return true if the role is allowed to transfer from the previous container
				return roleAndContainerMap[role as AuthRole]?.includes(prevContainer) ?? false;
			};

			// Check if the transfer is allowed based on userRole and prevContainer
			if (isTransferAllowed()) {
				await addDoc(nextCollectionRef, task);
			} else {
				showAlert(
					"warning",
					"You're restricted from moving this item to the next container."
				);
				const currCollectionRef = collection(db, prevContainer);

				// Add back to the previous container as a fallback
				await addDoc(currCollectionRef, task);
			}
		} catch (error) {
			console.log("Error transferring task to next container: ", error);
		}
	};

	const removeTaskByDragging = async (collectionName: string, taskID: string) => {
		// Fetch the task database before deleting to get the file path
		const taskDocRef = doc(db, collectionName, taskID);

		// Fetch the task document before deleting to get the file path
		const taskDocSnapshot = await getDoc(taskDocRef);

		try {
			if (taskDocSnapshot.exists()) {
				await deleteDoc(taskDocRef);
				console.log(`Task deleted successfully from collection: ${collectionName}`);
			} else {
				console.log("No task found with the given ID");
			}
		} catch (error) {
			console.error("Error removing task: ", error);
		}
	};

	/* const moveToArchive = () => {

	} */

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
							transferTaskToNextContainer(newItem, activeContainer, overContainer);
							setFilteredTasks((prev) => {
								return [...prev, newItem];
							});

							break;
						case "pricing":
							transferTaskToNextContainer(newItem, activeContainer, overContainer);
							setPricingTasks((prev) => {
								return [...prev, newItem];
							});

							break;
						case "done":
							transferTaskToNextContainer(newItem, activeContainer, overContainer);
							setDone((prev) => {
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

			// Toggle the refresh state to re-render component
			setRefresh((prev) => !prev);

			setActiveId(null);
		}
	};

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen items-start bg-background">
				<SideBar />

				<main
					key={refresh ? 1 : 0}
					className="w-[90%] h-[92.5%] max-h-full flex justify-start mt-10"
				>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-full w-full gap-4 p-4 justify-items-center overflow-y-scroll">
							{cardContainer.map(({ id, items }) => (
								<div
									key={id}
									className="border-2 border-zinc-800 min-w-[200px] w-[250px] min-h-[300px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-sidebartx bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4"
								>
									<h3 className="p-4 text-sidebartx">
										{id === "raw"
											? "Raw Files"
											: id === "filtering"
											? "Filtering"
											: id === "pricing"
											? "Pricing"
											: "Done"}
									</h3>
									<div className="w-full flex justify-end items-center p-2">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button>
													<BiSolidSortAlt />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent className="bg-black">
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
									<div className="custom-scrollbar overflow-y-scroll">
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
														getInitials={getInitials}
													/>
												))}
											</Droppable>
										</SortableContext>
									</div>
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
												<Card className="bg-white">
													<CardHeader className="h-[30%] py-2">
														<CardTitle className="text-left text-xs text-black">
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
