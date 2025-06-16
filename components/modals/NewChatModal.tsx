"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface NewChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewChatModal({ open, onOpenChange }: NewChatModalProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("");
  const router = useRouter();

  // Cargar lista de usuarios al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users ?? []);
        } else {
          toast.error(data.error || "Error al cargar usuarios");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error al cargar usuarios");
      }
    })();
  }, [open]);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const handleStart = async () => {
    if (!selected) {
      toast.error("Selecciona un usuario");
      return;
    }
    // Crear/obtener sala mediante API
    try {
      const res = await fetch(`/api/chat/private?participant=${selected}`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error iniciando chat");
        return;
      }
    } catch (err: any) {
      toast.error(err.message || "Error iniciando chat");
    }

    // Navegar al chat
    router.push(`/chat?participant=${selected}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo chat</DialogTitle>
          <DialogDescription>Elige un usuario para iniciar conversación privada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ScrollArea className="h-64 border rounded-md p-2">
            <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-2">
                  <RadioGroupItem value={u.id} id={`usr-${u.id}`} />
                  <Label htmlFor={`usr-${u.id}`} className="cursor-pointer">
                    {u.firstName} {u.lastName} <span className="text-xs text-muted-foreground">({u.email})</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStart}>Iniciar chat</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 