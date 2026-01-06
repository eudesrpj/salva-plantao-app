import { useState, useRef, useEffect } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { useAIChat, useCreateConversation } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

export default function AIChat() {
  const [input, setInput] = useState("");
  // For MVP, we'll use a single conversation ID (e.g., 1) or create one on the fly. 
  // Ideally this page lists conversations on the left.
  // We'll mock a convo ID = 1 for simplicity if listing isn't built yet.
  const [activeConvId, setActiveConvId] = useState<number>(1);
  const { messages, sendMessage, isLoading } = useAIChat(activeConvId);
  const createConv = useCreateConversation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-create initial conversation if needed
  useEffect(() => {
    // In a real app, check if conv 1 exists or fetch list.
    // For this demo, we assume ID 1 exists or backend creates it gracefully.
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    await sendMessage(text, activeConvId);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col md:pl-64 h-full relative">
        
        {/* Chat Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">Interconsulta IA</h1>
              <p className="text-xs text-slate-500">Tire dúvidas clínicas baseadas em protocolos.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => createConv.mutate("Nova Consulta")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
              <Bot className="h-16 w-16 mb-4" />
              <p>Inicie uma conversa...</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-4 max-w-3xl mx-auto",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm text-sm leading-relaxed prose prose-sm max-w-none",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white border border-slate-100 rounded-tl-none text-slate-800"
                )}>
                  {msg.content ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>
              </div>
            ))
          )}
          <div className="pb-20 md:pb-0" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t pb-safe md:pb-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Descreva o caso clínico ou faça uma pergunta..."
              className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all h-12 rounded-xl"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            A IA pode cometer erros. Sempre verifique informações críticas.
          </p>
        </div>
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}
