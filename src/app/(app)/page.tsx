'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';

export default function AppPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/dashboard');
            } else {
                router.replace('/auth');
            }
        }
    }, [user, loading, router]);

    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
