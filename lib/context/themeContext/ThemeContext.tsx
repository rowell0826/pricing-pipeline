"use client";

import { ThemeContextProps } from "@/lib/types/themeTypes";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<boolean>(false);

	const toggleTheme = () => {
		setTheme((prevTheme) => !prevTheme);
		document.documentElement.classList.toggle("dark", !theme);
		localStorage.setItem("theme", !theme ? "dark" : "light");
	};

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme === "dark") {
			setTheme(true);
			document.documentElement.classList.add("dark");
		}
	}, []);

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextProps => {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("Theme must be used within a ThemeProvider");
	}

	return context;
};
