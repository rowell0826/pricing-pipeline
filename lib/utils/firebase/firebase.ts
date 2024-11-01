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
import {
	collection,
	doc,
	Firestore,
	getDoc,
	getDocs,
	getFirestore,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import {
	deleteObject,
	getDownloadURL,
	getStorage,
	listAll,
	ref,
	uploadBytesResumable,
	// UploadTaskSnapshot,
} from "firebase/storage";
import dayjs from "dayjs";
import Swal from "sweetalert2";

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

// Set-up firestore storage --> This is where we will store the folders and files.
export const storage = getStorage();

// Set-up storage reference for client --> This is the folder for the raw files uploaded by the client
export const clientRawFileRef = ref(storage, "raw");

// Set-up storage reference for data manager and data QA
export const dataMgrAndQaRef = ref(storage, "data_mgr_and_qa");

// Set-up storage reference for data science and prompt engineer
export const dataScienceAndPromptEngrRef = ref(storage, "data_science");

// -------------------------------- User's Authentication Set-up -------------------------------------

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
			const id = userSnapshot.id;

			// Set the user details in Firestore
			await setDoc(userDocRef, { ...userDetails, role, createdAt, id }, { merge: true });

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
	try {
		if (!email || !password) return;

		return await createUserWithEmailAndPassword(auth, email, password);
	} catch (error) {
		console.error("Error signing up: ", error);
		Swal.fire({
			position: "top",
			icon: "error",
			html: `Signup error: ${(error as Error).message}`,
			timer: 1500,
			showConfirmButton: false,
			toast: true,
			background: `hsl(0 0% 3.9%)`,
			color: `hsl(0 0% 98%)`,
		});
	}
};

// Sign-in with email and password
export const signInAuthUserWithEmailAndPassword = async (email: string, password: string) => {
	if (!email || !password) return;

	return await signInWithEmailAndPassword(auth, email, password);
};

// Below are authentication functionalities used for the project mostly account sign-in and account sign-up
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

// Get user details
export const getUserDetails = async (userId: string) => {
	try {
		const userDocRef = doc(db, "users", userId);
		const userSnapshot = await getDoc(userDocRef);
		if (userSnapshot.exists()) {
			return userSnapshot.data(); // Contains user details like role
		} else {
			console.log("No user document found");
			return null;
		}
	} catch (error) {
		console.error("Error fetching user details:", error);
		return null;
	}
};

// Sign-out user
export const signOutUser = async (): Promise<void> => await signOut(auth);

// ---------------------------------- Firestore Storage ---------------------------------

// Client file upload
export const clientFileUpload = async (container: string, file: File): Promise<string | null> => {
	if (!file) {
		console.error("No file provided for upload.");
		return null;
	}

	try {
		// Create a reference for the file in Firebase Storage
		const clientRawFileRef = ref(storage, `${container}/${file.name}`);

		// Create an upload task
		const uploadTask = uploadBytesResumable(clientRawFileRef, file);

		// Return the upload snapshot once the upload completes
		await new Promise<void>((resolve, reject) => {
			uploadTask.on(
				"state_changed",
				(snapshot) => {
					// Monitor upload progress
					const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
					console.log(`Upload is ${progress}% done`);
				},
				(error) => {
					console.error("Error uploading file:", error);
					reject(error);
				},
				() => {
					// Resolve when upload completes
					resolve();
				}
			);
		});

		// Get the download URL for the uploaded file
		const downloadURL = await getDownloadURL(clientRawFileRef);
		console.log("File uploaded successfully. Download URL:");

		return downloadURL;
	} catch (error) {
		console.error("Error uploading file:", error);

		return null;
	}
};

// Function to list all files in a folder (or root)
export const listFiles = async (folder: string = "") => {
	const folderRef = ref(storage, folder);
	try {
		const result = await listAll(folderRef);

		return result.items;
	} catch (error) {
		console.error("Error fetching files: ", error);

		return [];
	}
};

// Delete a file from Firebase Storage
export const deleteFileFromStorage = async (fileUrl: string): Promise<void> => {
	try {
		// Create a reference to the file using the file URL
		const fileRef = ref(storage, fileUrl);

		// Delete the file
		await deleteObject(fileRef);

		console.log("File deleted successfully");
	} catch (error) {
		console.error("Error deleting file:", error);

		throw error;
	}
};

// ---------------------------------- Firestore database ---------------------------------

// Function to fetch user role from Firestore
export const getUserRoleFromFirestore = async (userId: string) => {
	try {
		const userDocRef = doc(db, "users", userId);
		const userDoc = await getDoc(userDocRef);

		if (userDoc.exists()) {
			const userData = userDoc.data();
			return userData.role;
		} else {
			console.error("No such document!");
			return null;
		}
	} catch (error) {
		console.error("Error fetching user role:", error);
		return null;
	}
};

export const autoArchiveTickets = async () => {
	const archiveThreshold = dayjs().subtract(7, "days"); // Calculate the date 7 days ago

	try {
		const tasksRef = collection(db, "tasks"); // Reference to the tasks collection
		const outdatedTicketsQuery = query(
			tasksRef,
			where("status", "==", "done"), // Only select tasks that are done
			where("dueDate", "<=", archiveThreshold.toDate()) // Select tasks older than 7 days
		);

		const querySnapshot = await getDocs(outdatedTicketsQuery); // Get the outdated tasks

		const updatePromises = querySnapshot.docs.map((taskDoc) =>
			updateDoc(doc(db, "tasks", taskDoc.id), { status: "archive" })
		);

		await Promise.all(updatePromises);
		console.log("Successfully archived outdated tasks");
	} catch (error) {
		console.error("Error archiving tasks:", error);
	}
};
