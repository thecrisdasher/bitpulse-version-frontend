import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function TwoFactorSettings() {
  const { user } = useAuth();
  const [step, setStep] = useState<'initial' | 'verify' | 'done'>('initial');
  const [otpauthUrl, setOtpauthUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const json = await res.json();
      if (json.success && json.data.otpauthUrl) {
        setOtpauthUrl(json.data.otpauthUrl);
        const dataUrl = await QRCode.toDataURL(json.data.otpauthUrl);
        setQrCodeDataUrl(dataUrl);
        setStep('verify');
      } else {
        toast.error(json.message || 'Error al generar QR para 2FA');
      }
    } catch {
      toast.error('Error al configurar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const json = await res.json();
      if (json.success) {
        toast.success('2FA activado exitosamente');
        setStep('done');
      } else {
        toast.error(json.message || 'Código inválido o contraseña incorrecta');
      }
    } catch {
      toast.error('Error al verificar código 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('initial');
    setToken('');
    setPassword('');
    setQrCodeDataUrl('');
    setOtpauthUrl('');
  };

  return (
    <div className="space-y-4">
      {step === 'initial' && (
        <Button onClick={handleSetup} disabled={loading}>
          Activar 2FA
        </Button>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          {qrCodeDataUrl && (
            <img src={qrCodeDataUrl} alt="QR Code 2FA" className="mx-auto mb-4 max-w-xs" />
          )}
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
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading}>
              Verificar y Activar
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <p className="text-green-600">La autenticación de dos factores está activada.</p>
      )}
    </div>
  );
} 