"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  MessageSquare,
  Search,
  Trash2,
  Check,
  Crown,
  ArrowRight,
  BarChart3,
  Filter,
  RefreshCw,
  UserCheck,
  AlertCircle,
  TrendingUp,
  Clock,
  Eye,
  Mail,
  Calendar,
  Activity,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChat, ChatProvider } from "@/contexts/ChatContext";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'cliente' | 'admin' | 'maestro';
  profilePicture?: string;
  createdAt: string;
  lastLogin?: string;
  pejecoins?: number;
  isActive?: boolean;
}

interface Assignment {
  id: string;
  userId: string;
  mentorId: string;
  assignedAt: string;
  user: User;
  mentor: User;
}

const MentorManagementContent: React.FC = () => {
  const { user } = useAuth();
  const { assignMentor } = useChat();
  const router = useRouter();
  
  const [mentors, setMentors] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'busy'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [mentorSearchTerm, setMentorSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [userSelectSearch, setUserSelectSearch] = useState('');
  const [mentorSelectSearch, setMentorSelectSearch] = useState('');

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  // Cargar datos una vez al montar
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Cargar mentores disponibles
      const mentorsResponse = await fetch('/api/chat/mentors?action=available', {
        credentials: 'include'
      });
      
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json();
        setMentors(mentorsData.mentors);
      }

      // Cargar todos los usuarios
      const usersResponse = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users.filter((u: User) => u.role === 'cliente'));
      }

      // Cargar asignaciones existentes
      const assignmentsResponse = await fetch('/api/chat/mentors?action=assignments', {
        credentials: 'include'
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedUser || !selectedMentor) {
      toast.error('Selecciona un usuario y un mentor');
      return;
    }

    try {
      // Emitir evento por WebSocket para crear asignación y sala
      assignMentor(selectedUser, selectedMentor);

      toast.success('Manager asignado, se creó el chat privado');
      setIsAssignDialogOpen(false);
      setSelectedUser('');
      setSelectedMentor('');
      setUserSelectSearch('');
      setMentorSelectSearch('');

      // Esperar un momento y recargar datos para reflejar la nueva asignación
      setTimeout(() => loadData(true), 500);
    } catch (error) {
      console.error('Error assigning mentor:', error);
      toast.error('Error al asignar manager');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover esta asignación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/mentors?assignmentId=${assignmentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Asignación removida exitosamente');
        loadData(true); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al remover asignación');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Error al remover asignación');
    }
  };

  const openAssignmentDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailDialogOpen(true);
  };

  // Filtros y búsquedas
  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableUsers = filteredUsers.filter(u => 
    !assignments.some(a => a.userId === u.id)
  );

  // Filtros para los selectores del modal
  const filteredAvailableUsers = availableUsers.filter(user =>
    userSelectSearch === '' ||
    user.firstName.toLowerCase().includes(userSelectSearch.toLowerCase()) ||
    user.lastName.toLowerCase().includes(userSelectSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSelectSearch.toLowerCase())
  );

  const filteredMentorsForSelect = mentors.filter(mentor =>
    mentorSelectSearch === '' ||
    mentor.firstName.toLowerCase().includes(mentorSelectSearch.toLowerCase()) ||
    mentor.lastName.toLowerCase().includes(mentorSelectSearch.toLowerCase()) ||
    mentor.email.toLowerCase().includes(mentorSelectSearch.toLowerCase())
  );

  const filteredMentors = mentors.filter(mentor => {
    const mentorAssignments = assignments.filter(a => a.mentorId === mentor.id);
    
    // Filtro por estado
    let passesStatusFilter = true;
    if (filterType === 'available') passesStatusFilter = mentorAssignments.length === 0;
    if (filterType === 'busy') passesStatusFilter = mentorAssignments.length > 0;
    
    // Filtro por búsqueda
    const passesSearchFilter = mentorSearchTerm === '' || 
      mentor.firstName.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
      mentor.lastName.toLowerCase().includes(mentorSearchTerm.toLowerCase()) ||
      mentor.email.toLowerCase().includes(mentorSearchTerm.toLowerCase());
    
    return passesStatusFilter && passesSearchFilter;
  });

  // Estadísticas
  const stats = {
    totalMentors: mentors.length,
    availableMentors: mentors.filter(m => assignments.filter(a => a.mentorId === m.id).length === 0).length,
    totalAssignments: assignments.length,
    unassignedUsers: availableUsers.length
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl space-y-8">
          {/* Header Mejorado con colores de la aplicación */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl" />
            <div className="relative p-8 bg-card/80 backdrop-blur-sm border rounded-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Gestión de Managers
                    </h1>
                  </div>
                  <p className="text-muted-foreground max-w-2xl">
                    Administra las asignaciones entre usuarios y managers. Crea conexiones efectivas para mejorar la experiencia del usuario.
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    Actualizar
                  </Button>
                  
                  <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <UserPlus className="h-4 w-4" />
                        Nueva Asignación
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-primary" />
                          Asignar Manager a Usuario
                        </DialogTitle>
                        <DialogDescription>
                          Selecciona un usuario sin asignar y un manager disponible para crear una nueva conexión.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Usuario</Label>
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar usuario sin asignar" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {/* Búsqueda de usuarios */}
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Buscar usuario..."
                                    value={userSelectSearch}
                                    onChange={(e) => setUserSelectSearch(e.target.value)}
                                    className="pl-8 h-8 text-sm"
                                  />
                                </div>
                              </div>
                              
                              {/* Lista de usuarios con scroll */}
                              <div className="max-h-60 overflow-y-auto">
                                {filteredAvailableUsers.length === 0 ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">
                                    {userSelectSearch ? 
                                      `No se encontraron usuarios con "${userSelectSearch}"` :
                                      'Todos los usuarios están asignados'
                                    }
                                  </div>
                                ) : (
                                  filteredAvailableUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id} className="py-3">
                                      <div className="flex items-center gap-3 w-full">
                                        <Avatar className="h-8 w-8">
                                          <AvatarFallback className="text-xs bg-primary/10">
                                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm">
                                            {user.firstName} {user.lastName}
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">
                                            {user.email}
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Manager</Label>
                          <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar manager" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {/* Búsqueda de managers */}
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Buscar manager..."
                                    value={mentorSelectSearch}
                                    onChange={(e) => setMentorSelectSearch(e.target.value)}
                                    className="pl-8 h-8 text-sm"
                                  />
                                </div>
                              </div>
                              
                              {/* Lista de managers con scroll */}
                              <div className="max-h-60 overflow-y-auto">
                                {filteredMentorsForSelect.length === 0 ? (
                                  <div className="p-3 text-sm text-muted-foreground text-center">
                                    {mentorSelectSearch ? 
                                      `No se encontraron managers con "${mentorSelectSearch}"` :
                                      'No hay managers disponibles'
                                    }
                                  </div>
                                ) : (
                                  filteredMentorsForSelect.map((mentor) => {
                                    const mentorAssignments = assignments.filter(a => a.mentorId === mentor.id);
                                    return (
                                      <SelectItem key={mentor.id} value={mentor.id} className="py-3">
                                        <div className="flex items-center gap-3 w-full">
                                          <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs bg-primary/10">
                                              {mentor.firstName.charAt(0)}{mentor.lastName.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-medium text-sm">
                                                {mentor.firstName} {mentor.lastName}
                                              </span>
                                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                <Crown className="h-3 w-3 mr-1" />
                                                Manager
                                              </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate mb-1">
                                              {mentor.email}
                                            </div>
                                            <Badge 
                                              variant="outline" 
                                              className={cn(
                                                "text-xs",
                                                mentorAssignments.length === 0 
                                                  ? "border-emerald-200 text-emerald-700" 
                                                  : "border-orange-200 text-orange-700"
                                              )}
                                            >
                                              {mentorAssignments.length} asignados
                                            </Badge>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsAssignDialogOpen(false);
                          setUserSelectSearch('');
                          setMentorSelectSearch('');
                        }}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleAssignMentor}
                          disabled={!selectedUser || !selectedMentor}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Crear Asignación
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas con colores de la aplicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Managers</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalMentors}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.availableMentors}</p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Asignaciones Activas</p>
                    <p className="text-2xl font-bold text-accent-foreground">{stats.totalAssignments}</p>
                  </div>
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sin Asignar</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.unassignedUsers}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Panel de Managers */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Managers ({filteredMentors.length})
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    {/* Filtro de búsqueda transformable */}
                    <div className="relative">
                      {!isSearchExpanded ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSearchExpanded(true)}
                          className="gap-2 transition-all duration-200"
                        >
                          <Search className="h-4 w-4" />
                          Buscar
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-2 duration-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar manager..."
                              value={mentorSearchTerm}
                              onChange={(e) => setMentorSearchTerm(e.target.value)}
                              className="pl-10 w-48 bg-background/50"
                              autoFocus
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsSearchExpanded(false);
                              setMentorSearchTerm('');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-32">
                        <Filter className="h-4 w-4 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="available">Disponibles</SelectItem>
                        <SelectItem value="busy">Ocupados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">Cargando managers...</span>
                      </div>
                    </div>
                  ) : filteredMentors.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        {mentorSearchTerm ? 
                          `No se encontraron managers con "${mentorSearchTerm}"` :
                          `No hay managers ${filterType !== 'all' ? filterType === 'available' ? 'disponibles' : 'ocupados' : 'disponibles'}`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {mentorSearchTerm ? 
                          'Intenta con otros términos de búsqueda' :
                          'Los managers aparecerán aquí una vez registrados'
                        }
                      </p>
                      {mentorSearchTerm && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setMentorSearchTerm('')}
                          className="mt-3"
                        >
                          Limpiar búsqueda
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredMentors.map((mentor) => {
                      const mentorAssignments = assignments.filter(a => a.mentorId === mentor.id);
                      const isAvailable = mentorAssignments.length === 0;
                      
                      return (
                        <div key={mentor.id} className="group relative p-5 border rounded-xl hover:shadow-lg transition-all duration-200 hover:border-primary/30 bg-card">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                                <AvatarImage src={mentor.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
                                  {mentor.firstName.charAt(0)}{mentor.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={cn(
                                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background shadow-sm",
                                isAvailable ? "bg-emerald-500" : "bg-orange-500"
                              )} />
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Nombre y Badge */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg text-foreground">
                                  {mentor.firstName} {mentor.lastName}
                                </h3>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Manager
                                </Badge>
                              </div>
                              
                              {/* Email completo */}
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm break-all">{mentor.email}</span>
                              </div>
                              
                              {/* Información adicional */}
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge 
                                    variant={isAvailable ? "default" : "secondary"}
                                    className={cn(
                                      "text-xs font-medium",
                                      isAvailable 
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                        : "bg-orange-100 text-orange-700 border-orange-200"
                                    )}
                                  >
                                    {mentorAssignments.length} usuarios asignados
                                  </Badge>
                                  
                                  <Badge variant="outline" className="text-xs">
                                    {isAvailable ? "Disponible" : "Ocupado"}
                                  </Badge>
                                </div>
                                
                                {mentor.lastLogin && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>Último acceso: {new Date(mentor.lastLogin).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Botón de acción */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/chat?participant=${mentor.id}`)}
                                className="gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Panel de Asignaciones Mejorado */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-accent/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Asignaciones Activas ({assignments.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background/50"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">Cargando asignaciones...</span>
                      </div>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <UserCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No hay asignaciones activas</p>
                      <p className="text-sm text-muted-foreground mt-1">Crea la primera asignación para comenzar</p>
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="group relative p-5 border rounded-xl hover:shadow-lg transition-all duration-200 hover:border-primary/30 bg-card">
                        <div className="space-y-4">
                          {/* Header con fecha */}
                          <div className="flex items-center justify-between pb-3 border-b border-muted/30">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>Asignado el {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openAssignmentDetails(assignment)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Detalles
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-destructive hover:text-destructive hover:border-destructive/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Cliente */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cliente</h4>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarImage src={assignment.user.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-medium">
                                  {assignment.user.firstName.charAt(0)}{assignment.user.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-foreground">
                                  {assignment.user.firstName} {assignment.user.lastName}
                                </h5>
                                <p className="text-sm text-muted-foreground break-all">
                                  {assignment.user.email}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/chat?participant=${assignment.user.id}`)}
                                className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                              </Button>
                            </div>
                          </div>
                          
                          {/* Flecha de conexión */}
                          <div className="flex justify-center">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-px bg-muted flex-1" />
                              <ArrowRight className="h-4 w-4" />
                              <div className="h-px bg-muted flex-1" />
                            </div>
                          </div>
                          
                          {/* Manager */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Manager Asignado</h4>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarImage src={assignment.mentor.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground font-medium">
                                  {assignment.mentor.firstName.charAt(0)}{assignment.mentor.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-foreground">
                                    {assignment.mentor.firstName} {assignment.mentor.lastName}
                                  </h5>
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Manager
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground break-all">
                                  {assignment.mentor.email}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => router.push(`/chat?participant=${assignment.mentor.id}`)}
                                className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Detalles de Asignación */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Detalles de la Asignación
            </DialogTitle>
            <DialogDescription>
              Información completa de la relación usuario-manager
            </DialogDescription>
          </DialogHeader>
          
          {selectedAssignment && (
            <div className="grid gap-6 py-4">
              {/* Información del Usuario */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Información del Cliente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                      <AvatarImage src={selectedAssignment.user.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xl font-semibold">
                        {selectedAssignment.user.firstName.charAt(0)}{selectedAssignment.user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-medium text-lg">
                        {selectedAssignment.user.firstName} {selectedAssignment.user.lastName}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        @{selectedAssignment.user.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAssignment.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Registrado: {new Date(selectedAssignment.user.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedAssignment.user.lastLogin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Último acceso: {new Date(selectedAssignment.user.lastLogin).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedAssignment.user.pejecoins !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-lg">💰</span>
                        <span>Saldo: ${selectedAssignment.user.pejecoins.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedAssignment.user.isActive ? "default" : "secondary"}>
                        {selectedAssignment.user.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del Manager */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  Información del Manager
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                      <AvatarImage src={selectedAssignment.mentor.profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-accent to-accent/80 text-accent-foreground text-xl font-semibold">
                        {selectedAssignment.mentor.firstName.charAt(0)}{selectedAssignment.mentor.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-medium text-lg">
                        {selectedAssignment.mentor.firstName} {selectedAssignment.mentor.lastName}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        @{selectedAssignment.mentor.username}
                      </p>
                      <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-primary/20">
                        <Crown className="h-3 w-3 mr-1" />
                        Manager
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedAssignment.mentor.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Registrado: {new Date(selectedAssignment.mentor.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedAssignment.mentor.lastLogin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Último acceso: {new Date(selectedAssignment.mentor.lastLogin).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {assignments.filter(a => a.mentorId === selectedAssignment.mentor.id).length} usuarios asignados
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la Asignación */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Información de la Asignación
                </h4>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Fecha de asignación: {new Date(selectedAssignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Duración: {Math.ceil((Date.now() - new Date(selectedAssignment.assignedAt).getTime()) / (1000 * 60 * 60 * 24))} días
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Cerrar
            </Button>
            {selectedAssignment && (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    router.push(`/chat?participant=${selectedAssignment.user.id}`);
                    setIsDetailDialogOpen(false);
                  }}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Abrir Chat
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleRemoveAssignment(selectedAssignment.id);
                    setIsDetailDialogOpen(false);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover Asignación
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MentorManagementPage = () => (
  <ChatProvider>
    <MentorManagementContent />
  </ChatProvider>
);

export default MentorManagementPage; 