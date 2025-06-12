import React, { useState } from "react";
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
import { UserMinus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [participants, setParticipants] = useState<Participant[]>(
    initialParticipants
  );

  const isAdmin = user?.role === "admin";

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
      } else {
        toast.error(json.message || "Error eliminando participante");
      }
    } catch (err: any) {
      toast.error(err.message || "Error eliminando participante");
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
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantsModal; 