import { User } from 'firebase/auth';


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
	userName: string | null;
	loading: boolean;
	isAuthenticated: boolean;
	role: string | null;
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
