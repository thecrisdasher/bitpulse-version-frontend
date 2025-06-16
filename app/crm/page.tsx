"use client"

import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, MessageSquare, DollarSign, Activity, UserPlus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext";

export default function CrmDashboardPage() {
  const { hasRole } = useAuth();
  if (!hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              CRM Dashboard
            </h1>
            <p className="text-muted-foreground">
              Gestión centralizada de usuarios, saldos y comunicación.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/crm/usuarios">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <Users className="w-10 h-10 text-primary mb-2" />
                    <CardTitle>Gestión de Usuarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Crear, consultar y administrar las cuentas de los usuarios, maestros y administradores.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/crm/saldos">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <DollarSign className="w-10 h-10 text-green-500 mb-2" />
                    <CardTitle>Gestión de Saldos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Asignar y monitorear los saldos de Dólares para los usuarios de práctica.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/crm/mentores">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <UserPlus className="w-10 h-10 text-yellow-500 mb-2" />
                    <CardTitle>Asignar Manager</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Asigna managers a los usuarios y crea chats privados automáticamente.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/crm/chat">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <MessageSquare className="w-10 h-10 text-blue-500 mb-2" />
                    <CardTitle>Chat de Soporte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Comunicación directa con alumnos y clientes para soporte y mentoría.
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 