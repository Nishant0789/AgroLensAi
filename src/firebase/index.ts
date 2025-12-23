'use client';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
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
  useFirestore,
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
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = getApp();
    }
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);

    if (!persistenceEnabled) {
        try {
          enableIndexedDbPersistence(firestore);
          persistenceEnabled = true;
        } catch (error: any) {
          if (error.code == 'failed-precondition') {
            // This can happen if multiple tabs are open.
            // Persistence will be enabled in one tab, and will fail in others.
            // This is a normal scenario.
          } else if (error.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable persistence
          }
        }
    }

  }
  // On the server, we'll return undefined and let the client-side provider handle it.
  // This is a temporary state until the client hydrates.
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
  useFirestore,
  useAuth,
};
