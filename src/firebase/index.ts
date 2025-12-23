'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import {
  useCollection,
  useDoc,
} from './firestore/use-collection';
import { useUser } from './auth/use-user';
import {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useFirestore as useFirestoreFromProvider,
  useAuth,
} from './provider';
import { FirebaseClientProvider } from './client-provider';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      // Initialize Firebase
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      firestore = initializeFirestore(firebaseApp, {});
    } else {
      // Get existing Firebase app
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      // Get existing Firestore instance
      firestore = getFirestore(firebaseApp);
    }
  }
  // On the server, we'll return undefined and let the client-side provider handle it.
  // @ts-ignore
  return { firebaseApp, auth, firestore };
}


export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useAuth,
};
// Rename the import to avoid conflict with the hook from provider
export { useFirestoreFromProvider as useFirestore };
