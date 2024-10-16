import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/context/authContext/AuthContext";
import { ThemeProvider } from "@/lib/context/themeContext/ThemeContext";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Barker OTC Pricing Pipeline",
	description: "Generated by create next app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="scroll-smooth dark">
			<AuthProvider>
				<ThemeProvider>
					<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
						{children}
					</body>
				</ThemeProvider>
			</AuthProvider>
		</html>
	);
}
