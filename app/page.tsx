'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  // Return empty div or loading state while redirect happens
  return <div className="min-h-screen bg-gray-100" />;
}
