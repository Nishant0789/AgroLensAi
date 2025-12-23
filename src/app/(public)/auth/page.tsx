'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth-form';
import Logo from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/lib/auth.tsx';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const authBgImage = PlaceHolderImages.find((img) => img.id === 'auth-background');

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

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
      
      <div className="absolute inset-0 bg-background/10" />
      <div className="relative z-10 w-full p-4 space-y-4">
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Logo />
        </div>
        
        {hostname && (
          <Card className="max-w-md mx-auto bg-amber-50 border border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-1" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold">Action Required</p>
                  <p>To enable sign-in, add the following domain to your Firebase project's "Authorized domains" list:</p>
                  <p className="font-mono bg-amber-100 px-2 py-1 rounded-md mt-2 text-center">{hostname}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <AuthForm />
      </div>
    </div>
  );
}
