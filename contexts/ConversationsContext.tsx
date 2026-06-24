import { mockFixedConversations, mockSystemConversations } from '@/data/mockConversations';
import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Conversation = {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  lastMessage: string;
  date: string;
  providerData: any;
  unreadCount?: number;
};

type ConversationsContextType = {
  conversations: Conversation[];
  fixedConversations: Conversation[];
  addOrUpdateConversation: (provider: any, lastMessage: string) => void;
  getConversation: (providerId: string) => Conversation | undefined;
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(mockSystemConversations);
  const fixedConversations = mockFixedConversations;

  const addOrUpdateConversation = (provider: any, lastMessage: string) => {
    const isFixedConversation = fixedConversations.some((fc) => fc.providerId === provider.id);
    if (isFixedConversation) {
      return;
    }

    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.providerId === provider.id);
      
      const newConversation: Conversation = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `conv-${provider.id}`,
        providerId: provider.id,
        providerName: provider.name,
        providerImage: provider.image || '',
        lastMessage,
        date: 'agora',
        providerData: provider,
      };

      if (existingIndex >= 0) {
        // Update existing conversation and move to top
        const updated = [...prev];
        const updatedConversation = { ...updated[existingIndex], ...newConversation };
        updated.splice(existingIndex, 1);
        return [updatedConversation, ...updated];
      } else {
        // Add new conversation at top
        return [newConversation, ...prev];
      }
    });
  };

  const getConversation = (providerId: string) => {
    return conversations.find((c) => c.providerId === providerId);
  };

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        fixedConversations,
        addOrUpdateConversation,
        getConversation,
      }}
    >
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
}

