import { UserDetails } from "@/lib/types/authTypes";
import { FirebaseError, initializeApp } from "firebase/app";
import {
	createUserWithEmailAndPassword,
	getAuth,
	GoogleAuthProvider,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
} from "firebase/auth";
import { doc, Firestore, getDoc, getFirestore, setDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize google authentication
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
	prompt: "select_account",
});

// Set-up firebase user authentication
export const auth = getAuth();

// Set-up firestore database
export const db: Firestore = getFirestore(app);

// Create db for newly registered users
export const createUserDocumentFromAuth = async (userId: string, userDetails: UserDetails) => {
	if (!userId) return;

	// Define the document path where user details will be stored
	const userDocRef = doc(db, "users", userId);

	const userSnapshot = await getDoc(userDocRef);

	try {
		if (!userSnapshot.exists()) {
			const createdAt = new Date();
			const role = "";

			// Set the user details in Firestore
			await setDoc(userDocRef, { ...userDetails, role, createdAt }, { merge: true });

			console.log("User details stored successfully!");
		}

		return userSnapshot;
	} catch (error: unknown) {
		if (error instanceof FirebaseError) {
			console.error("Firebase error creating the user:", error.message);
		} else {
			console.error("Unknown error creating the user:", error);
		}
	}
};

// Create user with Email and Password
export const createAuthUserWithEmailAndPassword = async (email: string, password: string) => {
	if (!email || !password) return;

	return await createUserWithEmailAndPassword(auth, email, password);
};

// Sign-in with email and password
export const signInAuthUserWithEmailAndPassword = async (email: string, password: string) => {
	if (!email || !password) return;

	return await signInWithEmailAndPassword(auth, email, password);
};

// Below are authentication functionalities used for the project mostly account sign-in and account sign-up
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

// Sign-out user
export const signOutUser = async (): Promise<void> => await signOut(auth);
