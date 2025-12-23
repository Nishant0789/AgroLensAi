// This file is not intended to be edited.
// It is used to store the Firebase project configuration.
// To switch to a different Firebase project, go to the Firebase Integrations page.
// The content of this file is automatically updated when you switch projects.
import { FirebaseOptions } from 'firebase/app';
export const firebaseConfig: FirebaseOptions = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG || '{}'
);
