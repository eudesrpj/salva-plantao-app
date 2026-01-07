import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Key, Check, Trash2, TestTube } from "lucide-react";
import { CreatorFooter } from "@/components/CreatorFooter";

interface MaskedCredentials {
  id: number;
  userId: string;
  provider: string | null;
  maskedApiKey: string;
  model: string | null;
  isEnabled: boolean | null;
  lastTestedAt: Date | null;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Recomendado)" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Mais barato)" },
];

export default function AiSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [isTesting, setIsTesting] = useState(false);

  const { data: credentials, isLoading } = useQuery<MaskedCredentials | null>({
    queryKey: ["/api/ai/credentials"],
  });

  useEffect(() => {
    if (credentials?.model && !apiKey) {
      setModel(credentials.model);
    }
  }, [credentials?.model]);

  const saveMutation = useMutation({
    mutationFn: async (data: { apiKey: string; model: string }) => {
      const res = await apiRequest("POST", "/api/ai/credentials", { ...data, provider: "openai" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/credentials"] });
      toast({ title: "Salvo!", description: "Suas credenciais foram salvas com seguranca." });
      setApiKey("");
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar credenciais.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/ai/credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/credentials"] });
      toast({ title: "Removido", description: "Credenciais removidas." });
    },
  });

  const handleTest = async () => {
    if (!apiKey && !credentials) {
      toast({ title: "Erro", description: "Insira uma API key primeiro.", variant: "destructive" });
      return;
    }
    
    setIsTesting(true);
    try {
      if (apiKey) {
        const res = await apiRequest("POST", "/api/ai/test", { apiKey, model });
        const response = await res.json();
        
        if (response.success) {
          toast({ title: "Sucesso!", description: "Conexao com a IA funcionando!" });
        } else {
          toast({ title: "Falha", description: response.message, variant: "destructive" });
        }
      } else {
        const res = await apiRequest("POST", "/api/ai/test-stored", {});
        const response = await res.json();
        
        if (response.success) {
          toast({ title: "Sucesso!", description: "Conexao com a IA funcionando!" });
        } else {
          toast({ title: "Falha", description: response.message, variant: "destructive" });
        }
      }
    } catch (error: any) {
      toast({ title: "Erro", description: "Falha no teste de conexao.", variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey) {
      toast({ title: "Erro", description: "Insira sua API key.", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ apiKey, model });
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Minha IA Medica</h1>
          <p className="text-muted-foreground">Configure sua conta de IA para interconsultas.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Configuracao da API
          </CardTitle>
          <CardDescription>
            Conecte sua propria conta OpenAI. Sua chave e armazenada de forma criptografada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credentials && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Chave Atual</p>
                <p className="text-sm text-muted-foreground font-mono" data-testid="text-masked-key">
                  {credentials.maskedApiKey}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Modelo: {credentials.model}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {credentials.lastTestedAt && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> Testado
                  </span>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate()}
                  data-testid="button-delete-credentials"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nova API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              data-testid="input-api-key"
            />
            <p className="text-xs text-muted-foreground">
              Sua chave nunca aparece completa. Obtenha em platform.openai.com
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo de IA</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting || (!apiKey && !credentials)}
              data-testid="button-test"
            >
              <TestTube className="mr-2 h-4 w-4" />
              {isTesting ? "Testando..." : "Testar Conexao"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!apiKey || saveMutation.isPending}
              data-testid="button-save"
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Credenciais"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Aviso Legal:</strong> A IA e apenas uma ferramenta de apoio. 
            Todas as decisoes clinicas devem ser revisadas com julgamento medico profissional.
            O aplicativo nao armazena dados identificaveis dos pacientes.
          </p>
        </CardContent>
      </Card>

      <CreatorFooter />
    </div>
  );
}
