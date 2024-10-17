"use client";

import { ThemeContextProps } from "@/lib/types/themeTypes";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<boolean>(false);

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

	console.log("Theme: ", theme);

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("Theme must be used within a ThemeProvider");
	}

	return context;
};
