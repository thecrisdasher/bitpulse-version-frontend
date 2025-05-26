"use client"

import React, { useState } from 'react';
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
  Palette, 
  Database, 
  Globe, 
  DollarSign,
  Target,
  Volume2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Check,
  TrendingUp,
  BarChart3,
  Settings2
} from "lucide-react";
import { useTheme } from "next-themes";

// Tipos para las configuraciones
interface UserSettings {
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  timezone: string;
  language: string;
  currency: string;
}

interface TradingSettings {
  defaultLeverage: number;
  riskPercentage: number;
  autoStopLoss: boolean;
  stopLossPercentage: number;
  autoTakeProfit: boolean;
  takeProfitPercentage: number;
  tradingMode: 'conservative' | 'moderate' | 'aggressive';
  maxDailyTrades: number;
  confirmOrders: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
  tradingAlerts: boolean;
  marketOpenClose: boolean;
  portfolioUpdates: boolean;
  mentorMessages: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Estados para las diferentes configuraciones
  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: 'Usuario BitPulse',
    email: 'usuario@bitpulse.com',
    phone: '+57 300 123 4567',
    bio: 'Trader apasionado por los mercados financieros',
    timezone: 'America/Bogota',
    language: 'es',
    currency: 'COP'
  });

  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    defaultLeverage: 10,
    riskPercentage: 2,
    autoStopLoss: true,
    stopLossPercentage: 5,
    autoTakeProfit: true,
    takeProfitPercentage: 10,
    tradingMode: 'moderate',
    maxDailyTrades: 20,
    confirmOrders: true
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    priceAlerts: true,
    newsAlerts: true,
    tradingAlerts: true,
    marketOpenClose: false,
    portfolioUpdates: true,
    mentorMessages: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: true,
    biometricAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
    suspiciousActivityAlerts: true
  });

  const handleSave = () => {
    // Simular guardado
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const updateUserSetting = (key: keyof UserSettings, value: string) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTradingSetting = (key: keyof TradingSettings, value: any) => {
    setTradingSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNotificationSetting = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateSecuritySetting = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }));
  };

  const getTradingModeColor = (mode: string) => {
    switch (mode) {
      case 'conservative': return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'moderate': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'aggressive': return 'bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="trading" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trading
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apariencia
          </TabsTrigger>
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
                    onChange={(e) => updateUserSetting('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={userSettings.phone}
                    onChange={(e) => updateUserSetting('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona horaria</Label>
                  <Select value={userSettings.timezone} onValueChange={(value) => updateUserSetting('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokio (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Preferencias Regionales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select value={userSettings.language} onValueChange={(value) => updateUserSetting('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Moneda principal</Label>
                  <Select value={userSettings.currency} onValueChange={(value) => updateUserSetting('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading */}
        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Configuración de Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Apalancamiento por defecto</Label>
                    <Select 
                      value={tradingSettings.defaultLeverage.toString()} 
                      onValueChange={(value) => updateTradingSetting('defaultLeverage', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1:1</SelectItem>
                        <SelectItem value="5">1:5</SelectItem>
                        <SelectItem value="10">1:10</SelectItem>
                        <SelectItem value="20">1:20</SelectItem>
                        <SelectItem value="50">1:50</SelectItem>
                        <SelectItem value="100">1:100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Riesgo por operación (%)</Label>
                    <Input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={tradingSettings.riskPercentage}
                      onChange={(e) => updateTradingSetting('riskPercentage', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de operaciones diarias</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={tradingSettings.maxDailyTrades}
                      onChange={(e) => updateTradingSetting('maxDailyTrades', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Modo de trading</Label>
                    <Select 
                      value={tradingSettings.tradingMode} 
                      onValueChange={(value) => updateTradingSetting('tradingMode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservador</SelectItem>
                        <SelectItem value="moderate">Moderado</SelectItem>
                        <SelectItem value="aggressive">Agresivo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={getTradingModeColor(tradingSettings.tradingMode)}>
                      {tradingSettings.tradingMode === 'conservative' && 'Bajo riesgo, ganancias estables'}
                      {tradingSettings.tradingMode === 'moderate' && 'Riesgo equilibrado, crecimiento constante'}
                      {tradingSettings.tradingMode === 'aggressive' && 'Alto riesgo, alto potencial'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gestión Automática de Riesgo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoStopLoss">Stop Loss automático</Label>
                      <Switch
                        id="autoStopLoss"
                        checked={tradingSettings.autoStopLoss}
                        onCheckedChange={(checked) => updateTradingSetting('autoStopLoss', checked)}
                      />
                    </div>
                    {tradingSettings.autoStopLoss && (
                      <div className="ml-4 space-y-2">
                        <Label>Porcentaje de Stop Loss (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={tradingSettings.stopLossPercentage}
                          onChange={(e) => updateTradingSetting('stopLossPercentage', parseFloat(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoTakeProfit">Take Profit automático</Label>
                      <Switch
                        id="autoTakeProfit"
                        checked={tradingSettings.autoTakeProfit}
                        onCheckedChange={(checked) => updateTradingSetting('autoTakeProfit', checked)}
                      />
                    </div>
                    {tradingSettings.autoTakeProfit && (
                      <div className="ml-4 space-y-2">
                        <Label>Porcentaje de Take Profit (%)</Label>
                        <Input
                          type="number"
                          min="5"
                          max="50"
                          value={tradingSettings.takeProfitPercentage}
                          onChange={(e) => updateTradingSetting('takeProfitPercentage', parseFloat(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="confirmOrders">Confirmar órdenes antes de ejecutar</Label>
                  <Switch
                    id="confirmOrders"
                    checked={tradingSettings.confirmOrders}
                    onCheckedChange={(checked) => updateTradingSetting('confirmOrders', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
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
                      <Label htmlFor="emailNotifications">Notificaciones por email</Label>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor="pushNotifications">Notificaciones push</Label>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <Label htmlFor="smsNotifications">Notificaciones por SMS</Label>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => updateNotificationSetting('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tipos de notificaciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priceAlerts">Alertas de precio</Label>
                      <Switch
                        id="priceAlerts"
                        checked={notificationSettings.priceAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('priceAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tradingAlerts">Alertas de trading</Label>
                      <Switch
                        id="tradingAlerts"
                        checked={notificationSettings.tradingAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('tradingAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="portfolioUpdates">Actualizaciones de portfolio</Label>
                      <Switch
                        id="portfolioUpdates"
                        checked={notificationSettings.portfolioUpdates}
                        onCheckedChange={(checked) => updateNotificationSetting('portfolioUpdates', checked)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="newsAlerts">Alertas de noticias</Label>
                      <Switch
                        id="newsAlerts"
                        checked={notificationSettings.newsAlerts}
                        onCheckedChange={(checked) => updateNotificationSetting('newsAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marketOpenClose">Apertura/cierre de mercados</Label>
                      <Switch
                        id="marketOpenClose"
                        checked={notificationSettings.marketOpenClose}
                        onCheckedChange={(checked) => updateNotificationSetting('marketOpenClose', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mentorMessages">Mensajes de mentores</Label>
                      <Switch
                        id="mentorMessages"
                        checked={notificationSettings.mentorMessages}
                        onCheckedChange={(checked) => updateNotificationSetting('mentorMessages', checked)}
                      />
                    </div>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactorAuth">Autenticación de dos factores (2FA)</Label>
                      <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => updateSecuritySetting('twoFactorAuth', checked)}
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
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
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalización visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tema</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    className="h-16"
                    onClick={() => setTheme("light")}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-white border rounded"></div>
                      <span className="text-sm">Claro</span>
                    </div>
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    className="h-16"
                    onClick={() => setTheme("dark")}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-gray-900 border rounded"></div>
                      <span className="text-sm">Oscuro</span>
                    </div>
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    className="h-16"
                    onClick={() => setTheme("system")}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-white to-gray-900 border rounded"></div>
                      <span className="text-sm">Sistema</span>
                    </div>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gráficos</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estilo de gráfico predeterminado</Label>
                    <Select defaultValue="candlestick">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candlestick">Velas japonesas</SelectItem>
                        <SelectItem value="line">Línea</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                        <SelectItem value="bar">Barras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color de velas alcistas</Label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded border cursor-pointer"></div>
                      <div className="w-8 h-8 bg-blue-500 rounded border cursor-pointer"></div>
                      <div className="w-8 h-8 bg-emerald-500 rounded border cursor-pointer"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color de velas bajistas</Label>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-red-500 rounded border cursor-pointer"></div>
                      <div className="w-8 h-8 bg-orange-500 rounded border cursor-pointer"></div>
                      <div className="w-8 h-8 bg-pink-500 rounded border cursor-pointer"></div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sonidos</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <Label htmlFor="soundNotifications">Notificaciones de sonido</Label>
                    </div>
                    <Switch id="soundNotifications" defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label>Volumen</Label>
                    <Input type="range" min="0" max="100" defaultValue="70" className="w-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón de guardar */}
      <div className="flex justify-end pt-6">
        <Button onClick={handleSave} className="min-w-32">
          <Save className="h-4 w-4 mr-2" />
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage; 