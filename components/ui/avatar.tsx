"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Root
		ref={ref}
		className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
		{...props}
	/>
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Image>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Image
		ref={ref}
		className={cn("aspect-square h-full w-full", className)}
		{...props}
	/>
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const colors: string[] = [
	"#FF5733", // Vibrant Red
	"#33FF57", // Lime Green
	"#3357FF", // Bright Blue
	"#F1C40F", // Sun Yellow
	"#8E44AD", // Purple
	"#2ECC71", // Emerald Green
	"#E74C3C", // Light Red
	"#3498DB", // Sky Blue
	"#F39C12", // Orange
	"#9B59B6", // Soft Violet
	"#1ABC9C", // Aqua Blue
	"#C0392B", // Deep Red
	"#2980B9", // Ocean Blue
	"#7F8C8D", // Grey
	"#34495E", // Navy
	"#D35400", // Dark Orange
	"#16A085", // Teal
	"#E67E22", // Carrot Orange
	"#BDC3C7", // Light Grey
	"#95A5A6", // Dark Grey
];

const randomColor = Math.ceil(Math.random() * colors.length);

const AvatarFallback = React.forwardRef<
	React.ElementRef<typeof AvatarPrimitive.Fallback>,
	React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Fallback
		ref={ref}
		className={cn(
			`flex h-full w-full items-center justify-center rounded-full text-white`,
			className
		)}
		style={{ backgroundColor: colors[randomColor] }}
		{...props}
	/>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
