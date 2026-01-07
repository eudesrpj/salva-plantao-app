import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Send, Loader2, Settings, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { AiPrompt } from "@shared/schema";
import { CreatorFooter } from "@/components/CreatorFooter";

interface MaskedCredentials {
  maskedApiKey: string;
  model: string | null;
  isEnabled: boolean | null;
}

export default function AiInterconsult() {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);

  const { data: credentials } = useQuery<MaskedCredentials | null>({
    queryKey: ["/api/ai/credentials"],
  });

  const { data: prompts } = useQuery<AiPrompt[]>({
    queryKey: ["/api/ai/prompts"],
  });

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; promptId?: number }) => {
      const res = await apiRequest("POST", "/api/ai/chat", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setResponse(data.response);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Falha na consulta com IA", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = () => {
    if (!message.trim()) {
      toast({ title: "Erro", description: "Digite o caso clinico.", variant: "destructive" });
      return;
    }

    chatMutation.mutate({
      message: message.trim(),
      promptId: selectedPromptId ? parseInt(selectedPromptId) : undefined,
    });
  };

  const hasCredentials = credentials && credentials.maskedApiKey;

  if (!hasCredentials) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Configure sua IA</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para usar a interconsulta com IA, voce precisa primeiro configurar sua chave de API.
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
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Interconsulta com IA</h1>
          <p className="text-muted-foreground">Consulte a IA para apoio em casos clinicos.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Descreva o Caso</CardTitle>
            <CardDescription>
              Escreva o caso clinico. Evite dados identificaveis do paciente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prompts && prompts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Consulta</label>
                <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
                  <SelectTrigger data-testid="select-prompt">
                    <SelectValue placeholder="Selecione um formato..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Consulta Geral</SelectItem>
                    {prompts.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Caso Clinico</label>
              <Textarea
                placeholder="Descreva o quadro clinico, sintomas, exames, hipoteses diagnosticas..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="resize-none"
                data-testid="textarea-case"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={chatMutation.isPending || !message.trim()}
              data-testid="button-submit"
            >
              {chatMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resposta da IA</CardTitle>
            <CardDescription>
              Modelo: {credentials?.model || "gpt-4o"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {response ? (
                <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="text-response">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{response}</pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-12">
                  <Brain className="h-12 w-12 mb-4 opacity-20" />
                  <p>A resposta da IA aparecera aqui.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Aviso:</strong> Conteudo gerado por IA e apoio, nao substitui o julgamento medico.
            Revise sempre as sugestoes antes de aplicar clinicamente.
            Nao insira dados identificaveis (nome, CPF) do paciente.
          </p>
        </CardContent>
      </Card>

      <CreatorFooter />
    </div>
  );
}
