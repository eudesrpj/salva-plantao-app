import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // Create a temporary ID for this conversation (mock for now, ideally persist in backend first)
    // Since we don't have conversation listing in this MVP page, we'll create a conversation on the fly or pick ID 1
    // Ideally: Create conversation -> get ID -> stream message.
    // Simplifying: Assume ID 1 exists or use a fixed ID for "Quick Chat"
    
    // Actually, let's create a conversation first if needed, but for responsiveness, we'll try to just start
    // We'll assume a "Quick Chat" conversation ID 1 for MVP simplicity or create one.
    // Let's implement a quick create logic in useEffect or just use a default.
    // Better: Just stream.
    
    try {
      // First ensure a conversation exists
      let convId = 1; 
      // This is a bit hacky for MVP but works if we assume backend handles it or we seeded it.
      // Correct way: Fetch conversations, if empty create one.
      
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!res.ok) {
         // Maybe conversation 1 doesn't exist? Try creating one.
         const createRes = await fetch("/api/conversations", {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ title: "Interconsulta" })
         });
         if (createRes.ok) {
            const conv = await createRes.json();
            convId = conv.id;
            // Retry message
            const retryRes = await fetch(`/api/conversations/${convId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: userMessage }),
            });
            if(!retryRes.ok) throw new Error("Failed");
            
            // Handle stream
            await handleStream(retryRes);
         } else {
             throw new Error("Failed to start chat");
         }
      } else {
         await handleStream(res);
      }

    } catch (error) {
      toast({ title: "Erro", description: "Falha na comunicação com a IA.", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleStream = async (res: Response) => {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  const others = prev.slice(0, -1);
                  return [...others, { ...last, content: last.content + data.content }];
                });
              }
              if (data.done) {
                  setLoading(false);
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
      setLoading(false);
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm">
        <div className="p-2 bg-purple-100 rounded-lg">
           <Bot className="h-6 w-6 text-purple-600" />
        </div>
        <div>
           <h1 className="text-xl font-bold font-display text-slate-900">Interconsulta IA</h1>
           <p className="text-xs text-slate-500">Discuta casos clínicos e tire dúvidas.</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-20">
            <Bot className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Como posso ajudar no seu plantão hoje?</p>
            <p className="text-sm">Ex: "Qual a dose de adrenalina para choque anafilático?"</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
               <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                 <Bot className="h-5 w-5 text-white" />
               </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
            </div>
            {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
            )}
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
             <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                 <Bot className="h-5 w-5 text-white" />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 flex items-center">
                <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite seu caso clínico ou dúvida..." 
            className="flex-1 h-12 bg-slate-50 border-slate-200"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="h-12 w-12 shrink-0 bg-purple-600 hover:bg-purple-700" disabled={loading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
