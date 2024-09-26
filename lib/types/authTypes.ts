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
