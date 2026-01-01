import { Waves } from '@/components/waves';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <Waves />
      {children}
    </div>
  );
}
