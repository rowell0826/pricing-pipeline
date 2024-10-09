"use client";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Button } from "../ui/button";
import { FormItems } from "@/lib/types/formTypes";
import { DefaultFormFields } from "@/lib/types/authTypes";
import {
	createAuthUserWithEmailAndPassword,
	createUserDocumentFromAuth,
} from "@/lib/utils/firebase/firebase";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";

const formSchema = z
	.object({
		displayName: z.string(),
		emailAddress: z.string().email({ message: "Please enter a valid email address" }),
		password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
		passwordConfirm: z.string(),
	})
	.refine(
		(data) => {
			return data.password === data.passwordConfirm;
		},
		{
			message: "Password do not match",
			path: ["passwordConfirm"],
		}
	);

const formItemLabels: FormItems[] = [
	{
		labelText: "Display Name",
		placeHolderText: "Display Name",
		inputType: "display name",
		formDefaultValue: "displayName",
	},
	{
		labelText: "Email Address",
		placeHolderText: "Email Address",
		inputType: "email",
		formDefaultValue: "emailAddress",
	},
	{
		labelText: "Password",
		placeHolderText: "Password",
		inputType: "password",
		formDefaultValue: "password",
	},
	{
		labelText: "Confirm Password",
		placeHolderText: "Confirm Password",
		inputType: "password",
		formDefaultValue: "passwordConfirm",
	},
];

const defaultFormFields: DefaultFormFields = {
	displayName: "",
	email: "",
	password: "",
	passwordConfirm: "",
};

export default function SignUpForm() {
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: defaultFormFields,
	});

	const handleSubmit = async (data: z.infer<typeof formSchema>) => {
		const { displayName, emailAddress, password } = data;
		const role = "";

		try {
			// Create user with Firebase Auth
			const userCredential = await createAuthUserWithEmailAndPassword(emailAddress, password);

			// Check if the user exists in the userCredential object
			const user = userCredential?.user;

			if (!user) {
				throw new Error("User creation failed, no user data available.");
			}

			await updateProfile(user, {
				displayName: displayName,
			});

			// Store user details in Firestore
			await createUserDocumentFromAuth(user.uid, { displayName, emailAddress, role });

			alert("User signed up successfully");
		} catch (error) {
			console.error("Error signing up: ", error);
		} finally {
			router.push("/");
		}
	};

	return (
		<main className="w-full h-[50%] min-h-[450px] flex flex-col items-center justify-center">
			<section className="w-full h-[50%] min-h-[450px] flex flex-col items-center justify-center p-24">
				<div className="border border-slate-100 shadow-lg rounded-lg p-8 w-full min-w-80 max-w-md">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleSubmit)}
							className="max-w-sm w-full flex flex-col gap-4"
						>
							{formItemLabels.map(
								(
									{ labelText, placeHolderText, inputType, formDefaultValue },
									idx
								) => (
									<FormField
										key={idx}
										control={form.control}
										name={formDefaultValue as keyof z.infer<typeof formSchema>}
										render={({ field }) => {
											return (
												<FormItem>
													<FormLabel>{labelText}</FormLabel>
													<FormControl>
														<Input
															placeholder={placeHolderText}
															type={inputType}
															{...field}
														/>
													</FormControl>
													<FormMessage>
														{
															form.formState.errors[
																formDefaultValue as keyof z.infer<
																	typeof formSchema
																>
															]?.message
														}
													</FormMessage>
												</FormItem>
											);
										}}
									/>
								)
							)}
							<div className="flex flex-col justify-center items-center gap-4">
								<Button type="submit" className="w-full">
									Sign Up
								</Button>
							</div>
						</form>
					</Form>
				</div>
			</section>
		</main>
	);
}
