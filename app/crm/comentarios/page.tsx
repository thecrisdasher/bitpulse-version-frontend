"use client";

import Sidebar from "@/components/Sidebar";
import ClientCommentsManager from "@/components/crm/ClientCommentsManager";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CrmComentariosPage() {
  const { hasRole } = useAuth();
  const canAccess = hasRole('admin') || hasRole('maestro');

  if (!canAccess) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p>No tienes permiso para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              Comentarios de Clientes
            </h1>
            <p className="text-muted-foreground">
              Gestiona comentarios y seguimiento del progreso de los clientes asignados.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl">
            <ClientCommentsManager showClientSelector={true} />
          </div>
        </main>
      </div>
    </div>
  );
} 