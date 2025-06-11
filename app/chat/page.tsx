"use client"

import React from 'react';
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import { ChatProvider } from "@/contexts/ChatContext";

const ChatPage = () => {
  return (
    <ChatProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1">
          <ChatInterface className="h-screen" />
        </div>
      </div>
    </ChatProvider>
  );
};

export default ChatPage; 