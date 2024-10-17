import { Droppable } from "@/components/droppable/Droppable";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React from "react";
import { BiSolidSortAlt } from "react-icons/bi";

const page: React.FC = () => {
	return (
		<div
			key={id}
			className="border-2 border-zinc-800 min-w-[200px] w-[250px] min-h-[300px] max-h-[70%] text-center flex flex-col justify-start items-center rounded-md text-sidebartx bg-sidebar backdrop-blur-lg shadow-lg overflow-hidden p-4"
		>
			<h3 className="p-4 text-sidebartx">Archive</h3>
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
								onRemove={removeTask}
								getInitials={getInitials}
							/>
						))}
					</Droppable>
				</SortableContext>
			</div>
		</div>
	);
};

export default page;
