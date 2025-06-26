'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Bell, 
  Menu,
  Settings,
  HelpCircle,
  Coins,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/app/i18n/client';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  // Format PejeCoins as simulated USD
  const formatPejecoins = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  const { t } = useTranslation();
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pejecoins, setPejecoins] = useState(0);
  const { notes, refresh } = useNotifications();
  const notifications = notes.length;
  const router = useRouter();
  
  const isAdmin = hasRole('admin');
  const isMaestro = hasRole('maestro');
  
  // En una aplicación real, esto se obtendría de una API
  useEffect(() => {
    if (isAuthenticated) {
      // Simular pejecoins del usuario
      setPejecoins(user?.pejecoins || Math.floor(Math.random() * 5000) + 500);
    }
  }, [isAuthenticated, user]);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };
  
  let navigation: { name: string; href: string }[] = [];

  if (isAdmin) {
    navigation = [
      { name: 'Admin', href: '/admin' },
      { name: 'CRM', href: '/crm' },
      { name: 'Dólares', href: '/pejecoins' },
      { name: 'Chat', href: '/chat' },
    ];
  } else if (isMaestro) {
    navigation = [
      { name: 'Mercados', href: '/markets' },
      { name: 'Análisis Técnico', href: '/valores' },
      { name: 'Trending', href: '/trending' },
      { name: 'Chat en Vivo', href: '/chat' },

    ];
  } else {
    navigation = [
      { name: 'Dashboard', href: '/' },
      { name: 'Mercados', href: '/markets' },
      { name: 'Posiciones', href: '/posiciones-abiertas' },
      { name: 'Portfolio', href: '/portfolio' },
      { name: 'Estadísticas', href: '/statistics' },
      { name: 'Dólares', href: '/pejecoins' },
      { name: 'Chat', href: '/chat' },
    ];
  }
  
  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 justify-between items-center">
          {/* Logo y navegación principal */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold">₿</span>
              </div>
              <span className="text-lg font-bold hidden md:inline-block whitespace-nowrap">Mello Trader</span>
            </Link>
            
            {/* Navegación principal en escritorio */}
            <nav className="hidden md:flex ml-6 space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Botón de menú móvil */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:bg-muted"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Acciones y perfil */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                {/* Saldo de Pejecoins */}
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{formatPejecoins(pejecoins)}</span>
                </div>
                
                {/* Notificaciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notifications > 0 && (
                        <Badge 
                          className="absolute -top-1 -right-1 px-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-xs"
                          variant="default"
                        >
                          {notifications}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                    {notifications === 0 && (
                      <div className="p-4 text-center text-muted-foreground text-sm">Sin notificaciones</div>
                    )}
                    {notes.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col space-y-0.5 cursor-pointer" onClick={async () => {
                        await fetch(`/api/notifications/${n.id}`, { method: 'PATCH', credentials: 'include' });
                        refresh();
                        router.push(n.link);
                      }}>
                        <span className="font-medium">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{n.body}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            

            
            {/* Perfil de usuario */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.profilePicture || ''} alt={user?.firstName || 'Usuario'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {(isAdmin || isMaestro) && (
                      <Badge variant={isAdmin ? 'destructive' : 'outline'} className="mt-1">
                        {isAdmin ? 'Admin' : 'Maestro'}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Ayuda</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/auth">
                  <User className="mr-2 h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Menú móvil */}
      {isMobileMenuOpen && (
        <nav className="md:hidden py-3 px-4 border-t border-border">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            {isAuthenticated && (
              <li>
                <div className="flex justify-between items-center px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{formatPejecoins(pejecoins)}</span>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
} 