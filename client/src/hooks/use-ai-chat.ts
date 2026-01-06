import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat(conversationId?: number) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load existing messages if conversationId is provided
  const { data: conversationData } = useQuery({
    queryKey: ['/api/conversations', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: !!conversationId
  });

  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(conversationData.messages.map((m: any) => ({
        role: m.role,
        content: m.content
      })));
    }
  }, [conversationData]);

  const sendMessage = async (content: string, activeConvId: number) => {
    setIsLoading(true);
    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', content }]);

    try {
      const response = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      // Handle SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.content) {
              assistantMessage += data.content;
              // Update last message
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = assistantMessage;
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao enviar mensagem', variant: 'destructive' });
      // Remove failed optimistic messages if strictly needed, 
      // but usually keeping them with an error state is better.
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });
}
