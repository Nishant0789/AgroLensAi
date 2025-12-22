import { cn } from '@/lib/utils';
import Link from 'next/link';

const Logo = ({ className }: { className?: string }) => (
  <Link href="/" className={cn("flex items-center gap-2 text-xl font-bold font-headline text-primary", className)}>
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 15.5V18C12 18 14 16.5 14.5 14.5" fill="currentColor" />
      <path d="M12 15.5C10.5 15.5 9.5 14 9.5 12.5C9.5 11 10.5 9.5 12 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

    </svg>
    <span className="hidden sm:inline-block">AgroLens AI</span>
  </Link>
);

export default Logo;
