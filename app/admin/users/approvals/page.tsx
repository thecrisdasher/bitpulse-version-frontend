'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Mail,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interfaces
interface UserApproval {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  adminApprovalRequestedAt: string;
  adminApprovalExpiresAt: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  daysUntilExpiry: number | null;
  adminApprovalNotes?: string;
}

const UserApprovalsPage = () => {
  const { user, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserApproval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  // Verificar permisos de administrador
  useEffect(() => {
    if (isAuthenticated && !hasRole('admin')) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/');
    }
  }, [isAuthenticated, hasRole, router]);

  // Cargar usuarios pendientes de aprobación
  useEffect(() => {
    if (isAuthenticated && hasRole('admin')) {
      fetchUsers();
    }
  }, [isAuthenticated, hasRole, statusFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/users?approval=${statusFilter}`, { 
        credentials: 'include' 
      });
      
      if (!res.ok) throw new Error('Error obteniendo usuarios');
      
      const json = await res.json();
      setUsers(json.users as UserApproval[]);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar usuarios pendientes de aprobación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    
    try {
      setIsSubmitting(true);
      
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: actionType, 
          notes: notes.trim() || undefined 
        }),
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Error en la operación');
      }

      toast.success(json.message);
      
      // Actualizar la lista local
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      
      // Cerrar diálogo y resetear
      setSelectedUser(null);
      setActionType(null);
      setNotes('');
      
    } catch (error) {
      console.error('Error en acción de usuario:', error);
      toast.error(error instanceof Error ? error.message : 'Error en la operación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (user: UserApproval, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setActionType(action);
    setNotes('');
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setActionType(null);
    setNotes('');
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Obtener badge del estado
  const getStatusBadge = (status: string, daysUntilExpiry: number | null) => {
    switch (status) {
      case 'pending':
        if (daysUntilExpiry !== null && daysUntilExpiry <= 1) {
          return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Urgente ({daysUntilExpiry}d)</Badge>;
        }
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pendiente ({daysUntilExpiry}d)</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rechazado</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Expirado</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  if (!isAuthenticated || !hasRole('admin')) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Aprobación de Usuarios</h1>
        <p className="text-gray-600">
          Gestiona las solicitudes de registro pendientes de aprobación
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Estado de Aprobación</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'pending' && 'Usuarios Pendientes de Aprobación'}
            {statusFilter === 'approved' && 'Usuarios Aprobados'}
            {statusFilter === 'rejected' && 'Usuarios Rechazados'}
            {statusFilter === 'expired' && 'Solicitudes Expiradas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay usuarios {statusFilter === 'pending' ? 'pendientes de aprobación' : statusFilter}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tiempo Restante</TableHead>
                  {statusFilter === 'pending' && <TableHead>Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">@{user.email.split('@')[0]}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(user.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.approvalStatus, user.daysUntilExpiry)}
                    </TableCell>
                    <TableCell>
                      {user.daysUntilExpiry !== null ? (
                        <span className={user.daysUntilExpiry <= 1 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {user.daysUntilExpiry > 0 ? `${user.daysUntilExpiry} días` : 'Expirado'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    {statusFilter === 'pending' && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openActionDialog(user, 'approve')}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openActionDialog(user, 'reject')}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación */}
      <Dialog open={!!selectedUser} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aprobar Usuario' : 'Rechazar Usuario'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `¿Estás seguro de que quieres aprobar a ${selectedUser?.firstName} ${selectedUser?.lastName}?`
                : `¿Estás seguro de que quieres rechazar a ${selectedUser?.firstName} ${selectedUser?.lastName}?`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder={actionType === 'approve' 
                  ? 'Agregar notas sobre la aprobación...'
                  : 'Razón del rechazo...'
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isSubmitting}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isSubmitting ? 'Procesando...' : (actionType === 'approve' ? 'Aprobar' : 'Rechazar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApprovalsPage; 