"use client";
import { useState } from 'react';
import { apiFetch, setToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correoError, setCorreoError] = useState<string | null>(null);
  const [contrasenaError, setContrasenaError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const validate = () => {
    let valid = true;
    // Basic email pattern validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo) {
      setCorreoError('El correo es requerido');
      valid = false;
    } else if (!emailRegex.test(correo)) {
      setCorreoError('Formato de correo inválido');
      valid = false;
    } else {
      setCorreoError(null);
    }
    if (!contrasena) {
      setContrasenaError('La contraseña es requerida');
      valid = false;
    } else {
      setContrasenaError(null);
    }
    return valid;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (!validate()) return;
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
      toast.error(err?.message || 'No pudimos iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  }

  const isValid = correo && contrasena && !correoError && !contrasenaError;

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
      </div>
      <Card className="w-full max-w-md relative">
        <div className="px-6 pt-6">
          <div className="mb-1 text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-medium">Acceso</div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Ingresa tus credenciales para continuar.</p>
        </div>
        <div className="p-6">
          {error && <p className="text-red-600 mb-2" role="alert">{error}</p>}
          <form
            className="grid gap-3"
            onSubmit={onSubmit}
            noValidate
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setError(null);
                setCorreoError(null);
                setContrasenaError(null);
                setSubmitted(false);
              }
            }}
          >
            <div className="relative">
              <Input
                placeholder="Correo"
                type="email"
                value={correo}
                onChange={(e) => {
                  setCorreo(e.target.value);
                  if (submitted) validate();
                }}
                autoFocus
                aria-invalid={!!correoError}
                aria-describedby={correoError ? 'correo-error' : undefined}
                className="pr-10"
              />
              {loading && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-gray-600" />
                </div>
              )}
            </div>
            {correoError && (
              <p id="correo-error" className="text-xs text-red-600 -mt-2">{correoError}</p>
            )}
            <div className="relative">
              <Input
                placeholder="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  if (submitted) validate();
                }}
                aria-invalid={!!contrasenaError}
                aria-describedby={contrasenaError ? 'contrasena-error' : undefined}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {contrasenaError && (
              <p id="contrasena-error" className="text-xs text-red-600 -mt-2">{contrasenaError}</p>
            )}
            <Button type="submit" loading={loading} disabled={loading || !isValid} className="w-full">Entrar</Button>
          </form>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <p>Admin de prueba: <span className="font-mono">admin@clinica.com / admin123</span></p>
          </div>
        </div>
      </Card>
    </main>
  );
}
