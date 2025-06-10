"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Login con 2FA exitoso');
        router.push('/');
      } else {
        toast.error(json.message || 'Código inválido o contraseña incorrecta');
      }
    } catch {
      toast.error('Error en verificación de 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Verificación 2FA</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-center text-sm">Ingresa tu contraseña y el código de autenticación para {email}</p>
            <div className="space-y-1">
              <Label htmlFor="password2fa">Contraseña</Label>
              <Input
                id="password2fa"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="token2fa">Código 2FA</Label>
              <Input
                id="token2fa"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar y Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 