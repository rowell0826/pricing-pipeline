"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
		<div className="flex justify-center items-center">
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
								<TableCell>
									<Button>Edit</Button>
									<Button>Delete</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
};

export default Admin;
