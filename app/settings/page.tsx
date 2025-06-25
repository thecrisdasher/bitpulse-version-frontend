"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Bell, 
  Shield, 
  DollarSign,
  Target,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Check,
  BarChart3,
  Settings2,
  Users,
  Coins,
  CreditCard,
  Clock,
  Calendar
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import TwoFactorSettings from '@/components/auth/TwoFactorSettings';
import WithdrawalForm from '@/components/withdrawal/WithdrawalForm';

// Tipos para las configuraciones
interface UserSettings {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
}



interface NotificationSettings {
  emailNotifications: boolean;
  withdrawalAlerts: boolean;
  pejeCoinUpdates: boolean;
  mentorMessages: boolean;
  adminUpdates: boolean;
}

interface RecentNotification {
  id: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

// Interfaz para la pantalla de asignación de pejecoins
interface AdminCoinAssignment {
  userId: string;
  amount: number;
  concept: string;
}

// Tipo para usuario listado
interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  pejecoins: number;
}

interface ProfileChange {
  id: string;
  field: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  ipAddress: string | null;
}

// Interfaces para cambio de contraseña
interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  match: boolean;
}

const SettingsPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { user, hasRole, logout } = useAuth();
  const isAdmin = hasRole('admin');

  // Mock users para pruebas
  const [usersList, setUsersList] = useState<UserListItem[]>([
    { id: '1', name: 'Usuario Test 1', email: 'user1@test.com', role: 'cliente', pejecoins: 1200 },
    { id: '2', name: 'Usuario Test 2', email: 'user2@test.com', role: 'cliente', pejecoins: 500 },
    { id: '3', name: 'Usuario Test 3', email: 'user3@test.com', role: 'maestro', pejecoins: 3000 },
  ]);

  // Estado para asignación de pejecoins
  const [coinAssignment, setCoinAssignment] = useState<AdminCoinAssignment>({
    userId: '',
    amount: 100,
    concept: 'Asignación de pejecoins'
  });

  const [isAssigning, setIsAssigning] = useState(false);

  // Estados para las diferentes configuraciones
  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    phone: '',
    bio: '',
  });



  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    withdrawalAlerts: true,
    pejeCoinUpdates: true,
    mentorMessages: true,
    adminUpdates: true,
  });

  // Estado para notificaciones recientes
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: true,
    biometricAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
    suspiciousActivityAlerts: true
  });

  // Estado para retiros
  const [userBalance, setUserBalance] = useState<number>(0);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);

  // Estado para historial de cambios
  const [profileHistory, setProfileHistory] = useState<ProfileChange[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Estado para cambio de contraseña
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Validaciones de contraseña
  const passwordValidations: PasswordValidation = {
    length: passwordForm.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.newPassword),
    lowercase: /[a-z]/.test(passwordForm.newPassword),
    number: /\d/.test(passwordForm.newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword),
    match: passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword !== ''
  };

  const isPasswordValid = Object.values(passwordValidations).every(Boolean) && passwordForm.currentPassword !== '';

  // Cargar datos del usuario actual cuando esté disponible
  useEffect(() => {
    if (user) {
      setUserSettings(prev => ({
        ...prev,
        displayName: `${user.firstName} ${user.lastName}` || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
      }));
      
      // Cargar balance del usuario (pejecoins)
      setUserBalance((user as any).pejecoins || 0);
      loadWithdrawalHistory();
      loadProfileHistory();
      loadRecentNotifications();
    }
  }, [user]);

  // Cargar historial de retiros
  const loadWithdrawalHistory = async () => {
    try {
      const response = await fetch('/api/withdrawal', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setWithdrawalHistory(result.data);
      }
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
    }
  };

  // Cargar historial de cambios del perfil
  const loadProfileHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch('/api/auth/profile/history', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setProfileHistory(result.data);
      }
    } catch (error) {
      console.error('Error loading profile history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Cargar notificaciones recientes
  const loadRecentNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await fetch('/api/notifications/recent', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setRecentNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      }
    } catch (error) {
      console.error('Error loading recent notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/recent', {
        method: 'PATCH',
        credentials: 'include'
      });
      
      if (response.ok) {
        setRecentNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Error al marcar notificaciones como leídas');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Validaciones básicas
      if (!userSettings.displayName.trim()) {
        toast.error('El nombre para mostrar es requerido');
        setIsSaving(false);
        return;
      }

      // Preparar datos para actualizar
      const nameParts = userSettings.displayName.trim().split(' ');
      const firstName = nameParts[0] || user.firstName;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : user.lastName;
      
      const updateData = {
        firstName,
        lastName,
        phone: userSettings.phone,
        bio: userSettings.bio,
      };

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar perfil');
      }

            // Mostrar mensaje de éxito
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
      
      // Recargar historial para mostrar los cambios
      loadProfileHistory();
      
      // Opcional: actualizar contexto de usuario si es necesario
      toast.success('Perfil actualizado correctamente');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const updateUserSetting = (key: keyof UserSettings, value: string) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };



  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSecuritySetting = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const updateCoinAssignment = (key: keyof AdminCoinAssignment, value: any) => {
    setCoinAssignment(prev => ({ ...prev, [key]: value }));
  };

  const handleAssignCoins = async () => {
    try {
      setIsAssigning(true);
      
      // Validar datos
      if (!coinAssignment.userId) {
        toast.error('Por favor selecciona un usuario');
        return;
      }
      
      if (coinAssignment.amount <= 0) {
        toast.error('El monto debe ser positivo');
        return;
      }
      
      // Llamar a la API real
      const response = await fetch('/api/admin/pejecoins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_tokens') ? JSON.parse(localStorage.getItem('auth_tokens')!).accessToken : ''}`
        },
        body: JSON.stringify(coinAssignment)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Asignación de ${coinAssignment.amount} pejecoins exitosa!`);
        
        // Actualizar la lista de usuarios con el nuevo saldo
        setUsersList(prevUsers => 
          prevUsers.map(user => 
            user.id === coinAssignment.userId 
              ? { ...user, pejecoins: user.pejecoins + coinAssignment.amount } 
              : user
          )
        );
        
        // Limpiar el formulario
        setCoinAssignment({
          userId: '',
          amount: 100,
          concept: 'Asignación de pejecoins'
        });
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al asignar pejecoins:', error);
      toast.error('Error al procesar la asignación de pejecoins');
    } finally {
      setIsAssigning(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error('Por favor corrige los errores en la contraseña');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          isFirstTimeChange: false
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Contraseña cambiada exitosamente');
        
        // Limpiar formulario
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Si requiere reautenticación
        if (data.requiresReauth) {
          toast.info('Por seguridad, debes iniciar sesión nuevamente');
          setTimeout(async () => {
            await logout();
            window.location.href = '/auth?message=password_changed_successfully';
          }, 2000);
        }
      } else {
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error de conexión. Intenta nuevamente.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const updatePasswordForm = (key: keyof PasswordChangeForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [key]: value }));
  };
  
  // Determinar las pestañas disponibles según el rol
  const tabItems = [
    <TabsTrigger key="profile" value="profile" className="flex items-center gap-2">
      <User className="h-4 w-4" />
      Perfil
    </TabsTrigger>,
    <TabsTrigger key="notifications" value="notifications" className="flex items-center gap-2">
      <Bell className="h-4 w-4" />
      Notificaciones
    </TabsTrigger>,
    <TabsTrigger key="security" value="security" className="flex items-center gap-2">
      <Shield className="h-4 w-4" />
      Seguridad
    </TabsTrigger>,
    <TabsTrigger key="withdrawal" value="withdrawal" className="flex items-center gap-2">
      <CreditCard className="h-4 w-4" />
      Retiro
    </TabsTrigger>
  ];
  
  // Solo mostrar la pestaña de administración para usuarios admin
  if (isAdmin) {
    tabItems.push(
      <TabsTrigger key="admin" value="admin" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Administración
      </TabsTrigger>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configuración</h1>
        <p className="text-muted-foreground">
          Personaliza tu experiencia de trading y gestiona tus preferencias
        </p>
      </div>

      {savedMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Configuración guardada correctamente
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabItems.length}, minmax(0, 1fr))` }}>
          {tabItems}
        </TabsList>
        
        {/* Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre para mostrar</Label>
                  <Input
                    id="displayName"
                    value={userSettings.displayName}
                    onChange={(e) => updateUserSetting('displayName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userSettings.email}
                    readOnly
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    El correo electrónico no puede editarse desde aquí
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={userSettings.phone}
                    onChange={(e) => updateUserSetting('phone', e.target.value)}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={userSettings.bio}
                  onChange={(e) => updateUserSetting('bio', e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Historial de Cambios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Cargando historial...</span>
                </div>
              ) : profileHistory.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Últimas modificaciones realizadas en tu perfil
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Campo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Valor Anterior</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Valor Nuevo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {profileHistory.slice(0, 10).map((change) => (
                          <tr key={change.id} className="hover:bg-muted/50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="font-medium">
                                {change.fieldName}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate">
                              <span className="text-muted-foreground">
                                {change.oldValue || <em className="text-xs">Sin valor</em>}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-xs truncate">
                              <span className="font-medium">
                                {change.newValue || <em className="text-xs">Sin valor</em>}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(change.changedAt).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </div>
                  {profileHistory.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Mostrando los últimos 10 cambios de {profileHistory.length} total
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay cambios registrados aún
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los cambios que realices en tu perfil aparecerán aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          {/* Notificaciones Recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones Recientes
                </div>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="rounded-full">
                      {unreadCount} sin leer
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={markAllAsRead}
                    >
                      Marcar todas como leídas
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-muted-foreground">Cargando notificaciones...</span>
                  </div>
              ) : recentNotifications.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Últimas alertas y actualizaciones de tu cuenta
                  </p>
                  <div className="space-y-3">
                    {recentNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                          !notification.isRead ? 'bg-primary/5 border-primary/20' : 'bg-background'
                        }`}
                        onClick={() => {
                          // Aquí podrías navegar al link si fuera necesario
                          window.location.href = notification.link;
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-primary rounded-full"></div>
                              )}
                  </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.body}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                </div>
              </div>
                    </div>
                      </div>
                    ))}
                  </div>
                  {recentNotifications.length >= 20 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Mostrando las últimas 20 notificaciones
                    </p>
                    )}
                  </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No tienes notificaciones aún
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aquí aparecerán las actualizaciones de tu cuenta
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferencias de Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Preferencias de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Canales de notificación</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <div>
                      <Label htmlFor="emailNotifications">Notificaciones por email</Label>
                        <p className="text-sm text-muted-foreground">Recibe notificaciones en tu correo electrónico</p>
                      </div>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de notificaciones</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <div>
                        <Label htmlFor="withdrawalAlerts">Alertas de retiros</Label>
                        <p className="text-sm text-muted-foreground">Notificaciones sobre tus solicitudes de retiro</p>
                    </div>
                    </div>
                      <Switch
                      id="withdrawalAlerts"
                      checked={notificationSettings.withdrawalAlerts}
                      onCheckedChange={(checked) => updateNotificationSetting('withdrawalAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <div>
                        <Label htmlFor="pejeCoinUpdates">Actualizaciones de saldo</Label>
                        <p className="text-sm text-muted-foreground">Notificaciones cuando se actualice tu saldo</p>
                    </div>
                  </div>
                      <Switch
                      id="pejeCoinUpdates"
                      checked={notificationSettings.pejeCoinUpdates}
                      onCheckedChange={(checked) => updateNotificationSetting('pejeCoinUpdates', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                      <Label htmlFor="mentorMessages">Mensajes de mentores</Label>
                        <p className="text-sm text-muted-foreground">Notificaciones de mensajes de tus mentores</p>
                      </div>
                    </div>
                      <Switch
                        id="mentorMessages"
                        checked={notificationSettings.mentorMessages}
                        onCheckedChange={(checked) => updateNotificationSetting('mentorMessages', checked)}
                      />
                    </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <Label htmlFor="adminUpdates">Notificaciones administrativas</Label>
                        <p className="text-sm text-muted-foreground">Actualizaciones importantes del sistema</p>
                      </div>
                    </div>
                    <Switch
                      id="adminUpdates"
                      checked={notificationSettings.adminUpdates}
                      onCheckedChange={(checked) => updateNotificationSetting('adminUpdates', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  La seguridad de tu cuenta es nuestra prioridad. Recomendamos activar todas las medidas de seguridad disponibles.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Autenticación</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Autenticación de dos factores (2FA)</Label>
                    <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
                    <TwoFactorSettings />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="biometricAuth">Autenticación biométrica</Label>
                      <p className="text-sm text-muted-foreground">Usa huella dactilar o Face ID</p>
                    </div>
                    <Switch
                      id="biometricAuth"
                      checked={securitySettings.biometricAuth}
                      onCheckedChange={(checked) => updateSecuritySetting('biometricAuth', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sesiones y actividad</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tiempo de sesión (minutos)</Label>
                    <Select 
                      value={securitySettings.sessionTimeout.toString()} 
                      onValueChange={(value) => updateSecuritySetting('sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                        <SelectItem value="120">2 horas</SelectItem>
                        <SelectItem value="0">Sin límite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="loginNotifications">Notificar inicios de sesión</Label>
                      <p className="text-sm text-muted-foreground">Recibe alertas cuando alguien acceda a tu cuenta</p>
                    </div>
                    <Switch
                      id="loginNotifications"
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => updateSecuritySetting('loginNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="suspiciousActivityAlerts">Alertas de actividad sospechosa</Label>
                      <p className="text-sm text-muted-foreground">Detecta accesos no autorizados</p>
                    </div>
                    <Switch
                      id="suspiciousActivityAlerts"
                      checked={securitySettings.suspiciousActivityAlerts}
                      onCheckedChange={(checked) => updateSecuritySetting('suspiciousActivityAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cambiar contraseña</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                          value={passwordForm.currentPassword}
                          onChange={(e) => updatePasswordForm('currentPassword', e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                          required
                          disabled={isChangingPassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                    
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                      <div className="relative">
                    <Input
                      id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => updatePasswordForm('newPassword', e.target.value)}
                          placeholder="Crea una nueva contraseña segura"
                          required
                          disabled={isChangingPassword}
                        />
                  <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                  </Button>
                    </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => updatePasswordForm('confirmPassword', e.target.value)}
                          placeholder="Confirma tu nueva contraseña"
                          required
                          disabled={isChangingPassword}
                        />
                  <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                  </Button>
                      </div>
                </div>
              </div>

                  {/* Validaciones visuales */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Requisitos de la contraseña:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <div className={`flex items-center gap-2 ${passwordValidations.length ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidations.length ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span>Mínimo 8 caracteres</span>
                  </div>
                        <div className={`flex items-center gap-2 ${passwordValidations.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidations.uppercase ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span>Al menos una mayúscula</span>
                    </div>
                        <div className={`flex items-center gap-2 ${passwordValidations.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidations.lowercase ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span>Al menos una minúscula</span>
                  </div>
                        <div className={`flex items-center gap-2 ${passwordValidations.number ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidations.number ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span>Al menos un número</span>
                    </div>
                        <div className={`flex items-center gap-2 ${passwordValidations.special ? 'text-green-600' : 'text-red-600'}`}>
                          {passwordValidations.special ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          <span>Al menos un símbolo especial</span>
                  </div>
                        {passwordForm.confirmPassword && (
                          <div className={`flex items-center gap-2 ${passwordValidations.match ? 'text-green-600' : 'text-red-600'}`}>
                            {passwordValidations.match ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            <span>Las contraseñas coinciden</span>
                </div>
                        )}
              </div>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    variant="outline" 
                    className="w-full"
                    disabled={!isPasswordValid || isChangingPassword}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isChangingPassword ? 'Cambiando contraseña...' : 'Cambiar contraseña'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Retiro */}
        <TabsContent value="withdrawal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Retiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showWithdrawalForm ? (
                <div className="space-y-6">
                  {/* Balance y botón principal */}
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Saldo Disponible</h3>
                      <p className="text-3xl font-bold text-green-600">
                        ${userBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button 
                      size="lg" 
                      onClick={() => setShowWithdrawalForm(true)}
                      className="min-w-48"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Solicitar Retiro
                    </Button>
                  </div>

                  {/* Historial de retiros */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Historial de Retiros</h4>
                    {withdrawalHistory.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Fecha</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Monto</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-border">
                            {withdrawalHistory.map((withdrawal: any) => (
                              <tr key={withdrawal.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {new Date(withdrawal.requestedAt).toLocaleDateString('es-CO')}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Badge variant="outline">
                                    {withdrawal.type === 'bank_account' ? 'Banco' : 'Cripto'}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-right font-mono">
                                  ${withdrawal.amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <Badge 
                                    variant={
                                      withdrawal.status === 'approved' ? 'default' :
                                      withdrawal.status === 'processed' ? 'secondary' :
                                      withdrawal.status === 'rejected' ? 'destructive' : 'outline'
                                    }
                                  >
                                    {withdrawal.status === 'pending' ? 'Pendiente' :
                                     withdrawal.status === 'approved' ? 'Aprobado' :
                                     withdrawal.status === 'processed' ? 'Procesado' : 'Rechazado'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No tienes solicitudes de retiro aún
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <WithdrawalForm
                    userBalance={userBalance}
                    onSuccess={async () => {
                      setShowWithdrawalForm(false);
                      loadWithdrawalHistory();
                      
                      // Refrescar el saldo del usuario desde el servidor
                      try {
                        const response = await fetch('/api/auth/profile', { 
                          credentials: 'include' 
                        });
                        const result = await response.json();
                        if (result.success && result.data) {
                          setUserBalance(result.data.pejecoins || 0);
                        }
                      } catch (error) {
                        console.error('Error refreshing user balance:', error);
                      }
                    }}
                    onCancel={() => setShowWithdrawalForm(false)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de administración */}
        {isAdmin && (
          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Asignación de PejeCoins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId">Usuario</Label>
                      <Select 
                        value={coinAssignment.userId} 
                        onValueChange={(value) => updateCoinAssignment('userId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {usersList.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email}) - {user.pejecoins} pejecoins
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount">Cantidad de PejeCoins</Label>
                      <div className="flex items-center">
                        <Input
                          id="amount"
                          type="number"
                          value={coinAssignment.amount}
                          onChange={(e) => updateCoinAssignment('amount', parseFloat(e.target.value))}
                          className="flex-1"
                          min="1"
                        />
                        <DollarSign className="ml-2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="concept">Concepto</Label>
                      <Textarea
                        id="concept"
                        value={coinAssignment.concept}
                        onChange={(e) => updateCoinAssignment('concept', e.target.value)}
                        placeholder="Motivo de la asignación"
                        className="resize-none"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleAssignCoins}
                      className="w-full"
                      disabled={isAssigning || !coinAssignment.userId || coinAssignment.amount <= 0}
                    >
                      {isAssigning ? "Asignando..." : "Asignar PejeCoins"}
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Usuarios Recientes</h3>
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">PejeCoins</th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {usersList.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'maestro' ? 'outline' : 'default'}>
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                                {user.pejecoins.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Botón de guardar */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="min-w-32" disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage; 