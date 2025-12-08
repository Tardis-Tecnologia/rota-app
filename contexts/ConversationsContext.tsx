import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Conversation = {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  lastMessage: string;
  date: string;
  providerData: any;
};

type ConversationsContextType = {
  conversations: Conversation[];
  addOrUpdateConversation: (provider: any, lastMessage: string) => void;
  getConversation: (providerId: string) => Conversation | undefined;
};

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const addOrUpdateConversation = (provider: any, lastMessage: string) => {
    setConversations((prev) => {
      const existingIndex = prev.findIndex((c) => c.providerId === provider.id);
      
      const newConversation: Conversation = {
        id: `conv-${provider.id}`,
        providerId: provider.id,
        providerName: provider.name,
        providerImage: provider.image,
        lastMessage,
        date: 'agora',
        providerData: provider,
      };

      if (existingIndex >= 0) {
        // Update existing conversation and move to top
        const updated = [...prev];
        updated.splice(existingIndex, 1);
        return [newConversation, ...updated];
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

