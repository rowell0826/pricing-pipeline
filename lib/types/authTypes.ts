import { User } from "firebase/auth";

export type DefaultFormFields = {
	displayName: string;
	email: string;
	password: string;
	passwordConfirm: string;
};

export interface UserDetails {
	displayName: string;
	emailAddress: string;
	role: string;
}

export interface AuthContextProps {
	user: User | null;
	loading: boolean;
	isAuthenticated: boolean;
}

export interface UserRole {
	role: string;
}

export type AuthRole =
	| "admin"
	| "client"
	| "dataManager"
	| "dataQA"
	| "dataScientist"
	| "promptEngineer";
