import Image from 'next/image';
import AuthForm from '@/components/auth-form';
import Logo from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AuthProvider } from '@/lib/auth';

const authBgImage = PlaceHolderImages.find((img) => img.id === 'auth-background');

export default function AuthPage() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
