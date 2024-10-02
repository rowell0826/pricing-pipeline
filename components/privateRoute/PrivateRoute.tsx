"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { useEffect } from "react";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { user, loading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/signin"); // Redirect to sign-in page if not authenticated
		}
	}, [user, loading, router]);

	if (loading || !user) {
		return <div className="w-screen h-screen flex justify-center items-center">Loading...</div>;
	}

	return <>{children}</>;
};

export default PrivateRoute;
