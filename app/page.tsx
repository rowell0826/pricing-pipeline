"use client";
import SideBar from "@/components/sidebar/SideBar";
import { useState } from "react";

export default function Home() {
	const [tasks, setTasks] = useState<string[]>([]); // State to store tasks

	// Function to add a new task to the state
	const addTaskToClientInput = (taskTitle: string) => {
		setTasks((prevTasks) => [...prevTasks, taskTitle]);
	};

	return (
		<div className="flex w-full h-screen">
			<SideBar onAddTask={addTaskToClientInput} />

			<main className="w-full flex justify-center mt-20">
				<div className="flex flex-col md:flex-row justify-evenly items-center border-4 w-full h-[300px]">
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						<h3>Client Input</h3>
						<ul>
							{/* Render the list of tasks */}
							{tasks.map((task, index) => (
								<li key={index}>{task}</li>
							))}
						</ul>
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Data Analyst & Data QA
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Data Scientist & Prompt Engineer
					</div>
					<div className="border-2 border-zinc-800 w-[200px] h-[300px] text-center">
						Done
					</div>
				</div>
			</main>
		</div>
	);
}
