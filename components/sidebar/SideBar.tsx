"use client";
import { signOutUser } from "@/lib/utils/firebase/firebase";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";

export default function SideBar() {
	const router = useRouter();

	const handleSignOut = () => {
		signOutUser();
		router.push("/signin");
	};

	return (
		<>
			<div className="w-full flex justify-end items-center absolute">
				<Switch />
			</div>
			<nav className="h-full w-[25%] flex flex-col justify-between items-center border-2 border-zinc-800 bg-[--primary]">
				<div className="mt-10">Hi, User</div>
				<ul className="flex flex-col gap-4">
					<li className="p-4">View Files</li>
					<li className="p-4">Create Task</li>
				</ul>
				<p className="mb-10" onClick={handleSignOut}>
					Sign Out
				</p>
			</nav>
		</>
	);
}
