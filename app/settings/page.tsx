"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Palette, 
  Bell, 
  Lock, 
  CheckCircle2, 
  ArrowUpDown, 
  Smartphone, 
  UserIcon, 
  Settings2, 
  Database,
  TicketPercent 
} from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true)
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true)
  const [currency, setCurrency] = useState("USD")
  const [language, setLanguage] = useState("es")
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configuración</h1>
            <p className="text-muted-foreground">
              Personaliza tu experiencia en BitPulse
            </p>
          </header>
          
          <Tabs defaultValue="general" className="mb-8">
            <TabsList className="grid grid-cols-1 md:grid-cols-4 mb-4">
              <TabsTrigger value="general">
                <Settings2 className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="h-4 w-4 mr-2" />
                Apariencia
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger value="account">
                <UserIcon className="h-4 w-4 mr-2" />
                Cuenta
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Preferencias Generales</CardTitle>
                    <CardDescription>
                      Configuración básica de la aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="live-updates">Actualizaciones en tiempo real</Label>
                        <p className="text-sm text-muted-foreground">
                          Actualiza los datos automáticamente sin recargar
                        </p>
                      </div>
                      <Switch 
                        id="live-updates" 
                        checked={liveUpdatesEnabled}
                        onCheckedChange={setLiveUpdatesEnabled}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="currency-select">Moneda predeterminada</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="currency-select">
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD (Dólar americano)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="COP">COP (Peso colombiano)</SelectItem>
                          <SelectItem value="GBP">GBP (Libra esterlina)</SelectItem>
                          <SelectItem value="JPY">JPY (Yen japonés)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="language-select">Idioma</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language-select">
                          <SelectValue placeholder="Seleccionar idioma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Datos</CardTitle>
                    <CardDescription>
                      Gestiona los proveedores de datos y la caché
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="use-cache">Usar caché local</Label>
                        <p className="text-sm text-muted-foreground">
                          Almacenar datos en caché para uso offline
                        </p>
                      </div>
                      <Switch id="use-cache" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="fetch-fallback">Usar fetch como respaldo</Label>
                        <p className="text-sm text-muted-foreground">
                          Cambiar a fetch si axios falla
                        </p>
                      </div>
                      <Switch id="fetch-fallback" defaultChecked />
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Limpiar Caché
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tema</CardTitle>
                    <CardDescription>
                      Personaliza la apariencia de la aplicación
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Cambiar tema</Label>
                        <p className="text-sm text-muted-foreground">
                          Selecciona entre modo claro y oscuro
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Color de acento</Label>
                      <div className="flex flex-wrap gap-2">
                        {['blue', 'green', 'violet', 'pink', 'orange'].map(color => (
                          <button 
                            key={color}
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                            aria-label={`Theme color ${color}`}
                          >
                            {color === 'blue' && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Visualización</CardTitle>
                    <CardDescription>
                      Personaliza la forma en que se muestran los datos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="compact-mode">Modo compacto</Label>
                        <p className="text-sm text-muted-foreground">
                          Reduce el espaciado para mostrar más información
                        </p>
                      </div>
                      <Switch id="compact-mode" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="animations">Animaciones</Label>
                        <p className="text-sm text-muted-foreground">
                          Habilitar animaciones en la interfaz
                        </p>
                      </div>
                      <Switch id="animations" defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Notificaciones</CardTitle>
                  <CardDescription>
                    Elige cómo y cuándo recibir notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications-general">Notificaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilitar todas las notificaciones
                      </p>
                    </div>
                    <Switch 
                      id="notifications-general" 
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications-price">Alertas de precio</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificar cuando un activo alcance un precio objetivo
                        </p>
                      </div>
                      <Switch 
                        id="notifications-price" 
                        checked={priceAlertsEnabled && notificationsEnabled}
                        onCheckedChange={setPriceAlertsEnabled}
                        disabled={!notificationsEnabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tu información de cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-name">Nombre</Label>
                      <Input id="display-name" defaultValue="Carlos Usuario" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" type="email" defaultValue="usuario@ejemplo.com" />
                    </div>
                    
                    <Button className="w-full">Guardar cambios</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Opciones de Cuenta</CardTitle>
                    <CardDescription>
                      Administra la configuración de tu cuenta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <Smartphone className="h-4 w-4 mr-2" />
                        Descargar app móvil
                      </Button>
                      <Button variant="outline" className="w-full">
                        <ArrowUpDown className="h-4 w-4 mr-2" />
                        Exportar datos
                      </Button>
                    </div>
                    
                    <div>
                      <Button variant="destructive" className="w-full">
                        Cerrar sesión
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 