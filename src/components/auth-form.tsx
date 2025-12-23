'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth.tsx';
import { Chrome, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [direction, setDirection] = useState(0);
  const { signInWithGoogle } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });
  
  const handleToggle = () => {
    setDirection(isLogin ? 1 : -1);
    setIsLogin(!isLogin);
  };
  
  const onLogin = (data: LoginFormValues) => {
    console.log('Login with email/password is not implemented in this demo.');
    signInWithGoogle(); // Default to Google sign-in for simplicity
  };

  const onSignup = (data: SignupFormValues) => {
    console.log('Sign up with email/password is not implemented in this demo.');
    signInWithGoogle(); // Default to Google sign-in for simplicity
  };
  
  return (
    <div className="w-full max-w-md mx-auto glass-card overflow-hidden">
      <div className="p-8 pt-16 relative h-[550px]">
        <Link href="/" className="absolute top-6 left-6 flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <AnimatePresence initial={false} custom={direction}>
          {isLogin ? (
            <motion.div
              key="login"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.5 }}
              className="absolute w-full top-20 left-0 px-8"
            >
              <h2 className="text-2xl font-bold font-headline text-center mb-2">Welcome Back</h2>
              <p className="text-center text-muted-foreground mb-6">Sign in to continue to AgroLens AI.</p>
              
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" {...loginForm.register('email')} />
                  {loginForm.formState.errors.email && <p className="text-red-500 text-sm">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" {...loginForm.register('password')} />
                  {loginForm.formState.errors.password && <p className="text-red-500 text-sm">{loginForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full">Sign In</Button>
              </form>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" onClick={signInWithGoogle}><Chrome className="mr-2 h-4 w-4" /> Google</Button>
              
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button onClick={handleToggle} className="font-semibold text-primary hover:underline">
                  Sign up
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.5 }}
              className="absolute w-full top-20 left-0 px-8"
            >
              <h2 className="text-2xl font-bold font-headline text-center mb-2">Create an Account</h2>
              <p className="text-center text-muted-foreground mb-6">Start your journey with AgroLens AI.</p>
              
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input id="signup-name" type="text" placeholder="Your Name" {...signupForm.register('name')} />
                  {signupForm.formState.errors.name && <p className="text-red-500 text-sm">{signupForm.formState.errors.name.message}</p>}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" {...signupForm.register('email')} />
                   {signupForm.formState.errors.email && <p className="text-red-500 text-sm">{signupForm.formState.errors.email.message}</p>}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="••••••••" {...signupForm.register('password')} />
                   {signupForm.formState.errors.password && <p className="text-red-500 text-sm">{signupForm.formState.errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full">Sign Up</Button>
              </form>
              
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button onClick={handleToggle} className="font-semibold text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
