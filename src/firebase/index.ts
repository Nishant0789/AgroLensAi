'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { firebaseConfig } from './config';
import { useCollection, useDoc } from './firestore/use-collection';
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
let persistenceEnabled = false;

function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      // Initialize the app first
      firebaseApp = initializeApp(firebaseConfig);
      
      // Initialize Firestore with settings before getting the instance
      firestore = initializeFirestore(firebaseApp, {});
      
      // Get auth instance
      auth = getAuth(firebaseApp);
      
      // Now, enable persistence
      if (!persistenceEnabled) {
        enableIndexedDbPersistence(firestore)
          .then(() => {
            persistenceEnabled = true;
            console.log("Firebase persistence enabled.");
          })
          .catch((error: any) => {
              if (error.code === 'failed-precondition') {
                  // Multiple tabs open, persistence can only be enabled in one.
                  // This is a normal scenario.
              } else if (error.code === 'unimplemented') {
                  // The current browser does not support all of the
                  // features required to enable persistence
              }
              console.warn("Firebase persistence failed to enable:", error.message);
          });
      }
    } else {
      // If the app is already initialized, just get the instances.
      // Persistence should have been handled in the initial setup.
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    }
  }

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
