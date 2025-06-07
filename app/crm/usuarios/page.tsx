"use client"

import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserPlus } from "lucide-react"
import { CompatButton as Button } from "@/components/ui/compat-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for users - will be replaced with API data
const mockUsers = [
  { id: '1', name: 'Juan Perez', email: 'juan.perez@email.com', role: 'cliente', pejecoins: 5000, status: 'Activo' },
  { id: '2', name: 'Maria Lopez', email: 'maria.lopez@email.com', role: 'cliente', pejecoins: 7500, status: 'Activo' },
  { id: '3', name: 'Carlos Rivas', email: 'carlos.rivas@email.com', role: 'maestro', pejecoins: 10000, status: 'Activo' },
  { id: '4', name: 'Ana Gomez', email: 'ana.gomez@email.com', role: 'admin', pejecoins: 0, status: 'Inactivo' },
];

export default function CrmUsersPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Usuarios
            </h1>
            <p className="text-muted-foreground">
              Consulta, crea y administra los usuarios del sistema.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl">
            {canManage && (
              <div className="flex justify-end mb-4">
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>
                  Usuarios registrados en la plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>PejeCoins</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.pejecoins.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 