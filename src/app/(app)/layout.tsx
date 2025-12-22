'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, Shrub, Bell, BookOpen, LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Link from 'next/link';
import Logo from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Chatbot } from '@/components/chatbot';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crop-scanner', label: 'Crop Scanner', icon: Shrub },
  { href: '/guide', label: 'Growth Guide', icon: BookOpen },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background/0">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
      <div className={`relative min-h-screen w-full ${isCollapsed ? 'md:pl-16' : 'md:pl-64'} transition-all duration-300 ease-in-out`}>
      <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <Card className="glass-card h-full rounded-none md:rounded-r-2xl flex flex-col !bg-card/5">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
              <Logo />
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsCollapsed(!isCollapsed)}>
               <PanelLeft />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-2 overflow-y-auto">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-primary/20 ${pathname.startsWith(item.href) ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                >
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
            </nav>
          </CardContent>
          <CardFooter className="p-2 border-t border-border/20">
             <Button variant="ghost" className="w-full justify-start gap-3" onClick={signOut}>
                <LogOut className="h-5 w-5" />
                 {!isCollapsed && <span>Logout</span>}
             </Button>
          </CardFooter>
        </Card>
      </div>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/5 px-4 backdrop-blur-lg sm:px-6">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsCollapsed(!isCollapsed)}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex-1" />
        <UserNav />
      </header>
      <main className="flex-1 p-4 md:p-6 relative z-10">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}
