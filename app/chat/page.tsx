"use client"

export const dynamic = "force-dynamic";

import React, { Suspense } from 'react';
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { ChatProvider } from "@/contexts/ChatContext";

function ChatPageInner() {
  return (
    <ChatProvider>
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
        <div className="flex-1">
          <Suspense>
          <ChatInterface className="h-screen" />
          </Suspense>
        </div>
      </div>
    </ChatProvider>
  );
}

export default function ChatPage() {
  return (
    <ChatPageInner />
  );
} 