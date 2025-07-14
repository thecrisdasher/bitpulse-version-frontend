'use client'

/*
  Nueva vista especializada para el administrador: Panel General del Administrador
  - Muestra estadísticas rápidas (usuarios, grupos, chats, reportes)
  - Accesos directos a módulos críticos
  - Actividad reciente
  - Acciones para exportar y enviar alertas globales
  - Acceso restringido a usuarios con rol 'admin'
*/

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users as UsersIcon,
  MessageSquare,
  Layers3,
  AlertOctagon,
  Coins,
  LayoutDashboard,
  Database,
  FileText,
  Bell,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react'

// Tipos de datos para las estadísticas y actividad
interface DashboardStats {
  totalUsers: number | null
  totalGroups: number | null
  activeChats: number | null
  totalReports: number | null
}

interface RecentActivityItem {
  id: string
  type: 'user_signup' | 'group_created' | 'chat_started'
  title: string
  timestamp: string
}

const AdminDashboardPage = () => {
  const { isAuthenticated, hasRole } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: null,
    totalGroups: null,
    activeChats: null,
    totalReports: null,
  })
  const [recent, setRecent] = useState<RecentActivityItem[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isSendingAlert, setIsSendingAlert] = useState(false)

  // Proteger la ruta para solo admins
  useEffect(() => {
    if (isAuthenticated && !hasRole('admin')) {
      router.push('/')
    }
  }, [isAuthenticated, hasRole, router])

  // Cargar estadísticas y actividad reciente (placeholder + fetch opcional)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setStats({
            totalUsers: json.totalUsers,
            totalGroups: json.totalGroups,
            activeChats: json.activeChats,
            totalReports: json.totalReports,
          })
          setRecent(json.recentActivity)
          return
        }
      } catch (err) {
        // Ignorar errores y usar valores simulados
      }
      // Valores simulados en caso de error o falta de endpoint
      setStats({
        totalUsers: 4875,
        totalGroups: 325,
        activeChats: 91,
        totalReports: 7,
      })
      setRecent([
        { id: '1', type: 'user_signup', title: 'Nuevo registro: juan@example.com', timestamp: new Date().toISOString() },
        { id: '2', type: 'group_created', title: 'Grupo "Trading Avanzado" creado', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', type: 'chat_started', title: 'Chat activo en "Cripto Novatos"', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ])
    }
    fetchData()
  }, [])

  const formatNumber = (value: number | null) => {
    if (value === null) return '—'
    return value.toLocaleString('es-CO')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/admin/users/report', { credentials: 'include' })
      if (!res.ok) throw new Error('Error generando CSV')
      const csv = await res.text()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'bitpulse_usuarios.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSendAlert = async () => {
    setIsSendingAlert(true)
    try {
      // Implementación real: llamada a API /api/admin/broadcast
      alert('Mensaje global enviado (simulado)')
    } finally {
      setIsSendingAlert(false)
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard className="h-6 w-6" />
        Panel General del Administrador
      </h1>

      {/* Resumen de control */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuarios registrados</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.totalUsers)}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Grupos creados</CardTitle>
            <Layers3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.totalGroups)}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Chats activos</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.activeChats)}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reportes recibidos</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(stats.totalReports)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Accesos rápidos</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users/approvals" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Aprobación de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Revisar solicitudes de registro</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/crm" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">CRM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Gestiona relaciones con clientes</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/pejecoins" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Manejo de Dólares</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Asigna y revisa Dólares</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/chat" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Grupos / Chats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Monitorea conversaciones</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/users" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Gestión de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Ver, editar o bloquear usuarios</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/operaciones" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Operaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Gestiona operaciones de clientes</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/apalancamiento" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Apalancamientos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Configura apalancamientos por mercado</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/help" className="group">
            <Card className="cursor-pointer group-hover:shadow-lg transition-shadow">
              <CardHeader className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-medium">Centro de Ayuda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Gestiona FAQs, guías y recursos</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Actividad reciente</h2>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="p-4 text-muted-foreground text-sm">Sin actividad registrada</p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map(item => (
                  <li key={item.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                    {item.type === 'user_signup' && <UsersIcon className="h-5 w-5 text-primary" />}
                    {item.type === 'group_created' && <Layers3 className="h-5 w-5 text-primary" />}
                    {item.type === 'chat_started' && <MessageSquare className="h-5 w-5 text-primary" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones adicionales */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSendAlert} disabled={isSendingAlert} className="flex-1 sm:flex-none">
          <Bell className="h-4 w-4 mr-2" />
          {isSendingAlert ? 'Enviando…' : 'Enviar alerta global'}
        </Button>
      </div>

      <Separator className="mt-8" />
      <p className="text-xs text-muted-foreground">Algunos módulos están en desarrollo y pueden mostrar datos simulados.</p>
    </div>
  )
}

export default AdminDashboardPage 