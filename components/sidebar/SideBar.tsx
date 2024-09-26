"use client";
import { getUserDetails, signOutUser } from "@/lib/utils/firebase/firebase";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/utils/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FcOpenedFolder } from "react-icons/fc";
import { BsListTask } from "react-icons/bs";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { PiSignOutBold } from "react-icons/pi";

export default function SideBar() {
	const router = useRouter();
	const [userName, setUserName] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isOpen, setIsOpen] = useState<boolean>(true);

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

	const handleSignOut = () => {
		signOutUser();
		router.push("/signin");
	};

	const sideBarToggle = () => {
		setIsOpen(!isOpen);
	};

	return (
		<>
			<div className="w-full flex justify-end items-center absolute p-2">
				<Switch />
			</div>
			<nav
				className={`h-full flex flex-col justify-evenly items-center bg-background sidebar ${
					isOpen ? "w-[20%]" : "w-[5%]"
				} transition-all duration-300 ease-in-out overflow-hidden`}
			>
				<div
					className={`relative w-full flex justify-end items-end ${
						isOpen ? "-mt-[80px]" : "-mt-[100px]"
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
					<h1 className={`${isOpen ? "" : "hidden"}`}>Hi, {userName}</h1>
					<p className={`${isOpen ? "" : "hidden"} text-center`}>{role}</p>
				</div>

				<ul className="flex flex-col gap-4">
					<li className="p-4 flex justify-center items-center gap-2">
						<span className="inline-block">
							<FcOpenedFolder />
						</span>
						{isOpen && "View Files"}
					</li>
					<li className="p-4 flex justify-center items-center gap-2">
						<span className="inline-block">
							<BsListTask color="white" />
						</span>
						{isOpen && "Create Task"}
					</li>
				</ul>
				<p className="mb-10 flex justify-center items-center" onClick={handleSignOut}>
					<PiSignOutBold />
					{isOpen && "Sign Out"}
				</p>
			</nav>
		</>
	);
}
