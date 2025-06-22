"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validaciones de contraseña
  const passwordValidations = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword !== ''
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error('Por favor corrige los errores en la contraseña');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          isFirstTimeChange: true
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Contraseña cambiada exitosamente. Redirigiendo al login...');
        
        // Si el servidor requiere reautenticación, la sesión ya fue limpiada
        if (data.requiresReauth) {
          // Limpiar también el estado local
          await logout();
          
          // Redirigir inmediatamente al login
          setTimeout(() => {
            router.push('/auth?message=password_changed_successfully');
          }, 1500);
        } else {
          // Fallback para casos que no requieren reauth
          await logout();
          setTimeout(() => {
            router.push('/auth?message=password_changed_successfully');
          }, 2000);
        }
      } else {
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/auth');
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Cambio de Contraseña Requerido</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hola {user.firstName}, por seguridad debes cambiar tu contraseña temporal en este primer inicio de sesión.
          </p>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Esta es una medida de seguridad. Una vez cambies tu contraseña podrás acceder normalmente a la plataforma.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña temporal"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Crea una nueva contraseña segura"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
              </div>
            </div>

            {/* Validaciones visuales */}
            {newPassword && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Requisitos de la contraseña:</p>
                <div className="grid grid-cols-1 gap-1">
                  <div className={`flex items-center gap-2 ${passwordValidations.length ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidations.length ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidations.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidations.uppercase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Al menos una mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidations.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidations.lowercase ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Al menos una minúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidations.number ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidations.number ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Al menos un número</span>
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidations.special ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordValidations.special ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>Al menos un símbolo especial</span>
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-2 ${passwordValidations.match ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidations.match ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span>Las contraseñas coinciden</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={!isPasswordValid || isLoading}
              >
                {isLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
              >
                Salir y Volver Más Tarde
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 