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
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  pejecoins: number;
  isActive: boolean;
};

export default function CrmUsersPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        toast.error(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Usuario actualizado');
        setOpenDialog(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Error al actualizar');
      }
    } catch (e) {
      toast.error('Error');
    }
  };

  const handleCreate = () => {
    setEditingUser({
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: 'cliente',
      pejecoins: 0,
      isActive: true,
    });
    setOpenDialog(true);
  };

  const submitCreate = async () => {
    if (!editingUser) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Usuario creado');
        setOpenDialog(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Error');
      }
    } catch (e) {
      toast.error('Error');
    }
  };

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
                <Button onClick={handleCreate}>
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
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.pejecoins.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => { setEditingUser(user); setOpenDialog(true); }}>
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
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Nombre</Label>
                  <Input value={editingUser.firstName} onChange={(e)=>setEditingUser({...editingUser, firstName:e.target.value})} />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input value={editingUser.lastName} onChange={(e)=>setEditingUser({...editingUser, lastName:e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={editingUser.email} onChange={(e)=>setEditingUser({...editingUser, email:e.target.value})} />
              </div>
              <div>
                <Label>Rol</Label>
                <Input value={editingUser.role} onChange={(e)=>setEditingUser({...editingUser, role:e.target.value})} />
              </div>
              <div>
                <Label>Dólares</Label>
                <Input type="number" value={editingUser.pejecoins} onChange={(e)=>setEditingUser({...editingUser, pejecoins:parseInt(e.target.value)})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {editingUser?.id ? (
              <Button onClick={handleSave}>Guardar</Button>
            ) : (
              <Button onClick={submitCreate}>Crear</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 