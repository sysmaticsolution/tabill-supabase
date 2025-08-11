
import Logo from '@/components/logo';
import Link from 'next/link';
import React from 'react';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/50 bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
            <Logo />
        </Link>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
