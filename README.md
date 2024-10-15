# Pricing Pipeline

A brief description of your project, its purpose, and what it does.

## Features

-   User authentication
-   Firestore integration
-   Firebase storage
-   Drag and drop functionality

## Tech Stack

-   **Next.js** for the frontend
-   **Firebase** for authentication, Firestore, and storage
-   **TypeScript**
-   **Tailwind CSS**
-   **Shadcn**
-   **Dnd-kit**

## Getting Started

To get started with this project, follow the steps below.

### Prerequisites

Ensure you have Node.js and npm, yarn, or pnpm installed.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repo.git
```

2. Navigate to the project directory:

```bash
cd your-repo
```

3. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Run the development server

Start the development server with

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Then, open http://localhost:3000 to view the project in your browser.

## Firebase Setup

Follow the steps below to set up Firebase for this project.

## Firebase Authentication

1. Sign up at Firebase and go to the Firebase Console.
2. Create a new project.
3. Select the </> icon to create a web app, then name it and take note of the Firebase configuration.
4. In the sidebar menu, expand Build and click Authentication.
5. Under the Sign-in method tab, enable Google and Email/Password as sign-in providers.

## Firestore Database

1. In the sidebar menu, expand Build and click Firestore Database.
2. Create a database and choose a location.
3. Start in Production mode, then click Create.
4. After creation, go to the Rules tab and replace the existing code with the following:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This rule allows read/write access only to authenticated users.

## Firebase storage

1. In the sidebar menu, expand Build and click Storage.
2. Click Get Started to enable Firebase Storage.
3. After setting up storage, go to the Rules tab and modify the code with the following:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This rule restricts file storage to authenticated users.

## Environment Variables

Add your Firebase configuration to a .env.local file in the root of your project:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```
