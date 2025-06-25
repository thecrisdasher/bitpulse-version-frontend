import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface TwoFactorStatus {
  enabled: boolean;
  configured: boolean;
}

export default function TwoFactorSettings() {
  const { user } = useAuth();
  const [step, setStep] = useState<'initial' | 'verify' | 'done' | 'disable'>('initial');
  const [otpauthUrl, setOtpauthUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus>({
    enabled: false,
    configured: false
  });

  // Verificar estado del 2FA al montar el componente
  useEffect(() => {
    checkTwoFactorStatus();
  }, [user]);

  const checkTwoFactorStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTwoFactorStatus({
            enabled: data.data.twoFactorEnabled || false,
            configured: !!data.data.twoFactorSecret
          });
          
          if (data.data.twoFactorEnabled) {
            setStep('done');
          }
        }
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
        credentials: 'include'
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
    } catch (error) {
      console.error('Error setting up 2FA:', error);
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
        body: JSON.stringify({ token, password }),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        toast.success('2FA activado exitosamente');
        setStep('done');
        setTwoFactorStatus({ enabled: true, configured: true });
        // Limpiar campos
        setToken('');
        setPassword('');
      } else {
        toast.error(json.message || 'Código inválido o contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast.error('Error al verificar código 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = () => {
    setStep('disable');
    setToken('');
    setPassword('');
  };

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        toast.success('2FA desactivado exitosamente');
        setStep('initial');
        setTwoFactorStatus({ enabled: false, configured: false });
        setToken('');
        setPassword('');
      } else {
        toast.error(json.message || 'Error al desactivar 2FA');
      }
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error('Error al desactivar 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (twoFactorStatus.enabled) {
      setStep('done');
    } else {
      setStep('initial');
    }
    setToken('');
    setPassword('');
    setQrCodeDataUrl('');
    setOtpauthUrl('');
  };

  return (
    <div className="space-y-4">
      {/* Estado actual del 2FA */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">Estado actual:</span>
        {twoFactorStatus.enabled ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activado
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Desactivado
          </Badge>
        )}
      </div>

      {step === 'initial' && !twoFactorStatus.enabled && (
        <div className="space-y-3">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              La autenticación de dos factores agrega una capa extra de seguridad a tu cuenta.
              Necesitarás una aplicación de autenticación como Google Authenticator o Authy.
            </AlertDescription>
          </Alert>
          <Button onClick={handleSetup} disabled={loading} className="w-full">
            {loading ? 'Configurando...' : 'Activar 2FA'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Escanea el código QR con tu aplicación de autenticación y luego ingresa el código de 6 dígitos.
            </AlertDescription>
          </Alert>
          
          {qrCodeDataUrl && (
            <div className="text-center">
              <img src={qrCodeDataUrl} alt="QR Code 2FA" className="mx-auto mb-4 max-w-48 border rounded" />
              <p className="text-sm text-muted-foreground">Escanea este código QR con tu aplicación de autenticación</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password2fa">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="password2fa"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token2fa">Código de autenticación</Label>
            <Input
              id="token2fa"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading || !token || !password} className="flex-1">
              {loading ? 'Verificando...' : 'Verificar y Activar'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {step === 'done' && twoFactorStatus.enabled && (
        <div className="space-y-3">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              La autenticación de dos factores está activa. Tu cuenta está protegida con una capa adicional de seguridad.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleDisable} className="w-full">
            Desactivar 2FA
          </Button>
        </div>
      )}

      {step === 'disable' && (
        <form onSubmit={handleConfirmDisable} className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ¿Estás seguro de que quieres desactivar la autenticación de dos factores? 
              Esto reducirá la seguridad de tu cuenta.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="passwordDisable">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="passwordDisable"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tokenDisable">Código de autenticación</Label>
            <Input
              id="tokenDisable"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button variant="destructive" type="submit" disabled={loading || !token || !password} className="flex-1">
              {loading ? 'Desactivando...' : 'Confirmar desactivación'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 