import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMinus, UserPlus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useChat } from "@/contexts/ChatContext";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
}

interface ParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  participants: Participant[];
}

const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  open,
  onOpenChange,
  groupId,
  participants: initialParticipants,
}) => {
  const { user } = useAuth();
  const initUnique = useMemo(() => {
    const map = new Map<string, Participant>();
    initialParticipants.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [initialParticipants]);

  const [participants, setParticipants] = useState<Participant[]>(initUnique);
  const [allUsers, setAllUsers] = useState<Participant[]>([]);
  const [search, setSearch] = useState("");

  const { loadRooms } = useChat();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!open || !isAdmin) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { credentials: "include" });
        const json = await res.json();
        if (json.users) {
          setAllUsers(json.users);
        }
      } catch (err) {
        console.error("Error fetching users", err);
      }
    })();
  }, [open, isAdmin]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(user?.role === 'admin' ? '/api/chat/rooms?scope=all' : '/api/chat/rooms', { credentials: 'include' });
        const json = await res.json();
        if (json.rooms) {
          const room = json.rooms.find((r: any) => r.id === groupId);
          if (room) {
            const unique = Array.from(new Map(room.participants.map((p: Participant) => [p.id, p] as [string, Participant])).values()) as Participant[];
            setParticipants(unique);
          }
        }
      } catch (err) {
        console.error('Error refrescando participantes', err);
      }
    })();
  }, [open, groupId, user?.role]);

  const availableUsers = useMemo(() => {
    const existingIds = new Set(participants.map((p) => p.id));
    return allUsers.filter((u) => !existingIds.has(u.id));
  }, [allUsers, participants]);

  const handleRemove = async (participantId: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(
        `/api/chat/groups/participant?id=${groupId}&userId=${participantId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const json = await res.json();
      if (json.success) {
        toast.success("Participante eliminado");
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
        loadRooms(true);
      } else {
        toast.error(json.message || "Error eliminando participante");
      }
    } catch (err: any) {
      toast.error(err.message || "Error eliminando participante");
    }
  };

  const handleAdd = async (participantId: string) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`/api/chat/groups/participant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ groupId, userId: participantId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Participante agregado");
        const newUser = json.participant || allUsers.find((u) => u.id === participantId);
        if (newUser) {
          setParticipants((prev) => [...prev, newUser]);
          loadRooms(true);
        }
      } else {
        toast.error(json.message || "Error agregando participante");
      }
    } catch (err: any) {
      toast.error(err.message || "Error agregando participante");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Participantes</DialogTitle>
          <DialogDescription>
            Lista de participantes del grupo. {isAdmin && "Puedes eliminar usuarios."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-64 pr-2">
          <div className="space-y-3">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.profilePicture} />
                    <AvatarFallback>{p.firstName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.role}</p>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={() => handleRemove(p.id)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {participants.length === 0 && (
              <p className="text-center text-muted-foreground text-sm mt-6">
                No hay participantes.
              </p>
            )}
          </div>
        </ScrollArea>

        {isAdmin && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Agregar participante</h4>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <ScrollArea className="h-40 pr-2 border rounded-md p-2">
              <div className="space-y-2">
                {availableUsers
                  .filter((u) => {
                    if (!search.trim()) return true;
                    const term = search.toLowerCase();
                    return (
                      u.firstName.toLowerCase().includes(term) ||
                      u.lastName.toLowerCase().includes(term)
                    );
                  })
                  .map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.role}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => handleAdd(u.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                {availableUsers.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">
                    Todos los usuarios están en el grupo.
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal; 