"use client"

import React from 'react';
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { ChatProvider } from "@/contexts/ChatContext";
import { useSearchParams } from "next/navigation";

const PageInner = () => {
  const params = useSearchParams();
  const support = params.get('support');
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1">
        <ChatInterface className="h-screen" />
      </div>
    </div>
  );
};

const ChatPage = () => {
  return (
    <ChatProvider>
      <PageInner />
    </ChatProvider>
  );
};

export default ChatPage; 