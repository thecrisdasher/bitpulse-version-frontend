"use client"

import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, UserPlus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Eye, EyeOff, Copy, RefreshCw } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type SortField = 'name' | 'email' | 'role' | 'pejecoins' | 'status';
type SortDirection = 'asc' | 'desc';

export default function CrmUsersPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Estados para filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Estados para manejo de contraseñas
  const [passwordOption, setPasswordOption] = useState<'auto' | 'custom' | 'email'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Función para generar contraseña segura
  const generateSecurePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let password = "";
    
    // Asegurar al menos un carácter de cada tipo
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Mayúscula
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Minúscula
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Número
    password += "!@#$%&*"[Math.floor(Math.random() * 7)]; // Especial
    
    // Completar el resto
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Generar contraseña cuando se selecciona la opción automática
  useEffect(() => {
    if (passwordOption === 'auto') {
      setGeneratedPassword(generateSecurePassword());
    }
  }, [passwordOption, openDialog]);

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

  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 ml-1 text-primary" /> : 
      <ArrowDown className="w-4 h-4 ml-1 text-primary" />;
  };

  // Filtrar y ordenar usuarios
  const filteredAndSortedUsers = users
    .filter(user => {
      // Filtro de búsqueda
      const matchesSearch = searchTerm === '' || 
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de rol
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Filtro de estado
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'pejecoins':
          comparison = a.pejecoins - b.pejecoins;
          break;
        case 'status':
          comparison = Number(b.isActive) - Number(a.isActive);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

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
    setPasswordOption('auto');
    setCustomPassword('');
    setGeneratedPassword(generateSecurePassword());
    setShowPassword(false);
    setOpenDialog(true);
  };

  const submitCreate = async () => {
    if (!editingUser) return;
    
    let passwordToUse = '';
    let emailSubject = '';
    let emailBody = '';
    
    // Determinar qué contraseña usar
    switch (passwordOption) {
      case 'auto':
        passwordToUse = generatedPassword;
        emailSubject = 'Bienvenido a BitPulse - Credenciales de Acceso';
        emailBody = `Hola ${editingUser.firstName},\n\nTu cuenta ha sido creada exitosamente.\n\nCredenciales de acceso:\nEmail: ${editingUser.email}\nContraseña temporal: ${generatedPassword}\n\nPor favor, cambia tu contraseña en el primer inicio de sesión.\n\nSaludos,\nEquipo BitPulse`;
        break;
      case 'custom':
        passwordToUse = customPassword;
        emailSubject = 'Bienvenido a BitPulse - Credenciales de Acceso';
        emailBody = `Hola ${editingUser.firstName},\n\nTu cuenta ha sido creada exitosamente.\n\nCredenciales de acceso:\nEmail: ${editingUser.email}\nContraseña: ${customPassword}\n\nSaludos,\nEquipo BitPulse`;
        break;
      case 'email':
        passwordToUse = generateSecurePassword();
        emailSubject = 'Activación de Cuenta BitPulse';
        emailBody = `Hola ${editingUser.firstName},\n\nTu cuenta ha sido creada. Recibirás un email separado con las instrucciones para establecer tu contraseña.\n\nSaludos,\nEquipo BitPulse`;
        break;
    }

    if (passwordOption === 'custom' && !customPassword) {
      toast.error('Por favor ingresa una contraseña personalizada');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...editingUser,
          password: passwordToUse,
          passwordOption,
          emailSubject,
          emailBody
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Mostrar información de contraseña según la opción
        if (passwordOption === 'auto') {
          toast.success(
            `Usuario creado exitosamente. Contraseña temporal: ${generatedPassword}`,
            { duration: 10000 }
          );
        } else if (passwordOption === 'custom') {
          toast.success('Usuario creado exitosamente con contraseña personalizada');
        } else {
          toast.success('Usuario creado. Se enviarán instrucciones por email');
        }
        
        setOpenDialog(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Error');
      }
    } catch (e) {
      toast.error('Error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Contraseña copiada al portapapeles');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

          <div className="container mx-auto max-w-7xl space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="maestro">Maestro</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>
                      Mostrando {filteredAndSortedUsers.length} de {users.length} usuarios
                    </span>
                    {filteredAndSortedUsers.length > 1 && (
                      <span>
                        • Ordenado por {
                          sortField === 'name' ? 'nombre' :
                          sortField === 'email' ? 'email' :
                          sortField === 'role' ? 'rol' :
                          sortField === 'pejecoins' ? 'saldo' : 'estado'
                        } ({sortDirection === 'asc' ? 'ascendente' : 'descendente'})
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {canManage && (
              <div className="flex justify-end">
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
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Nombre
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center">
                          Email
                          {getSortIcon('email')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center">
                          Rol
                          {getSortIcon('role')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('pejecoins')}
                      >
                        <div className="flex items-center">
                          Dólares
                          {getSortIcon('pejecoins')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Estado
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers.length > 0 ? (
                      filteredAndSortedUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'maestro' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' :
                               user.role === 'maestro' ? 'Maestro' : 'Cliente'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(user.pejecoins)}
                          </TableCell>
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                            ? 'No se encontraron usuarios que coincidan con los filtros aplicados.'
                            : 'No hay usuarios registrados.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingUser?.id ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <Input 
                    value={editingUser.firstName} 
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})} 
                    placeholder="Ingresa el nombre"
                  />
                </div>
                <div>
                  <Label>Apellido</Label>
                  <Input 
                    value={editingUser.lastName} 
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})} 
                    placeholder="Ingresa el apellido"
                  />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={editingUser.email} 
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="maestro">Maestro</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Saldo en Dólares</Label>
                <Input 
                  type="number" 
                  value={editingUser.pejecoins} 
                  onChange={(e) => setEditingUser({...editingUser, pejecoins: parseInt(e.target.value) || 0})} 
                  placeholder="0"
                  min="0"
                />
                                 <p className="text-sm text-muted-foreground mt-1">
                   Capital de práctica para operaciones (formato: {formatCurrency(editingUser.pejecoins)})
                 </p>
               </div>
               
               {/* Configuración de Contraseña (solo para nuevos usuarios) */}
               {!editingUser.id && (
                 <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                   <Label className="text-base font-semibold">Configuración de Contraseña</Label>
                   
                   <div>
                     <Label>Método de Contraseña</Label>
                     <Select value={passwordOption} onValueChange={(value: 'auto' | 'custom' | 'email') => setPasswordOption(value)}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="auto">🎲 Generar automáticamente</SelectItem>
                         <SelectItem value="custom">✏️ Establecer manualmente</SelectItem>
                         <SelectItem value="email">📧 Enviar por email (próximamente)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   {passwordOption === 'auto' && (
                     <div>
                       <Label>Contraseña Generada</Label>
                       <div className="flex items-center gap-2">
                         <div className="relative flex-1">
                           <Input
                             type={showPassword ? "text" : "password"}
                             value={generatedPassword}
                             readOnly
                             className="pr-20"
                           />
                           <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => setShowPassword(!showPassword)}
                             >
                               {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                             </Button>
                             <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="h-6 w-6 p-0"
                               onClick={() => copyToClipboard(generatedPassword)}
                             >
                               <Copy className="w-3 h-3" />
                             </Button>
                           </div>
                         </div>
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => setGeneratedPassword(generateSecurePassword())}
                         >
                           <RefreshCw className="w-4 h-4" />
                         </Button>
                       </div>
                       <p className="text-sm text-muted-foreground mt-1">
                         La contraseña se mostrará al usuario y se enviará por email
                       </p>
                     </div>
                   )}

                   {passwordOption === 'custom' && (
                     <div>
                       <Label>Contraseña Personalizada</Label>
                       <div className="relative">
                         <Input
                           type={showPassword ? "text" : "password"}
                           value={customPassword}
                           onChange={(e) => setCustomPassword(e.target.value)}
                           placeholder="Ingresa una contraseña segura"
                           className="pr-10"
                         />
                         <Button
                           type="button"
                           variant="ghost"
                           size="sm"
                           className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                           onClick={() => setShowPassword(!showPassword)}
                         >
                           {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                         </Button>
                       </div>
                       <p className="text-sm text-muted-foreground mt-1">
                         Mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos
                       </p>
                     </div>
                   )}

                   {passwordOption === 'email' && (
                     <div className="p-3 bg-blue-50 rounded-lg">
                       <p className="text-sm text-blue-800">
                         📧 El usuario recibirá un email con un enlace para establecer su propia contraseña de forma segura.
                       </p>
                     </div>
                   )}
                 </div>
               )}
               
               <div>
                 <Label>Estado</Label>
                 <Select 
                   value={editingUser.isActive ? 'active' : 'inactive'} 
                   onValueChange={(value) => setEditingUser({...editingUser, isActive: value === 'active'})}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Seleccionar estado" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="active">Activo</SelectItem>
                     <SelectItem value="inactive">Inactivo</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col gap-3 flex-shrink-0 pt-4 border-t">
            {!editingUser?.id && passwordOption === 'auto' && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <div className="bg-yellow-100 p-1 rounded">
                    <Eye className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800">Importante:</p>
                    <p className="text-yellow-700">
                      Guarda la contraseña generada. Se mostrará una vez y luego será enviada al usuario por email.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {editingUser?.id ? (
                <Button onClick={handleSave}>Guardar Cambios</Button>
              ) : (
                <Button 
                  onClick={submitCreate}
                  disabled={passwordOption === 'custom' && !customPassword}
                >
                  {passwordOption === 'email' ? 'Crear y Enviar Email' : 'Crear Usuario'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 