"use client";
import {
	clientFileUpload,
	db,
	getUserDetails,
	listFiles,
	signOutUser,
} from "@/lib/utils/firebase/firebase";
import { RxHamburgerMenu } from "react-icons/rx";
import { Switch } from "../ui/switch";
import { useEffect, useState } from "react";
import { auth } from "@/lib/utils/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FcOpenedFolder } from "react-icons/fc";
import { BsListTask } from "react-icons/bs";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { PiSignOutBold } from "react-icons/pi";
import { addDoc, collection } from "firebase/firestore";
import { SideBarProps } from "@/lib/types/sideBarProps";
import { getDownloadURL } from "firebase/storage";
import Modal from "../modal/Modal";
import React from "react";
import FileListModal from "../modal/FileListModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

export default function SideBar({ onAddTask }: SideBarProps) {
	const [userName, setUserName] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState<boolean>(true);
	const [openCreateTaskModal, setOpenCreateTaskModal] = useState<boolean>(false);
	const [file, setFile] = useState<File | null>(null);
	const [dueDateInput, setDueDateInput] = useState<string>("");
	const [taskTitle, setTaskTitle] = useState<string>("");
	const [fileList, setFileList] = useState<string[]>([]);
	const [openFileModal, setOpenFileModal] = useState<boolean>(false);

	// Function to fetch and list files
	const fetchFiles = async () => {
		const fileRefs = await listFiles("/raw");
		const fileUrls = await Promise.all(
			fileRefs.map(async (fileRef) => {
				const url = await getDownloadURL(fileRef);
				return url;
			})
		);
		setFileList(fileUrls);
	};

	// Fetch user data and role
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// User is signed in, retrieve display name and uid for reference
				const { displayName, uid } = user;

				// Set display name from Firebase Auth
				setUserName(displayName || "User");

				// Fetch user role from Firestore
				const userDetails = await getUserDetails(uid);

				if (userDetails) {
					setRole(userDetails.role || "No Role");
				}
			} else {
				// User is not signed in, reset the state
				setUserName(null);
				setRole(null);
			}

			setLoading(false);
		});

		// Cleanup the listener on unmount
		return () => unsubscribe();
	}, []);

	if (loading) {
		return <p>Loading...</p>;
	}

	const handleSignOut = () => signOutUser();

	const sideBarToggle = () => {
		setIsOpen(!isOpen);
	};

	const modalHandler = () => {
		setOpenCreateTaskModal(!openCreateTaskModal);
	};

	const handleAddTask = async () => {
		if (!file) {
			alert("Please upload a file before adding a task.");
			return;
		}

		const snapshot = await clientFileUpload(file);

		if (snapshot) {
			const downloadUrl = await getDownloadURL(snapshot.ref);
			console.log("File available at:", downloadUrl);

			if (taskTitle && dueDateInput) {
				const dueDate = new Date(dueDateInput); // `dueDateInput` is already in `YYYY-MM-DD` format

				if (isNaN(dueDate.getTime())) {
					alert("Invalid due date. Please select a valid date.");
					return;
				}

				await addDoc(collection(db, "raw"), {
					title: taskTitle,
					createdAt: new Date(),
					createdBy: userName,
					dueDate,
					fileUpload: [downloadUrl],
				});

				alert("Task added successfully!");
				onAddTask(taskTitle);
				setOpenCreateTaskModal(!openCreateTaskModal);
				setTaskTitle("");
				setDueDateInput("");
				setFile(null);
			}
		}
	};

	const handleViewFiles = () => {
		setOpenFileModal(true);
		fetchFiles();
	};

	return (
		<>
			<div className="w-full flex justify-end items-center absolute p-2">
				<Switch />
			</div>

			{/* Mobile devices */}
			<div className="md:hidden w-[10%] h-[10%] flex justify-start items-start z-10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size={"sm"} className="bg-background text-sidebar">
							<RxHamburgerMenu className="m-auto" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-80 ml-2">
						<DropdownMenuLabel className="flex justify-between">
							{userName}
							<DropdownMenuShortcut>{role}</DropdownMenuShortcut>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>View Files</DropdownMenuItem>
							<DropdownMenuItem>Create Task</DropdownMenuItem>
							<DropdownMenuItem>Sign Out</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Medium to larger devices */}
			<nav
				className={`hidden h-full md:flex flex-col justify-evenly items-center bg-sidebar ${
					isOpen ? "w-[20%]" : "w-[5%]"
				} transition-all duration-300 ease-in-out overflow-hidden`}
			>
				<div
					className={`relative w-full flex justify-end items-end ${
						isOpen ? "-md:mt-[80px]" : "-md:mt-[100px]"
					}`}
				>
					<div className="w-10 h-10 bg-gray-400 p-2 rounded-md flex justify-center items-center">
						{isOpen ? (
							<IoIosArrowBack onClick={sideBarToggle} />
						) : (
							<IoIosArrowForward onClick={sideBarToggle} />
						)}
					</div>
				</div>

				<div>
					<h1 className={`${isOpen ? "" : "hidden"} text-background`}>Hi, {userName}</h1>
					<p className={`${isOpen ? "" : "hidden"} text-center text-background`}>
						{role}
					</p>
				</div>

				<ul className="flex flex-col gap-4">
					<li
						className="p-4 flex justify-center items-center gap-2 cursor-pointer text-background"
						onClick={handleViewFiles}
					>
						<span className="inline-block">
							<FcOpenedFolder />
						</span>
						{isOpen && "View Files"}
					</li>
					<li
						className="p-4 flex justify-center items-center gap-2 cursor-pointer text-background"
						onClick={modalHandler}
					>
						<span className="inline-block">
							<BsListTask color="white" />
						</span>
						{isOpen && "Create Task"}
					</li>
				</ul>
				<p
					className="mb-10 flex justify-center items-center cursor-pointer text-background"
					onClick={handleSignOut}
				>
					<span className="inline-block">
						<PiSignOutBold />
					</span>
					{isOpen && "Sign Out"}
				</p>
			</nav>

			<FileListModal
				open={openFileModal}
				onOpenChange={setOpenFileModal}
				fileList={fileList}
			/>

			<Modal
				open={openCreateTaskModal}
				onOpenChange={setOpenCreateTaskModal}
				taskTitle={taskTitle}
				setTaskTitle={setTaskTitle}
				dueDateInput={dueDateInput}
				setDueDateInput={setDueDateInput}
				file={file}
				setFile={setFile}
				handleAddTask={handleAddTask}
			/>
		</>
	);
}
