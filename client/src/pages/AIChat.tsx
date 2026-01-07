import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Users, Headset, MessageCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface MaskedCredentials {
  maskedApiKey: string;
  model: string | null;
  isEnabled: boolean | null;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

type Channel = "ai" | "interconsult" | "admin_support";

const CHANNEL_CONFIG = {
  ai: {
    icon: Bot,
    title: "Assistente IA",
    subtitle: "Tire dúvidas clínicas com IA médica.",
    color: "purple",
    placeholder: "Digite seu caso clínico ou dúvida...",
  },
  interconsult: {
    icon: Users,
    title: "Interconsulta",
    subtitle: "Discuta casos com outros médicos.",
    color: "blue",
    placeholder: "Descreva o caso para interconsulta...",
  },
  admin_support: {
    icon: Headset,
    title: "Suporte Admin",
    subtitle: "Entre em contato com o suporte.",
    color: "amber",
    placeholder: "Descreva sua dúvida ou problema...",
  },
};

export default function AIChat() {
  const [channel, setChannel] = useState<Channel>("ai");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credentials } = useQuery<MaskedCredentials | null>({
    queryKey: ["/api/ai/credentials"],
  });

  const hasCredentials = credentials && credentials.maskedApiKey;

  const config = CHANNEL_CONFIG[channel];
  const Icon = config.icon;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setMessages([]);
  }, [channel]);

  const { data: interconsultMessages } = useQuery({
    queryKey: ["/api/interconsult", channel],
    queryFn: async () => {
      const res = await fetch(`/api/interconsult?channel=${channel}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: channel !== "ai",
  });

  useEffect(() => {
    if (interconsultMessages && channel !== "ai") {
      const formatted = interconsultMessages.map((m: any) => ({
        role: m.senderId === user?.id ? "user" : "assistant",
        content: m.message,
        timestamp: new Date(m.createdAt),
      }));
      setMessages(formatted);
    }
  }, [interconsultMessages, channel, user?.id]);

  const sendInterconsultMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/interconsult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, message }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interconsult", channel] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    if (channel === "ai") {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Falha na comunicação");
        }

        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
        setLoading(false);
      } catch (error: any) {
        setMessages(prev => prev.slice(0, -1));
        toast({ 
          title: "Erro", 
          description: error.message || "Falha na comunicação com a IA.", 
          variant: "destructive" 
        });
        setLoading(false);
      }
    } else {
      sendInterconsultMutation.mutate(userMessage);
      setMessages(prev => [...prev, { 
        role: "system", 
        content: channel === "admin_support" 
          ? "Mensagem enviada para o suporte. Aguarde retorno." 
          : "Mensagem enviada para interconsulta. Aguardando resposta dos colegas."
      }]);
    }
  };

  const colorMap = {
    purple: { bg: "bg-purple-600", light: "bg-purple-100", text: "text-purple-600" },
    blue: { bg: "bg-blue-600", light: "bg-blue-100", text: "text-blue-600" },
    amber: { bg: "bg-amber-600", light: "bg-amber-100", text: "text-amber-600" },
  };
  const colors = colorMap[config.color as keyof typeof colorMap];

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${colors.light} rounded-lg`}>
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">{config.title}</h1>
            <p className="text-xs text-slate-500">{config.subtitle}</p>
          </div>
        </div>
        
        <Tabs value={channel} onValueChange={(v) => setChannel(v as Channel)} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="ai" className="gap-1" data-testid="tab-ai">
              <Bot className="h-4 w-4" /> IA
            </TabsTrigger>
            <TabsTrigger value="interconsult" className="gap-1" data-testid="tab-interconsult">
              <Users className="h-4 w-4" /> Interconsulta
            </TabsTrigger>
            <TabsTrigger value="admin_support" className="gap-1" data-testid="tab-support">
              <Headset className="h-4 w-4" /> Suporte
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {channel === "ai" && !hasCredentials && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <Card className="text-center py-12 max-w-md mx-auto">
              <CardContent className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Settings className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold">Configure sua IA</h2>
                <p className="text-muted-foreground">
                  Para usar o chat com IA, voce precisa primeiro configurar sua chave de API.
                </p>
                <Link href="/ai-settings">
                  <Button data-testid="button-configure-ai">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Minha IA
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        {messages.length === 0 && (channel !== "ai" || hasCredentials) && (
          <div className="text-center text-slate-400 mt-20">
            <Icon className="h-16 w-16 mx-auto mb-4 opacity-20" />
            {channel === "ai" && (
              <>
                <p className="text-lg font-medium">Como posso ajudar no seu plantão hoje?</p>
                <p className="text-sm">Ex: "Qual a dose de adrenalina para choque anafilático?"</p>
              </>
            )}
            {channel === "interconsult" && (
              <>
                <p className="text-lg font-medium">Discuta casos com outros médicos</p>
                <p className="text-sm">Descreva o caso clínico para obter uma segunda opinião.</p>
              </>
            )}
            {channel === "admin_support" && (
              <>
                <p className="text-lg font-medium">Precisa de ajuda?</p>
                <p className="text-sm">Envie sua dúvida ou relate um problema técnico.</p>
              </>
            )}
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className={`h-8 w-8 rounded-full ${msg.role === "system" ? "bg-slate-400" : colors.bg} flex items-center justify-center shrink-0`}>
                {msg.role === "system" ? (
                  <MessageCircle className="h-5 w-5 text-white" />
                ) : (
                  <Icon className="h-5 w-5 text-white" />
                )}
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none" 
                : msg.role === "system"
                  ? "bg-slate-200 text-slate-600 italic rounded-bl-none"
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
            <div className={`h-8 w-8 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 flex items-center">
              <Loader2 className={`h-5 w-5 ${colors.text} animate-spin`} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={channel === "ai" && !hasCredentials ? "Configure sua IA primeiro..." : config.placeholder}
            className="flex-1 h-12 bg-slate-50 border-slate-200"
            disabled={loading || (channel === "ai" && !hasCredentials)}
            data-testid="input-chat-message"
          />
          <Button 
            type="submit" 
            size="icon" 
            className={`h-12 w-12 shrink-0 ${colors.bg} hover:opacity-90`} 
            disabled={loading || (channel === "ai" && !hasCredentials)}
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
