import { useDroppable } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BiSolidSortAlt } from "react-icons/bi";
import { Button } from "../ui/button";
import { DraggableCard } from "./Draggable";
import { Task } from "@/lib/types/cardProps";
import { ContainerList } from "@/app/page";

interface DroppableProps {
	id: string;
	sortCategories: Array<{ input: string; filterBy: string }>;
	sortFilter: (filterBy: string) => void;
	containerTask: Task[];
	isDropped: string | number | null;
	removeTaskFromPreviousContainer: (taskID: string) => Promise<void>;
	containerTitle: ContainerList;
}

const Droppable: React.FC<PropsWithChildren<DroppableProps>> = ({
	id,
	sortCategories,
	sortFilter,
	containerTask,
	isDropped,
	removeTaskFromPreviousContainer,
	containerTitle,
}) => {
	const { setNodeRef } = useDroppable({
		id,
	});

	console.log("Droppable ID:", id);

	return (
		<div
			ref={setNodeRef}
			className="border-2 border-zinc-800 min-w-[200px] w-[200px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-foreground bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4"
			id={id}
		>
			<h3 className="p-4 text-background">{containerTitle.input}</h3>
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
			{containerTask.map((task) =>
				isDropped === id ? (
					<DraggableCard
						id={task.id}
						key={task.id}
						task={task}
						onRemove={() => removeTaskFromPreviousContainer(task.id.toString())}
					/>
				) : (
					<DraggableCard
						id={task.id}
						key={task.id}
						task={task}
						onRemove={() => removeTaskFromPreviousContainer(task.id.toString())}
					/>
				)
			)}
		</div>
	);
};

export { Droppable };
