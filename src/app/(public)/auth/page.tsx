'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import Logo from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/lib/auth';

const authBgImage = PlaceHolderImages.find((img) => img.id === 'auth-background');

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      const returnUrl = searchParams.get('returnTo') || '/dashboard';
      router.push(returnUrl);
    }
  }, [user, loading, router, searchParams]);

  if (loading || user) {
     return (
      <div className="flex h-screen items-center justify-center bg-background/0">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 w-full p-4">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Logo />
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
