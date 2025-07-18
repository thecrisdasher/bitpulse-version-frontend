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
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  Trash,
  Archive,
  UserX
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'cliente' as 'cliente' | 'admin' | 'maestro',
    pejecoins: 0,
    isActive: true,
    password: '',
    confirmPassword: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordMethod, setPasswordMethod] = useState<'keep' | 'generate' | 'custom'>('keep');
  const [deletedUsers, setDeletedUsers] = useState<UserData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

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
          
          // Separar usuarios activos de eliminados
          const allUsers = json.users as UserData[];
          const activeUsers = allUsers.filter(user => user.status === 'active');
          const inactiveUsers = allUsers.filter(user => user.status === 'inactive');
          
          setUsers(activeUsers);
          setDeletedUsers(inactiveUsers);
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

  // Abrir modal de edición
  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      pejecoins: user.pejecoins,
      isActive: user.status === 'active',
      password: '',
      confirmPassword: ''
    });
    setPasswordMethod('keep');
    setIsEditDialogOpen(true);
  };

  // Generar contraseña automática
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditForm(prev => ({ ...prev, password, confirmPassword: password }));
  };

  // Efecto para generar contraseña cuando se selecciona el método automático
  useEffect(() => {
    if (passwordMethod === 'generate') {
      generatePassword();
    } else if (passwordMethod === 'keep') {
      setEditForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
    }
  }, [passwordMethod]);

  // Manejar actualización de usuario
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    // Validaciones
    if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (passwordMethod === 'custom') {
      if (!editForm.password) {
        toast.error('Por favor ingresa una contraseña');
        return;
      }
      if (editForm.password !== editForm.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        return;
      }
      if (editForm.password.length < 8) {
        toast.error('La contraseña debe tener al menos 8 caracteres');
        return;
      }
    }

    try {
      setIsUpdating(true);

      const updateData: any = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        pejecoins: editForm.pejecoins,
        isActive: editForm.isActive
      };

      // Solo incluir contraseña si se va a cambiar
      if (passwordMethod === 'generate' || passwordMethod === 'custom') {
        updateData.password = editForm.password;
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al actualizar usuario');
      }

      // Actualizar usuario en la lista local
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { 
              ...u, 
              firstName: editForm.firstName,
              lastName: editForm.lastName,
              email: editForm.email,
              role: editForm.role,
              pejecoins: editForm.pejecoins,
              status: editForm.isActive ? 'active' : 'inactive'
            }
          : u
      ));

      let successMessage = `Usuario ${editForm.firstName} ${editForm.lastName} actualizado exitosamente`;
      if (passwordMethod === 'generate') {
        successMessage += '. La nueva contraseña se ha generado y debe ser comunicada al usuario.';
      } else if (passwordMethod === 'custom') {
        successMessage += '. La contraseña ha sido actualizada.';
      }

      toast.success(successMessage);
      
      // Mostrar contraseña generada si es necesario
      if (passwordMethod === 'generate') {
        setTimeout(() => {
          toast.info(`Contraseña generada: ${editForm.password}`, {
            duration: 10000,
          });
        }, 1000);
      }
      
      setIsEditDialogOpen(false);
      
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario');
    } finally {
      setIsUpdating(false);
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

  // Eliminar usuario (soft delete)
  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${user.firstName} ${user.lastName}? El usuario será movido al historial y podrá ser recuperado.`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: false }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al eliminar usuario');
      }

      // Mover usuario de activos a eliminados
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setDeletedUsers(prev => [...prev, { ...user, status: 'inactive' }]);

      toast.success(`Usuario ${user.firstName} ${user.lastName} eliminado. Movido al historial.`);
      
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  // Recuperar usuario
  const handleRecoverUser = async (user: UserData) => {
    if (!confirm(`¿Estás seguro de que quieres recuperar a ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: true }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al recuperar usuario');
      }

      // Mover usuario de eliminados a activos
      setDeletedUsers(prev => prev.filter(u => u.id !== user.id));
      setUsers(prev => [...prev, { ...user, status: 'active' }]);

      toast.success(`Usuario ${user.firstName} ${user.lastName} recuperado exitosamente.`);
      
    } catch (error) {
      console.error('Error al recuperar usuario:', error);
      toast.error('Error al recuperar usuario');
    } finally {
      setIsDeleting(false);
    }
  };

  // Eliminar usuario definitivamente
  const handlePermanentDelete = async (user: UserData) => {
    if (!confirm(`⚠️ ATENCIÓN: ¿Estás seguro de que quieres eliminar DEFINITIVAMENTE a ${user.firstName} ${user.lastName}? Esta acción NO se puede deshacer y se perderán todos los datos del usuario.`)) {
      return;
    }

    if (!confirm(`Esta es tu última oportunidad. ¿Realmente quieres eliminar PARA SIEMPRE a ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Error al eliminar usuario definitivamente');
      }

      // Remover usuario de la lista de eliminados
      setDeletedUsers(prev => prev.filter(u => u.id !== user.id));

      toast.success(`Usuario ${user.firstName} ${user.lastName} eliminado definitivamente.`);
      
    } catch (error) {
      console.error('Error al eliminar usuario definitivamente:', error);
      toast.error('Error al eliminar usuario definitivamente');
    } finally {
      setIsDeleting(false);
    }
  };

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
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar Usuario</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user)}
                              disabled={isDeleting}
                            >
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

      {/* Sección de Usuarios Eliminados */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Archive className="mr-2 h-5 w-5 text-muted-foreground" />
              <span>Historial de Usuarios Eliminados ({deletedUsers.length})</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDeletedUsers(!showDeletedUsers)}
            >
              {showDeletedUsers ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar ({deletedUsers.length})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        {showDeletedUsers && (
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-right">PejeCoins</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <UserX className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-muted-foreground">No hay usuarios eliminados</span>
                          <span className="text-sm text-muted-foreground mt-1">Los usuarios eliminados aparecerán aquí</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedUsers.map((user) => (
                      <TableRow key={user.id} className="opacity-75">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mr-3">
                              <UserX className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-muted-foreground">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-muted-foreground border-muted-foreground">
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {user.pejecoins.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.lastLogin)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isDeleting}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleRecoverUser(user)}
                                disabled={isDeleting}
                                className="text-green-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                <span>Recuperar Usuario</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handlePermanentDelete(user)}
                                disabled={isDeleting}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                <span>Eliminar Definitivamente</span>
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
        )}
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

      {/* Diálogo para editar usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              {editingUser && `Editar información de ${editingUser.firstName} ${editingUser.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                Nombre
              </Label>
              <div className="col-span-3">
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Apellido
              </Label>
              <div className="col-span-3">
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <div className="col-span-3">
                <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value as 'cliente' | 'admin' | 'maestro' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="maestro">Maestro</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pejecoins" className="text-right">
                PejeCoins
              </Label>
              <div className="col-span-3">
                <Input
                  id="pejecoins"
                  type="number"
                  value={editForm.pejecoins}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pejecoins: parseInt(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Estado
              </Label>
              <div className="col-span-3">
                <Select value={editForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setEditForm(prev => ({ ...prev, isActive: value === 'active' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="passwordMethod" className="text-right">
                Contraseña
              </Label>
              <div className="col-span-3">
                <Select value={passwordMethod} onValueChange={(value) => setPasswordMethod(value as 'keep' | 'generate' | 'custom')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Mantener contraseña actual</SelectItem>
                    <SelectItem value="generate">Generar automáticamente</SelectItem>
                    <SelectItem value="custom">Establecer nueva contraseña</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {passwordMethod === 'generate' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm text-muted-foreground">
                  Contraseña Generada
                </Label>
                <div className="col-span-3">
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono">{editForm.password}</code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                        className="ml-2"
                      >
                        🔄 Regenerar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      La contraseña se mostrará al usuario y se enviará por email
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {passwordMethod === 'custom' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Nueva Contraseña
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="password"
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Confirmar Contraseña
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full"
                      placeholder="Confirma la nueva contraseña"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={isUpdating}
            >
              {isUpdating ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage; 