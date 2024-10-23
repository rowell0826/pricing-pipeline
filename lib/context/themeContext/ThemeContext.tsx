"use client";

import { ThemeContextProps } from "@/lib/types/themeTypes";
import { createContext, useContext, useEffect, useState } from "react";
import Swal from "sweetalert2";

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<boolean>(false);
	const [backgroundColor, setBackgroundColor] = useState<string>("");
	const [textColor, setTextColor] = useState<string>("");

	useEffect(() => {
		// Ensure this code runs only on the client-side
		if (typeof window !== "undefined") {
			const backgroundColor = getComputedStyle(document.documentElement)
				.getPropertyValue("--background")
				.trim();
			const textColor = getComputedStyle(document.documentElement)
				.getPropertyValue("--foreground")
				.trim();

			setBackgroundColor(backgroundColor);
			setTextColor(textColor);
		}
	}, []);

	const showAlert = (
		iconImg: "success" | "error" | "warning" | "info" | "question",
		htmlTxt: string
	) => {
		Swal.fire({
			position: "top",
			icon: iconImg,
			html: htmlTxt,
			timer: 1500,
			showConfirmButton: false,
			toast: true,
			background: `hsl(${backgroundColor})`,
			color: `hsl(${textColor})`,
		});
	};

	const toggleTheme = () => {
		setTheme(!theme);

		if (!theme) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.removeItem("theme");
		}
	};

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

		if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
			setTheme(true);
			document.documentElement.classList.add("dark");
		} else {
			setTheme(false);
			document.documentElement.classList.remove("dark");
		}
	}, []);

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, showAlert }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextProps => {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("Theme must be used within a ThemeProvider");
	}

	return context;
};
