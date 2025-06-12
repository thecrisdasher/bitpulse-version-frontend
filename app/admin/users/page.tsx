'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Users, 
  UserPlus, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical,
  Trash2,
  Edit,
  Mail,
  Phone,
  Shield,
  Coins,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from '@/app/i18n/client';

// Interfaces para los datos
interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'cliente' | 'admin' | 'maestro';
  pejecoins: number;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  phone?: string;
}

interface CoinAssignment {
  userId: string;
  amount: number;
  concept: string;
}

const UsersPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [coinAssignment, setCoinAssignment] = useState<CoinAssignment>({
    userId: '',
    amount: 100,
    concept: 'Asignación de pejecoins por administrador'
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Verificar permisos de administrador
  useEffect(() => {
    if (isAuthenticated && !hasRole('admin')) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
    }
  }, [isAuthenticated, hasRole, router]);

  // Cargar datos de usuarios (simulados por ahora)
  useEffect(() => {
    if (isAuthenticated && hasRole('admin')) {
      const fetchUsers = async () => {
        try {
          const res = await fetch('/api/admin/users', { credentials: 'include' })
          if (!res.ok) throw new Error('Error obteniendo usuarios')
          const json = await res.json()
          setUsers(json.users as UserData[])
        } catch (error) {
          console.error(error)
          toast.error('Error al cargar usuarios')
        } finally {
          setIsLoading(false)
        }
      }
      fetchUsers()
    }
  }, [isAuthenticated, hasRole]);

  // Filtrar usuarios según términos de búsqueda y filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      searchTerm === '' || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Manejar asignación de pejecoins
  const handleAssignCoins = async () => {
    if (!selectedUser) return;
    
    try {
      setIsAssigning(true);
      
      const res = await fetch('/api/admin/pejecoins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: selectedUser.id, amount: coinAssignment.amount, concept: coinAssignment.concept }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Error')
      }

      // Actualizar el usuario localmente con nuevo balance
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, pejecoins: u.pejecoins + coinAssignment.amount } : u))
      
      toast.success(`Se han asignado ${coinAssignment.amount} pejecoins a ${selectedUser.firstName} ${selectedUser.lastName}`);
      
      // Cerrar diálogo y resetear formulario
      setIsAssignDialogOpen(false);
      setCoinAssignment({
        userId: '',
        amount: 100,
        concept: 'Asignación de pejecoins por administrador'
      });
      
    } catch (error) {
      console.error('Error al asignar pejecoins:', error);
      toast.error('Error al asignar pejecoins');
    } finally {
      setIsAssigning(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Obtener color de badge según rol
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'maestro': return 'outline';
      default: return 'default';
    }
  };

  // Obtener color de badge según estado
  const getStatusBadgeVariant = (status: string) => {
    // Variants permitidos: default, secondary, destructive, outline
    switch (status) {
      case 'active':
        return 'default'; // Verde/primario
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'destructive'; // Rojo para pendiente/alerta
      default:
        return 'outline';
    }
  };

  // Obtener icono según estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Añadir función exportación
  const handleExportCSV = async () => {
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
      toast.error('No fue posible exportar CSV')
    }
  }

  if (!isAuthenticated || !hasRole('admin')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acceso Restringido</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="mb-4">No tienes permisos para acceder a esta página.</p>
            <Button onClick={() => router.push('/')}>Volver al Inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios y asigna pejecoins para el sistema de trading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="default" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar usuarios..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="maestro">Maestro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            <span>Usuarios ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">PejeCoins</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-muted-foreground">Cargando usuarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-muted-foreground">No se encontraron usuarios</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Badge variant={getStatusBadgeVariant(user.status)} className="flex items-center gap-1">
                            {getStatusIcon(user.status)}
                            <span>{user.status}</span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {user.pejecoins.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.lastLogin)}
                      </TableCell>
                      <TableCell>
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setCoinAssignment(prev => ({ ...prev, userId: user.id }));
                              setIsAssignDialogOpen(true);
                            }}>
                              <Coins className="mr-2 h-4 w-4" />
                              <span>Asignar PejeCoins</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar Usuario</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para asignar pejecoins */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Asignar PejeCoins
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Asignar PejeCoins a ${selectedUser.firstName} ${selectedUser.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Cantidad
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  value={coinAssignment.amount}
                  onChange={(e) => setCoinAssignment(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  className="w-full"
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="concept" className="text-right">
                Concepto
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="concept"
                  value={coinAssignment.concept}
                  onChange={(e) => setCoinAssignment(prev => ({ ...prev, concept: e.target.value }))}
                  className="resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignCoins}
              disabled={isAssigning || coinAssignment.amount <= 0}
            >
              {isAssigning ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage; 