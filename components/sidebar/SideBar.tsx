"use client";
import { getUserDetails, signOutUser } from "@/lib/utils/firebase/firebase";
import { Switch } from "../ui/switch";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/utils/firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function SideBar() {
	const router = useRouter();
	const [userName, setUserName] = useState<string | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

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

	return (
		<>
			<div className="w-full flex justify-end items-center absolute">
				<Switch />
			</div>
			<nav className="h-full w-[25%] flex flex-col justify-between items-center border-2 border-zinc-800 bg-[--primary]">
				<div className="mt-10">
					<h1>Hi, {userName}</h1>
					<p>{role}</p>
				</div>
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
