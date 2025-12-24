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
      firebaseApp = initializeApp(firebaseConfig);
      auth = getAuth(firebaseApp);
      firestore = initializeFirestore(firebaseApp, {});
      
      if (!persistenceEnabled) {
        try {
            enableIndexedDbPersistence(firestore)
              .then(() => {
                persistenceEnabled = true;
              })
              .catch((error: any) => {
                  if (error.code !== 'failed-precondition') {
                      console.error("Firebase persistence error:", error);
                  }
              });
        } catch (error: any) {
            console.error("Error enabling persistence:", error);
        }
      }

    } else {
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
      
      if (!persistenceEnabled) {
          try {
              enableIndexedDbPersistence(firestore)
                .then(() => {
                  persistenceEnabled = true;
                })
                .catch((error: any) => {
                    if (error.code !== 'failed-precondition') {
                        console.error("Firebase persistence error:", error);
                    }
                });
          } catch (error: any) {
             console.error("Error enabling persistence:", error);
          }
      }
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
