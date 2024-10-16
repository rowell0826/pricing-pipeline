"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, getUserDetails } from "@/lib/utils/firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { AuthContextProps } from "../../types/authTypes";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [role, setRole] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);
			setLoading(false);

			if (currentUser) {
				const { uid } = currentUser;

				try {
					// Fetch user details from your function
					const userDetails = await getUserDetails(uid);
					let role = userDetails?.role || "No Role";

					// Fetch user data from Firestore
					const userRef = doc(db, "users", uid);
					const userSnapshot = await getDoc(userRef);

					if (userSnapshot.exists()) {
						const userData = userSnapshot.data();

						if (userData.role) {
							role = userData.role; // Override role if found in Firestore
						}
						setIsAuthenticated(true);
					} else {
						console.log("No such document!");
					}

					// Set role only once after all checks
					setRole(role);
				} catch (error) {
					setRole(null);
					console.error("Error fetching user data:", error);
				}
			} else {
				// User is signed out
				setRole(null);
				setIsAuthenticated(false);
			}
		});

		// Cleanup the listener on unmount
		return () => unsubscribe();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				userName: user?.displayName || "User",
				loading,
				isAuthenticated,
				role,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextProps => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
