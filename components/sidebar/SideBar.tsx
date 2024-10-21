"use client";
import { signOutUser } from "@/lib/utils/firebase/firebase";
import { FiUsers } from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { Switch } from "../ui/switch";
import { useState } from "react";
import { FcOpenedFolder } from "react-icons/fc";
import { BsListTask } from "react-icons/bs";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { PiSignOutBold } from "react-icons/pi";
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

import Link from "next/link";
import { useAuth } from "@/lib/context/authContext/AuthContext";
import { useTheme } from "@/lib/context/themeContext/ThemeContext";
import { useCard } from "@/lib/context/cardContext/CardContext";

export default function SideBar() {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const [openFileModal, setOpenFileModal] = useState<boolean>(false);

	const { userName, loading, role } = useAuth();
	const { theme, toggleTheme } = useTheme();
	const { modalHandler, handleViewFiles, fileList } = useCard();

	if (loading) {
		return <p>Loading...</p>;
	}

	const handleSignOut = () => signOutUser();

	const sideBarToggle = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			<div className="w-full flex justify-end items-center absolute p-2">
				<Switch
					onCheckedChange={() => {
						toggleTheme();
					}}
					checked={theme}
				/>
			</div>

			{/* Mobile devices */}
			<div className="lg:hidden w-[10%] flex justify-start items-start z-10 p-1">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size={"sm"} className="bg-background text-sidebar">
							<RxHamburgerMenu className="m-auto text-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-80 ml-2">
						<DropdownMenuLabel className="flex justify-between">
							{userName}
							<DropdownMenuShortcut>
								{role === "admin"
									? "Admin"
									: role === "client"
									? "Client"
									: role === "dataManager"
									? "Data Manager"
									: role === "dataQA"
									? "Data QA"
									: role === "dataScientist"
									? "Data Scientist"
									: role === "promptEngineer"
									? "Prompt Engineer"
									: "No assigned role"}
							</DropdownMenuShortcut>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							{role === "admin" ? (
								<Link href="/admin">
									<DropdownMenuItem>User List</DropdownMenuItem>
								</Link>
							) : null}
							<DropdownMenuItem onClick={handleViewFiles}>
								View Files
							</DropdownMenuItem>
							<DropdownMenuItem onClick={modalHandler}>Create Task</DropdownMenuItem>
							<DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Medium to larger devices */}
			<nav
				className={`hidden h-full lg:flex flex-col justify-evenly items-center ${
					isOpen ? "w-[20%]" : "w-[5%]"
				} transition-all duration-300 ease-in-out overflow-hidden sidebar`}
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

				<div className="flex flex-col items-center">
					<h1 className={`${isOpen ? "" : "hidden"} text-sidebartx`}>Hi, {userName}</h1>
					<p className={`${isOpen ? "" : "hidden"} text-center text-sidebartx`}>
						{role === "admin"
							? "Admin"
							: role === "client"
							? "Client"
							: role === "dataManager"
							? "Data Manager"
							: role === "dataQA"
							? "Data QA"
							: role === "dataScientist"
							? "Data Scientist"
							: role === "promptEngineer"
							? "Prompt Engineer"
							: "No assigned role"}
					</p>
				</div>

				<ul className="flex flex-col gap-4">
					{role === "admin" ? (
						<Link href="/admin">
							<li className="p-4 flex justify-center items-center gap-2 cursor-pointer text-sidebartx">
								<span className="inline-block">
									<FiUsers />
								</span>
								{isOpen && "User List"}
							</li>
						</Link>
					) : null}
					<li
						className="p-4 flex justify-center items-center gap-2 cursor-pointer text-sidebartx"
						onClick={handleViewFiles}
					>
						<span className="inline-block">
							<FcOpenedFolder />
						</span>
						{isOpen && "View Files"}
					</li>
					<li
						className="p-4 flex justify-center items-center gap-2 cursor-pointer text-sidebartx"
						onClick={modalHandler}
					>
						<span className="inline-block">
							<BsListTask color="white" />
						</span>
						{isOpen && "Create Task"}
					</li>
				</ul>
				<p
					className="mb-10 flex justify-center items-center cursor-pointer text-sidebartx"
					onClick={handleSignOut}
				>
					<span className="inline-block">
						<PiSignOutBold />
					</span>
					{isOpen && "Sign Out"}
				</p>
			</nav>

			{role === "admin" ? (
				<FileListModal
					open={openFileModal}
					onOpenChange={setOpenFileModal}
					fileList={fileList}
				/>
			) : null}

			<Modal />
		</>
	);
}
