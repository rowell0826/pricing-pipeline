"use client";
import { DraggableArchiveCard } from "@/components/droppable/DraggableArchive";
import { DroppableArchive } from "@/components/droppable/DroppableArchive";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCard } from "@/lib/context/cardContext/CardContext";
import { SortList, Task } from "@/lib/types/cardProps";
import { db } from "@/lib/utils/firebase/firebase";
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
import {
	horizontalListSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { collection, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { BiSolidSortAlt } from "react-icons/bi";
import { FaArrowLeft } from "react-icons/fa";

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

const Archive: React.FC = () => {
	const { sortConfig, sortFilter } = useCard();
	const [archiveTasks, setArchiveTasks] = useState<Task[]>([]);

	useEffect(() => {
		const fetchArchiveTasks = async () => {
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

				setArchiveTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchArchiveTasks();
	}, [archiveTasks, setArchiveTasks, sortConfig.key, sortConfig.order]);

	const getInitials = (name: string) => {
		const nameParts = name.split(" ");
		const initials = nameParts.map((part) => part.charAt(0).toUpperCase()).join("");
		return initials.length > 2 ? initials.slice(0, 2) : initials; // Limit to 2 characters
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

		if (!over || active.id === over.id) {
			setActiveId(null);
			return;
		}

		const oldIndex = archiveTasks.findIndex((task) => task.id === active.id);
		const newIndex = archiveTasks.findIndex((task) => task.id === over.id);
		const updatedTasks = [...archiveTasks];
		const [movedTask] = updatedTasks.splice(oldIndex, 1);
		updatedTasks.splice(newIndex, 0, movedTask);

		setArchiveTasks(updatedTasks);

		try {
			const batch = writeBatch(db);
			updatedTasks.forEach((task, index) => {
				const taskRef = doc(db, "tasks", task.id);
				batch.update(taskRef, { position: index });
			});
			await batch.commit();
		} catch (error) {
			console.error("Error saving task order:", error);
		}

		setActiveId(null);
	};

	const activeTask = archiveTasks.find((task) => task.id === activeId);

	return (
		<div className="w-screen flex justify-center items-center">
			<div className="w-screen h-screen border-2 border-zinc-800 text-center flex flex-col gap-y-4 justify-center items-center rounded-md text-sidebartx bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4">
				<div className="w-full flex flex-col">
					<div className="w-6 h-6 bg-gray-600 p-2 rounded-md flex justify-center items-center">
						<Link href="/">
							<Button className="ml-5">
								<FaArrowLeft />
							</Button>
						</Link>
					</div>
					<h3 className="p-4 text-sidebartx">Archive</h3>
				</div>
				<div className="w-full flex justify-end items-center p-2">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button>
								<BiSolidSortAlt />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="bg-black">
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
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<div className="w-full h-full ">
						<SortableContext
							items={archiveTasks.map((task) => task.id)}
							strategy={verticalListSortingStrategy}
						>
							<div className="h-full custom-scrollbar overflow-y-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 border-2 border-slate-400 rounded-md">
								{archiveTasks.map((task) => (
									<SortableContext
										key={task.id}
										items={archiveTasks.map((task) => task.id)}
										strategy={horizontalListSortingStrategy}
									>
										<DroppableArchive id={task.id}>
											<DraggableArchiveCard
												id={task.id}
												task={task}
												getInitials={getInitials}
											/>
										</DroppableArchive>
									</SortableContext>
								))}
							</div>
						</SortableContext>
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
			</div>
		</div>
	);
};

export default Archive;
