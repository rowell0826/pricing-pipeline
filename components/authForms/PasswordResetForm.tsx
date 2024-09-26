"use client";
import { useState } from "react";
import { auth, db } from "@/lib/utils/firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { collection, getDocs, query, where } from "firebase/firestore";

const schema = z.object({
	email: z.string().email({ message: "Invalid email address" }),
});

type FormData = z.infer<typeof schema>;

export default function PasswordResetForm() {
	const form = useForm<FormData>({
		resolver: zodResolver(schema),
	});

	const { handleSubmit, formState } = form;
	const { errors } = formState;

	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const onSubmit = async (data: FormData) => {
		const { email } = data;
		setMessage(null);
		setError(null);

		try {
			// Query Firestore to check if the user exists
			const usersRef = collection(db, "users");
			const q = query(usersRef, where("email", "==", email));
			const querySnapshot = await getDocs(q);

			if (querySnapshot.empty) {
				setError("Email does not exist in the database.");
			} else {
				await sendPasswordResetEmail(auth, email);
				setMessage(`Password reset email sent to ${email}`);
			}
		} catch (error) {
			setError("Failed to send password reset email. Please try again.");
		}
	};

	return (
		<section className="w-screen min-h-screen flex flex-col items-center justify-between p-24">
			<div className="border border-slate-100 shadow-lg rounded-lg p-8 w-full min-w-80 max-w-md ">
				<h2 className="text-center">Reset Password</h2>
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem className="flex justify-center items-center gap-2">
									<FormLabel htmlFor="email" className="text-md font-normal">
										Email:
									</FormLabel>
									<FormControl>
										<Input
											id="email"
											type="email"
											placeholder="Enter your email"
											{...field}
											{...form.register("email")}
										/>
									</FormControl>
									{errors.email && (
										<FormMessage>{errors.email.message}</FormMessage>
									)}
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full">
							Send Password Reset Email
						</Button>
					</form>
				</Form>

				{message && <p>{message}</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}
			</div>
		</section>
	);
}
