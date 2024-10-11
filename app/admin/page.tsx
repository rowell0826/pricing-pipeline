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
import { collection, getDocs, query, Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from "react";

interface FirestoreUser {
	displayName: string;
	emailAddress: string;
	role: string;
	createdAt: string; // Adjust the type based on your Firestore date format
}

const Admin: React.FC = () => {
	const [userList, setUserList] = useState<FirestoreUser[]>([]);
	const [openDialogUser, setOpenDialogUser] = useState<FirestoreUser | null>(null);
	const { role, loading, isAuthenticated } = useAuth();

	useEffect(() => {
		const fetchUserLists = async () => {
			try {
				const userQuery = query(collection(db, "users"));
				const userListSnapshot = await getDocs(userQuery);

				// Map over the fetched documents to extract data
				const users: FirestoreUser[] = userListSnapshot.docs.map((doc) => {
					const data = doc.data();
					return {
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

	if (!isAuthenticated) {
		return <div>Unauthorized</div>;
	}

	if (role !== "admin") {
		return <div>Unauthorized: You do not have permission to access this page.</div>;
	}

	return (
		<div className="flex flex-col justify-center items-center">
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
								<TableCell>{user.role === "admin" ? "Admin" : null}</TableCell>
								<TableCell>{user.createdAt}</TableCell>
								<TableCell className="flex justify-evenly gap-2">
									<Button size={"sm"} onClick={() => setOpenDialogUser(user)}>
										Edit
									</Button>

									<Button size={"sm"}>Delete</Button>
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
								: null}
						</Label>
						<Select>
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
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
};

export default Admin;
