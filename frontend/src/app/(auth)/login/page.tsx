"use client";
import { useState } from 'react';
import { apiFetch, setToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ access_token: string }>(`/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ correo, contraseña: contrasena }),
      });
      setToken(data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-950">
      <Card className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Iniciar sesión</h1>
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <form className="grid gap-3" onSubmit={onSubmit}>
          <Input
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
          <Input
            placeholder="Contraseña"
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <Button type="submit" loading={loading}>Entrar</Button>
        </form>
      </Card>
    </main>
  );
}
