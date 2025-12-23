'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Shrub, Bell, BookOpen, LogOut, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Logo from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Chatbot } from '@/components/chatbot';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { LocationProvider } from '@/lib/location';
import { useCollection, useUser, useFirestore } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crop-scanner', label: 'Crop Scanner', icon: Shrub },
  { href: '/guide', label: 'Growth Guide', icon: BookOpen },
  { href: '/alerts', label: 'Alerts', icon: Bell },
];

function UnreadAlertsBadge() {
  const { user } = useUser();
  const firestore = useFirestore();
  const notificationsQuery = user ? query(
    collection(firestore, `users/${user.uid}/notifications`),
    where('read', '==', false),
    limit(10)
  ) : null;
  const { data: unreadNotifications } = useCollection(notificationsQuery);
  
  if (!unreadNotifications || unreadNotifications.length === 0) {
    return null;
  }

  return (
    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-1 bg-destructive text-destructive-foreground">
      {unreadNotifications.length}
    </Badge>
  );
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [user, userLoading, router]);

  if (userLoading || !user || !firestore) {
    return (
      <div className="flex h-screen items-center justify-center bg-background/0">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // The signOut function can be defined here or imported from a context if needed elsewhere.
  const signOut = async () => {
    try {
      // Assuming you have access to the auth instance
      const { getAuth } = await import('firebase/auth');
      const { firebaseApp } = await import('@/firebase').then(m => m.initializeFirebase());
      await getAuth(firebaseApp).signOut();
      router.push('/auth');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
      <LocationProvider user={{...user, firestore: firestore}}>
        <TooltipProvider>
          <div className="relative min-h-screen w-full md:grid md:grid-cols-[auto_1fr]">
            <aside className={`relative z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
                <Card className="glass-card h-full rounded-none md:rounded-r-2xl flex flex-col !bg-card/5">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
                            <Logo />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-2 overflow-y-auto">
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) => (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-primary/20 ${pathname.startsWith(item.href) ? 'bg-primary/20 text-primary' : 'text-muted-foreground'} ${isCollapsed ? 'justify-center' : ''}`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                                        {item.href === '/alerts' && user && <UnreadAlertsBadge />}
                                    </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right" className="flex items-center gap-4">
                                        {item.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ))}
                        </nav>
                    </CardContent>
                    <CardFooter className="p-2 border-t border-border/20">
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" className={`w-full gap-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`} onClick={signOut}>
                                  <LogOut className="h-5 w-5" />
                                  {!isCollapsed && <span>Logout</span>}
                              </Button>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="flex items-center gap-4">
                              Logout
                            </TooltipContent>
                          )}
                        </Tooltip>
                    </CardFooter>
                </Card>
            </aside>

            <div className="flex flex-col flex-1">
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/5 px-4 backdrop-blur-lg sm:px-6">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                  <h1 className="text-xl font-semibold hidden md:block">
                    Welcome back, {user?.displayName?.split(' ')[0] || 'Farmer'}!
                  </h1>
                </div>
                <div className="flex-1" />
                <UserNav />
              </header>
              <main className="flex-1 p-4 md:p-6 relative z-10">
                {children}
              </main>
            </div>
            <Chatbot />
          </div>
        </TooltipProvider>
      </LocationProvider>
  );
}
