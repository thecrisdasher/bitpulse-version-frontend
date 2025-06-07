"use client"

import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, User, Plus } from "lucide-react"
import { CompatButton as Button } from "@/components/ui/compat-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data for users - will be replaced with API data
const mockUsers = [
  { id: '1', name: 'Juan Perez', email: 'juan.perez@email.com' },
  { id: '2', name: 'Maria Lopez', email: 'maria.lopez@email.com' },
];

export default function CrmSaldosPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');

  if (!canManage) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>No tienes permiso para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-primary" />
              Gestión de Saldos (PejeCoins)
            </h1>
            <p className="text-muted-foreground">
              Asigna saldo de práctica a los usuarios.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Asignar PejeCoins</CardTitle>
                <CardDescription>
                  Selecciona un usuario y la cantidad a depositar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="user-select">Usuario</Label>
                    <Select>
                      <SelectTrigger id="user-select">
                        <SelectValue placeholder="Selecciona un usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" placeholder="Ej: 1000" />
                  </div>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Saldo
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 