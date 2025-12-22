'use client';

import { usePathname } from 'next/navigation';
import AppLayout from './(app)/layout';
import PublicLayout from './(public)/layout';
import { Waves } from '@/components/waves';

export function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAppRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/crop-scanner') ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/alerts');

  return (
    <>
      <Waves />
      {isAppRoute ? (
        <AppLayout>{children}</AppLayout>
      ) : (
        <PublicLayout>{children}</PublicLayout>
      )}
    </>
  );
}
