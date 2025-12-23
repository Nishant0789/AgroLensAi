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
import { Chrome, ArrowLeft, Loader2, Phone, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number with country code (e.g., +1234567890)'),
});
const otpSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

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
  const [view, setView] = useState<'phone' | 'otp'>('phone');
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle, signInWithPhone, verifyOtp } = useAuth();
  
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const handleSendOtp = async (data: PhoneFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
        await signInWithPhone(data.phone);
        setDirection(1);
        setView('otp');
    } catch(err: any) {
        console.error(err);
        setError(err.message || "Failed to send OTP. Please check the number and try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
        await verifyOtp(data.otp);
        // On success, the onAuthStateChanged in AuthProvider will handle the redirect.
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Invalid OTP. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setView('phone');
    setError(null);
  }
  
  return (
    <div className="w-full max-w-md mx-auto glass-card overflow-hidden">
      <div className="p-8 pt-16 relative h-[550px]">
        <Link href="/" className="absolute top-6 left-6 flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        <AnimatePresence initial={false} custom={direction}>
          {view === 'phone' ? (
            <motion.div
              key="phone"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.5 }}
              className="absolute w-full top-24 left-0 px-8"
            >
              <h2 className="text-2xl font-bold font-headline text-center mb-2">Sign In</h2>
              <p className="text-center text-muted-foreground mb-6">Enter your phone number to begin.</p>
              
              <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="phone-input">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone-input" type="tel" placeholder="+1 234 567 890" {...phoneForm.register('phone')} className="pl-10" />
                  </div>
                  {phoneForm.formState.errors.phone && <p className="text-destructive text-sm">{phoneForm.formState.errors.phone.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Send OTP"}
                </Button>
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
              {error && <p className="text-destructive text-center text-sm mt-4">{error}</p>}
              <div id="recaptcha-container"></div>
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.5 }}
              className="absolute w-full top-24 left-0 px-8"
            >
              <button onClick={handleBack} className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to phone number
              </button>
              <h2 className="text-2xl font-bold font-headline text-center mb-2">Verify OTP</h2>
              <p className="text-center text-muted-foreground mb-6">Enter the code sent to your phone.</p>
              
              <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                 <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="otp-input">Verification Code</Label>
                   <div className="relative">
                     <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                     <Input id="otp-input" type="text" placeholder="123456" {...otpForm.register('otp')} className="pl-10" />
                   </div>
                  {otpForm.formState.errors.otp && <p className="text-destructive text-sm">{otpForm.formState.errors.otp.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                   {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Sign In"}
                </Button>
              </form>
              {error && <p className="text-destructive text-center text-sm mt-4">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
