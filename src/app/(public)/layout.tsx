import { Waves } from '@/components/waves';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <Waves strokeColor="hsl(0 0% 50% / 0.2)" />
      {children}
    </div>
  );
}
