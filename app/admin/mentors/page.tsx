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
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";

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
}

interface Assignment {
  id: string;
  userId: string;
  mentorId: string;
  assignedAt: string;
  user: User;
  mentor: User;
}

const MentorManagementPage = () => {
  const { user, token } = useAuth();
  const { assignMentor } = useChat();
  
  const [mentors, setMentors] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Cargar mentores disponibles
      const mentorsResponse = await fetch('/api/chat/mentors?action=available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (mentorsResponse.ok) {
        const mentorsData = await mentorsResponse.json();
        setMentors(mentorsData.mentors);
      }

      // Cargar todos los usuarios
      const usersResponse = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users.filter((u: User) => u.role === 'cliente'));
      }

      // Cargar asignaciones existentes
      const assignmentsResponse = await fetch('/api/chat/mentors?action=assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
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
    }
  };

  const handleAssignMentor = async () => {
    if (!selectedUser || !selectedMentor) {
      toast.error('Selecciona un usuario y un mentor');
      return;
    }

    try {
      const response = await fetch('/api/chat/mentors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUser,
          mentorId: selectedMentor
        })
      });

      if (response.ok) {
        toast.success('Mentor asignado exitosamente');
        setIsAssignDialogOpen(false);
        setSelectedUser('');
        setSelectedMentor('');
        loadData(); // Recargar datos
        
        // También notificar vía WebSocket
        assignMentor(selectedUser, selectedMentor);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al asignar mentor');
      }
    } catch (error) {
      console.error('Error assigning mentor:', error);
      toast.error('Error al asignar mentor');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover esta asignación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/mentors?assignmentId=${assignmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Asignación removida exitosamente');
        loadData(); // Recargar datos
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al remover asignación');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Error al remover asignación');
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableUsers = filteredUsers.filter(u => 
    !assignments.some(a => a.userId === u.id)
  );

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestión de Mentores</h1>
            <p className="text-muted-foreground">
              Administra las asignaciones entre usuarios y mentores.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de mentores */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Mentores Disponibles ({mentors.length})
                </CardTitle>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Asignar Mentor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Mentor a Usuario</DialogTitle>
                      <DialogDescription>
                        Selecciona un usuario y un mentor para crear una nueva asignación.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="user">Usuario</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="mentor">Mentor</Label>
                        <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar mentor" />
                          </SelectTrigger>
                          <SelectContent>
                            {mentors.map((mentor) => (
                              <SelectItem key={mentor.id} value={mentor.id}>
                                {mentor.firstName} {mentor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={handleAssignMentor}
                        disabled={!selectedUser || !selectedMentor}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Asignar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">Cargando mentores...</div>
                  ) : mentors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay mentores disponibles
                    </div>
                  ) : (
                    mentors.map((mentor) => {
                      const mentorAssignments = assignments.filter(a => a.mentorId === mentor.id);
                      
                      return (
                        <div key={mentor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={mentor.profilePicture} />
                            <AvatarFallback>
                              {mentor.firstName.charAt(0)}{mentor.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">
                              {mentor.firstName} {mentor.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">{mentor.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {mentorAssignments.length} usuarios asignados
                              </Badge>
                              <Badge variant="outline">Mentor</Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Panel de asignaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Asignaciones Activas ({assignments.length})</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar asignaciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">Cargando asignaciones...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay asignaciones activas
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.user.profilePicture} />
                            <AvatarFallback>
                              {assignment.user.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">
                              {assignment.user.firstName} {assignment.user.lastName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {assignment.user.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground mb-1">asignado a</div>
                          <div className="w-8 h-0.5 bg-border"></div>
                        </div>
                        
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.mentor.profilePicture} />
                            <AvatarFallback>
                              {assignment.mentor.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">
                              {assignment.mentor.firstName} {assignment.mentor.lastName}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              Mentor
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemoveAssignment(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
};

export default MentorManagementPage; 