"use client";
import SideBar from "@/components/sidebar/SideBar";
import CardComponent from "@/components/subcomponents/Card";
import { auth, db } from "@/lib/utils/firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
	const [tasks, setTasks] = useState<
		{
			title: string;
			createdBy: string;
			createdAt: Date | null;
			dueDate: Date | null;
			downloads: string[];
		}[]
	>([]);
	const [sortItem, setSortItem] = useState<"asc" | "desc">("asc");

	// Function to add a new task to the state
	const addTaskToClientInput = (taskTitle: string) => {
		const currentUser = auth.currentUser;

		const createdBy = currentUser ? currentUser.displayName || currentUser.uid : "Anonymous";

		const newTask = {
			title: taskTitle,
			createdBy: createdBy,
			createdAt: new Date(), // Set the current date or a default value
			dueDate: null, // Default value or real value if available
			downloads: [], // Empty array or real file upload URLs
		};

		setTasks((prevTasks) => [...prevTasks, newTask]);
	};

	useEffect(() => {
		const fetchTasks = async () => {
			try {
				const q = query(collection(db, "tasks"), orderBy("createdAt", sortItem));
				const querySnapshot = await getDocs(q);
				const fetchedTasks: {
					title: string;
					createdBy: string;
					createdAt: Date | null;
					dueDate: Date | null;
					downloads: string[];
				}[] = querySnapshot.docs.map((doc) => {
					const data = doc.data();
					const createdAt = data.createdAt?.toDate();
					const createdBy = data.createdBy;
					const dueDate = data.dueDate;
					const downloads = data.fileUpload;
					const title = data.title;

					return { title, createdAt, createdBy, downloads, dueDate };
				});
				setTasks(fetchedTasks);
			} catch (error) {
				console.log(error);
				throw new Error("Cannot fetch data.");
			}
		};

		fetchTasks();
	}, [sortItem]);

	const sortFilter = () => setSortItem("desc");

	return (
		<div className="flex w-full h-screen">
			<SideBar onAddTask={addTaskToClientInput} />

			<main className="w-full flex justify-center mt-20">
				<div className="flex flex-col md:flex-row justify-evenly items-center border-4 w-full h-full">
					<div
						className="border-2 border-zinc-800 w-[400px] h-[300px] text-center"
						onClick={sortFilter}
					>
						<h3>Client Input</h3>
						<ul>
							{tasks.map((task, index) => (
								<CardComponent key={index} task={task} />
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
