'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useFirebaseAuth, useFirestore } from '@/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string | null;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);

          let fullUser: User;
          if (!userDoc.exists()) {
            const newUserPayload = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newUserPayload, { merge: true });
            fullUser = newUserPayload;
          } else {
            fullUser = { 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber,
              ...userDoc.data(),
            };
          }
          
          setUser(fullUser);

        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null); // Or handle error appropriately
        }

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, this is not an error to be logged.
        setLoading(false);
        return;
      }
      console.error("Error signing in with Google: ", error);
      // This provides more detailed error info in the console on the deployed site
      if (error.code === 'auth/unauthorized-domain') {
        console.error("This domain is not authorized for Firebase Authentication. Please add it to the Firebase Console's list of authorized domains.");
      }
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
    return window.recaptchaVerifier;
  }

  const signInWithPhone = async (phoneNumber: string) => {
    const appVerifier = setupRecaptcha();
    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch(error) {
      console.error("Error sending OTP", error);
      // This will be caught by the form's error handling
      throw new Error("Failed to send OTP. Ensure your phone number is correct and includes a country code (e.g., +1), and that the reCAPTCHA is visible.");
    }
  }

  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) {
      throw new Error("No OTP confirmation result found. Please request an OTP first.");
    }
    try {
      setLoading(true);
      await confirmationResult.confirm(otp);
      // onAuthStateChanged will handle the user state update.
      router.push('/dashboard');
    } catch(error) {
      setLoading(false);
      console.error("Error verifying OTP", error);
      throw new Error("The OTP is invalid. Please check the code and try again.");
    }
  }
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = { user, loading, signInWithGoogle, signInWithPhone, verifyOtp, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
    }
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
