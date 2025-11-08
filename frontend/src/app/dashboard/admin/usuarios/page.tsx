"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsuariosRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/usuarios');
  }, [router]);
  return (
    <main className="p-6">
      <p className="text-gray-600">Redirigiendo a gestión de usuarios…</p>
    </main>
  );
}
