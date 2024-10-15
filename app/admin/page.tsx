"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectItem,
	SelectLabel,
	SelectContent,
	SelectGroup,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/context/AuthContext";
import { db } from "@/lib/utils/firebase/firebase";
import {
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	Timestamp,
	updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

interface FirestoreUser {
	id: string;
	displayName: string;
	emailAddress: string;
	role: string;
	createdAt: string; // Adjust the type based on your Firestore date format
}

const Admin: React.FC = () => {
	const [userList, setUserList] = useState<FirestoreUser[]>([]);
	const [openDialogUser, setOpenDialogUser] = useState<FirestoreUser | null>(null);
	const { role, loading } = useAuth();

	const router = useRouter();

	useEffect(() => {
		const fetchUserLists = async () => {
			try {
				const userQuery = query(collection(db, "users"));
				const userListSnapshot = await getDocs(userQuery);

				// Map over the fetched documents to extract data
				const users: FirestoreUser[] = userListSnapshot.docs.map((doc) => {
					const data = doc.data();
					return {
						id: doc.id,
						displayName: data.displayName,
						emailAddress: data.emailAddress,
						role: data.role,
						createdAt: (data.createdAt as Timestamp).toDate().toLocaleDateString(),
					};
				});

				setUserList(users);
			} catch (error) {
				console.error("Error fetching user lists:", error);
			}
		};

		fetchUserLists();
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (role !== "admin") {
		router.push("/");

		return <div>Unauthorized: You do not have permission to access this page.</div>;
	}

	const deleteUser = async (userId: string) => {
		try {
			const userRef = doc(db, "users", userId);

			await deleteDoc(userRef);

			// Update the UI by removing the deleted user from the userList state
			setUserList((prevList) => prevList.filter((user) => user.id !== userId));

			console.log("User deleted successfully", userId);
		} catch (error) {
			console.error("Error deleting user:", error);
		}
	};

	const updateUserRole = async (userId: string, newRole: string, displayName: string) => {
		try {
			const userRef = doc(db, "users", userId);
			await updateDoc(userRef, {
				displayName: displayName,
				role: newRole,
			});
			console.log("User role updated successfully", userId, newRole);
		} catch (error) {
			console.error("Error updating user role:", error);
		}
	};

	const handleCancel = () => {
		setOpenDialogUser(null);
	};

	return (
		<div className="flex flex-col justify-center items-center">
			<div className="self-start top-5 w-full absolute flex justify-between items-center">
				<Link href="/">
					<Button className="ml-5">
						<FaArrowLeft />
					</Button>
				</Link>
				<Switch className="mr-5" />
			</div>

			<Card className="w-[80%] h-[80%] overflow-y-scroll custom-scrollbar mt-[5%]">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Display Name</TableHead>
							<TableHead>Email Registered</TableHead>
							<TableHead>User Role</TableHead>
							<TableHead>Date Registered</TableHead>
							<TableHead>Edit Role</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{userList.map((user, idx) => (
							<TableRow key={idx}>
								<TableCell>{user.displayName}</TableCell>
								<TableCell>{user.emailAddress}</TableCell>
								<TableCell>
									{user.role === "admin"
										? "Admin"
										: user.role === "client"
										? "Client"
										: user.role === "dataManager"
										? "Data Manager"
										: user.role === "dataQA"
										? "Data QA"
										: user.role === "dataScientist"
										? "Data Scientist"
										: user.role === "promptEngineer"
										? "Prompt Engineer"
										: null}
								</TableCell>
								<TableCell>{user.createdAt}</TableCell>
								<TableCell className="flex justify-evenly gap-2">
									<Button size={"sm"} onClick={() => setOpenDialogUser(user)}>
										Edit
									</Button>

									<Button size={"sm"} onClick={() => deleteUser(user.id)}>
										Delete
									</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>

			{openDialogUser && (
				<Dialog open={!!openDialogUser} onOpenChange={() => setOpenDialogUser(null)}>
					<DialogOverlay className="bg-black/50" />
					<DialogContent className="flex flex-col justify-start items-center">
						<DialogHeader>
							<DialogTitle>{openDialogUser.displayName}</DialogTitle>
						</DialogHeader>
						<Label>
							{openDialogUser.role === "admin"
								? "Admin"
								: openDialogUser.role === "client"
								? "Client"
								: openDialogUser.role === "dataManager"
								? "Data Manager"
								: openDialogUser.role === "dataQA"
								? "Data QA"
								: openDialogUser.role === "dataScientist"
								? "Data Scientist"
								: openDialogUser.role === "promptEngineer"
								? "Prompt Engineer"
								: "No Role"}
						</Label>
						<Label className="self-start">Role:</Label>
						<Select
							value={openDialogUser.role}
							onValueChange={(value) => {
								setOpenDialogUser((prev) =>
									prev ? { ...prev, role: value } : null
								);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Set user role" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectLabel>User Roles</SelectLabel>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="client">Client</SelectItem>
									<SelectItem value="dataManager">Data Manager</SelectItem>
									<SelectItem value="dataQA">Data QA</SelectItem>
									<SelectItem value="dataScientist">Data Scientist</SelectItem>
									<SelectItem value="promptEngineer">Prompt Engineer</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
						<Label className="self-start">Display Name:</Label>
						<Input
							placeholder="Display name"
							value={openDialogUser.displayName}
							onChange={(e) =>
								setOpenDialogUser((prev) =>
									prev ? { ...prev, displayName: e.target.value } : null
								)
							}
						/>
						<div className="w-full flex justify-end items-center gap-4">
							<Button
								onClick={() => {
									if (openDialogUser) {
										updateUserRole(
											openDialogUser.id,
											openDialogUser.role,
											openDialogUser.displayName
										);
										setOpenDialogUser(null);
									}
								}}
							>
								Save
							</Button>
							<Button onClick={handleCancel}>Cancel</Button>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};

export default Admin;
