"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string;
  createdAt: string;
};

interface NotificationCtx {
  notes: NotificationItem[];
  refresh: () => void;
}

const NotificationContext = createContext<NotificationCtx>({ notes: [], refresh: () => {} });
export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<NotificationItem[]>([]);

  const refresh = async () => {
    try {
      const r = await fetch("/api/notifications", { credentials: "include" });
      if (r.ok) {
        const j = await r.json();
        setNotes(j.notifications as NotificationItem[]);
      }
    } catch {}
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <NotificationContext.Provider value={{ notes, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
} 