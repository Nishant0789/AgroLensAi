'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import Logo from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AuthProvider, useAuth } from '@/lib/auth';

const authBgImage = PlaceHolderImages.find((img) => img.id === 'auth-background');

function AuthPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
     return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {authBgImage && (
        <Image
          src={authBgImage.imageUrl}
          alt={authBgImage.description}
          fill
          className="object-cover"
          data-ai-hint={authBgImage.imageHint}
        />
      )}
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


export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  );
}
