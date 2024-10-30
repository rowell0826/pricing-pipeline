"use client";
import PrivateRoute from "@/components/privateRoute/PrivateRoute";
import SideBar from "@/components/sidebar/SideBar";
import { ContainerList, SortList, Task, TaskStatus } from "@/lib/types/cardProps";
import { db } from "@/lib/utils/firebase/firebase";
import { BiSolidSortAlt } from "react-icons/bi";
import { collection, doc, getDoc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
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
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useCard } from "@/lib/context/cardContext/CardContext";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";
import { useAuth } from "@/lib/context/authContext/AuthContext";

const NEXT_PUBLIC_DISCORD_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK;

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
	const { tasks, setTasks, sortFilter, sortConfig } = useCard();
	const { showAlert } = useTheme();
	const { role, userName } = useAuth();

	const cardContainer: ContainerList[] = [
		{ id: "raw", items: tasks.filter((task) => task.status === "raw") },
		{ id: "filtering", items: tasks.filter((task) => task.status === "filtering") },
		{ id: "pricing", items: tasks.filter((task) => task.status === "pricing") },
		{ id: "done", items: tasks.filter((task) => task.status === "done") },
	];

	const fetchTaskLink = async (taskId: string) => {
		const taskDoc = await getDoc(doc(db, "tasks", taskId));
		if (taskDoc.exists()) {
			return taskDoc.data().link;
		} else {
			console.log("No such document!");
			return null;
		}
	};

	// function overloading
	function webHookMessage(title: string, message: string): Promise<void>;

	function webHookMessage(title: string, message: string, link: string): Promise<void>;

	async function webHookMessage(title: string, message: string, link?: string): Promise<void> {
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
							description: link
								? "Below is the link for the CSV file."
								: "Please go to the link provided below.",
							color: 3447003,
							fields: [
								{
									name: "Barker Pricing Pipeline",
									value: link
										? link
										: "https://pricing-pipeline-alpha.vercel.app/",
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
	}

	// Fetch user role and files
	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const tasksQuery = query(
					collection(db, "tasks"),
					orderBy(sortConfig.key, sortConfig.order)
				);

				const tasksSnapshot = await getDocs(tasksQuery);

				const fetchedTasks = tasksSnapshot.docs.map((doc) => {
					const data = doc.data();

					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const fileUpload = data.fileUpload;
					const title = data.title;
					const status = data.status;
					const link = data.link;

					return {
						id: doc.id,
						title,
						createdAt,
						createdBy,
						fileUpload,
						dueDate,
						status,
						link,
					} as Task;
				});

				setTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [setTasks, sortConfig.key, sortConfig.order]);

	// Get user's initials
	const getInitials = (name: string) => {
		const nameParts = name.split(" ");
		const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join("");
		return initials.length > 2 ? initials.slice(0, 2) : initials; // Limit to 2 characters
	};

	const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
		const taskRef = doc(db, "tasks", taskId);
		try {
			await updateDoc(taskRef, { status: newStatus });
			console.log(`Task ${taskId} status updated to ${newStatus}`);
		} catch (error) {
			console.error("Error updating task status:", error);
		}
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
		setActiveId(null);

		const { active, over } = event;

		if (!over) return;

		const activeId = active.id;
		const overId = over.id;

		// If item is dragged within the same container, no change needed
		if (activeId === overId) return;

		// Get the current task being dragged
		const task = tasks.find((task) => task.id === activeId);
		if (!task) return;

		const currentStatus = task.status;

		// Check role and allowed movements
		if (role === "admin") {
			// Admin can move tasks between any containers
			updateTaskStatus(activeId as string, overId as TaskStatus);
			const updatedTasks = tasks.map((t) =>
				t.id === activeId ? { ...t, status: overId as TaskStatus } : t
			);
			setTasks(updatedTasks); // Update state to re-render
		} else if (role === "dataManager") {
			// dataMgr can only move tasks from "raw" to "filtering" or "filtering" to "pricing"
			if (currentStatus === "raw" && overId === "filtering") {
				updateTaskStatus(activeId as string, overId as TaskStatus); // Update in Firestore
				const updatedTasks = tasks.map((t) =>
					t.id === activeId ? { ...t, status: overId as TaskStatus } : t
				);
				setTasks(updatedTasks); // Update state to re-render
			} else {
				showAlert("error", "You do not have permission to move this task.");
			}
		} else if (role === "dataScientist" || role === "promptEngineer") {
			// dataScientist and promptEngineer can only move tasks from "filtering" to "pricing" or "pricing" to "done"
			if (
				(currentStatus === "filtering" && overId === "pricing") ||
				(currentStatus === "pricing" && overId === "done")
			) {
				updateTaskStatus(activeId as string, overId as TaskStatus); // Update in Firestore
				const updatedTasks = tasks.map((t) =>
					t.id === activeId ? { ...t, status: overId as TaskStatus } : t
				);
				setTasks(updatedTasks); // Update state to re-render
			} else {
				showAlert("error", "You do not have permission to move this task.");
			}
		} else {
			showAlert("error", "You do not have permission to move this task.");
		}

		if (overId !== task.status) {
			if (overId === "filtering") {
				webHookMessage(task.title, `**Task is now being filtered.**`);
			} else if (overId === "done") {
				const link = await fetchTaskLink(String(activeId));
				webHookMessage(
					task.title,
					`**Task has been priced by ${userName}. See link below.**`,
					link
				);
			} else if (overId === "pricing") {
				webHookMessage(task.title, `**Task is now being priced.**`);
			}
		}
	};

	const activeTask = tasks.find((task) => task.id === activeId);

	return (
		<PrivateRoute>
			<div className="flex w-full h-screen items-start bg-background bg-custom-pattern bg-top bg-large bg-no-repeat">
				<SideBar />

				<main className="w-[90%] h-[92.5%] max-h-full flex justify-start mt-10">
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragEnd={handleDragEnd}
					>
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-h-full w-full gap-4 p-4 justify-items-center overflow-y-scroll custom-scrollbar my-auto">
							{cardContainer.map(({ id, items }) => (
								<div
									key={id}
									className="border-1 border-zinc-50 min-w-[200px] w-[250px] min-h-[300px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-sidebartx bg-sidebar backdrop-blur-sm shadow-lg overflow-hidden p-4"
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
							{activeTask ? (
								<Card className="bg-white">
									<CardHeader className="h-[30%] py-2">
										<CardTitle className="text-left text-xs text-black">
											{activeTask.title}
										</CardTitle>
										<Avatar className="mr-2 w-6 h-6">
											<AvatarFallback className="text-xs">
												{getInitials(activeTask.createdBy)}
											</AvatarFallback>
										</Avatar>
									</CardHeader>
								</Card>
							) : null}
						</DragOverlay>
					</DndContext>
				</main>
			</div>
		</PrivateRoute>
	);
}
