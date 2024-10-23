export interface ThemeContextProps {
	theme: boolean;
	toggleTheme: () => void;
	showAlert: (icon: "success" | "error" | "warning" | "info" | "question", txt: string) => void;
}
