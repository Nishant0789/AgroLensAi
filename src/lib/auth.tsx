'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useFirebaseAuth, useFirestore, useUser as useFirebaseUser } from '@/firebase';
import { GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  firestore: any; // Note: In a real app, you might want a more specific type
  currentCrop?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseUser();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const handleUser = async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const userDocRef = doc(firestore, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);

        let userData = {};
        if (!userDoc.exists()) {
          const newUserPayload = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            createdAt: serverTimestamp(),
            currentCrop: 'Wheat' // Default crop
          };
          await setDoc(userDocRef, newUserPayload, { merge: true });
          userData = newUserPayload;
        } else {
          userData = userDoc.data();
        }
        
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
          firestore: firestore,
          ...userData,
        });

      } else {
        setUser(null);
      }
      setLoading(false);
    };
    
    if (!firebaseLoading) {
        handleUser(firebaseUser);
    }
  }, [firebaseUser, firebaseLoading, firestore, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithRedirect(auth, provider);
      // The user will be redirected to the Google sign-in page.
      // The onAuthStateChanged listener will handle the user state upon return.
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/auth');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = { user, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
