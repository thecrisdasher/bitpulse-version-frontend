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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: {
    id: string;
    name: string;
    participants: UserOption[];
  };
}

export default function GroupModal({ open, onOpenChange, group }: GroupModalProps) {
  const [name, setName] = useState(group?.name ?? "");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(group?.participants.map((u) => u.id) ?? [])
  );

  // Cargar usuarios cuando el modal se abra
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        const json = await res.json();
        if (json.users) {
          setUsers(json.users);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    })();
  }, [open]);

  const toggleUser = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre del grupo es obligatorio");
      return;
    }

    const body: any = {
      name: name.trim(),
      participantIds: Array.from(selected),
    };

    if (group) {
      body.groupId = group.id;
    }

    try {
      const res = await fetch("/api/chat/groups", {
        method: group ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(group ? "Grupo actualizado" : "Grupo creado");
        onOpenChange(false);
      } else {
        toast.error(json.message || "Error inesperado");
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{group ? "Editar Grupo" : "Crear Grupo"}</DialogTitle>
          <DialogDescription>
            {group
              ? "Modifica los detalles del grupo."
              : "Define un nombre y selecciona los participantes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nombre del grupo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <ScrollArea className="h-60 border rounded-md p-2">
            <div className="space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.has(u.id)}
                    onCheckedChange={() => toggleUser(u.id)}
                  />
                  <span>
                    {u.firstName} {u.lastName} – {u.role}
                  </span>
                </label>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{group ? "Guardar" : "Crear"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 