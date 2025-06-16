"use client"

import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, Plus } from "lucide-react"
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
import { useState, useEffect } from "react"
import { toast } from "sonner"

type SimpleUser = { id: string; firstName: string; lastName: string; email: string };

export default function CrmSaldosPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');

  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users.map((u:any)=>({ id:u.id, firstName:u.firstName, lastName:u.lastName, email:u.email })));
      } else {
        toast.error(data.error || 'Error al cargar usuarios');
      }
    } catch (e) {
      toast.error('Error de red');
    }
  };

  useEffect(()=>{ if(canManage) fetchUsers(); }, [canManage]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!selectedUser || amount<=0){ toast.error('Selecciona usuario y monto válido'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pejecoins', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ userId: selectedUser, amount, concept: 'Asignación de dolares por administrador' })
      });
      const data = await res.json();
      if(res.ok && data.success){
        toast.success('Saldo asignado');
        setAmount(0);
        setSelectedUser('');
      } else {
        toast.error(data.message || 'Error');
      }
    } catch(err){
      toast.error('Error de red');
    } finally {
      setLoading(false);
    }
  };

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
              Gestión de Saldos (Dólares)
            </h1>
            <p className="text-muted-foreground">
              Asigna saldo de práctica a los usuarios.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl">
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Asignar Dólares</CardTitle>
                <CardDescription>
                  Selecciona un usuario y la cantidad a depositar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleAssign}>
                  <div>
                    <Label htmlFor="user-select">Usuario</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger id="user-select">
                        <SelectValue placeholder="Selecciona un usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" placeholder="Ej: 1000" value={amount} onChange={(e)=>setAmount(parseInt(e.target.value))} />
                  </div>
                  <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? 'Asignando...' : 'Asignar Saldo'}
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