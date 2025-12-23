'use client';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';
import { ReactNode } from 'react';

// This is a client-side only provider that ensures Firebase is initialized only once.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = initializeFirebase();
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      firestore={firestore}
      auth={auth}
    >
      {children}
    </FirebaseProvider>
  );
}
