import { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Baby, 
  AlertTriangle, 
  Pill,
  Stethoscope,
  ClipboardList,
  MessageSquare,
  Brain,
  Loader2,
  RefreshCw
} from "lucide-react";

const PRESET_PROMPTS = [
  {
    id: "revisar-prescricao",
    icon: FileText,
    title: "Revisar Prescrição",
    prompt: `Você é um médico especialista. Por favor, revise a seguinte prescrição médica e verifique:
1. Dosagens adequadas
2. Interações medicamentosas
3. Contraindicações
4. Posologia correta

Prescrição:
[Cole a prescrição aqui]`,
  },
  {
    id: "orientacoes-paciente",
    icon: ClipboardList,
    title: "Gerar Orientações",
    prompt: `Você é um médico que precisa explicar orientações de alta hospitalar para um paciente de forma clara e simples. Gere orientações sobre:
1. Medicamentos (horários, doses, duração)
2. Sinais de alarme para retornar ao hospital
3. Cuidados gerais
4. Retorno ambulatorial

Diagnóstico/Condição:
[Descreva a condição do paciente]`,
  },
  {
    id: "dose-pediatrica",
    icon: Baby,
    title: "Ajustar Dose Pediátrica",
    prompt: `Você é um pediatra calculando doses de medicamentos. Por favor, ajuste a dose do seguinte medicamento para a criança:

Medicamento: [nome do medicamento]
Peso da criança: [peso em kg]
Idade: [idade]

Forneça:
1. Dose calculada por kg
2. Dose total por tomada
3. Intervalo recomendado
4. Forma farmacêutica mais adequada
5. Volume/comprimidos por dose`,
  },
  {
    id: "interacoes",
    icon: Pill,
    title: "Verificar Interações",
    prompt: `Você é um farmacologista clínico. Verifique possíveis interações medicamentosas entre os seguintes medicamentos:

Medicamentos:
1. [Medicamento 1]
2. [Medicamento 2]
3. [Adicione mais se necessário]

Por favor, classifique cada interação como:
- Leve
- Moderada
- Grave
- Contraindicada`,
  },
  {
    id: "diagnostico-diferencial",
    icon: Stethoscope,
    title: "Diagnóstico Diferencial",
    prompt: `Você é um clínico experiente. Ajude-me a elaborar diagnósticos diferenciais para o seguinte caso:

Queixa principal: [descreva]
História: [resuma a história clínica]
Exame físico: [achados relevantes]
Exames complementares: [se disponíveis]

Liste os diagnósticos diferenciais em ordem de probabilidade com justificativa.`,
  },
  {
    id: "sinais-alarme",
    icon: AlertTriangle,
    title: "Sinais de Alarme",
    prompt: `Você é um médico orientando um paciente sobre quando procurar atendimento de urgência. Gere uma lista clara de sinais de alarme para:

Condição: [descreva a condição/diagnóstico]

Inclua:
1. Sintomas que exigem retorno imediato
2. Sintomas que exigem retorno em 24-48h
3. O que é esperado/normal na evolução`,
  },
];

const CHATGPT_URL = "https://chat.openai.com";

type IframeStatus = "loading" | "loaded" | "error";

export default function AiAssistant() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>("loading");
  const [activeTab, setActiveTab] = useState<string>("webview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (iframeStatus === "loading") {
        setIframeStatus("error");
      }
    }, 8000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [iframeStatus]);

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIframeStatus("loaded");
  };

  const handleIframeError = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIframeStatus("error");
  };

  const retryIframe = () => {
    setIframeStatus("loading");
    if (iframeRef.current) {
      iframeRef.current.src = CHATGPT_URL;
    }
  };

  const getActivePrompt = useCallback(() => {
    if (selectedPrompt) {
      const preset = PRESET_PROMPTS.find(p => p.id === selectedPrompt);
      return preset?.prompt || "";
    }
    return customPrompt;
  }, [selectedPrompt, customPrompt]);

  const handleCopyPrompt = async () => {
    const prompt = getActivePrompt();
    if (!prompt) {
      toast({
        title: "Nenhum prompt selecionado",
        description: "Selecione um prompt ou escreva um personalizado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast({
        title: "Prompt copiado!",
        description: "Cole no ChatGPT para continuar.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o prompt.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChatGPT = () => {
    window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
  };

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPrompt(promptId === selectedPrompt ? null : promptId);
    setCustomPrompt("");
  };

  const handleCustomPromptChange = (value: string) => {
    setCustomPrompt(value);
    setSelectedPrompt(null);
  };

  const renderIframeContent = () => {
    if (iframeStatus === "loading") {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          <p className="text-muted-foreground">Carregando ChatGPT...</p>
          <p className="text-xs text-muted-foreground">
            Se não carregar em alguns segundos, use a aba "Prompts" ou abra em nova aba.
          </p>
        </div>
      );
    }

    if (iframeStatus === "error") {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <div>
            <p className="font-medium text-lg">ChatGPT não pode ser exibido aqui</p>
            <p className="text-muted-foreground text-sm mt-2">
              Por questões de segurança, o ChatGPT não permite ser carregado dentro de outros sites.
              Use os botões abaixo para acessar diretamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={retryIframe} variant="outline" data-testid="button-retry-iframe">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button
              onClick={handleOpenChatGPT}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-open-chatgpt-fallback"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir ChatGPT em Nova Aba
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Assistente IA</h1>
          <p className="text-muted-foreground text-sm">
            Use o ChatGPT com sua própria conta para consultas médicas
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="webview" data-testid="tab-webview">ChatGPT Integrado</TabsTrigger>
          <TabsTrigger value="prompts" data-testid="tab-prompts">Prompts Prontos</TabsTrigger>
        </TabsList>

        <TabsContent value="webview" className="flex-1 mt-4">
          <Card className="h-[calc(100vh-280px)] min-h-[400px]">
            <CardContent className="p-0 h-full relative">
              {renderIframeContent()}
              <iframe
                ref={iframeRef}
                src={CHATGPT_URL}
                className={`w-full h-full border-0 rounded-lg ${iframeStatus !== "loaded" ? "hidden" : ""}`}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="ChatGPT"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                data-testid="iframe-chatgpt"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="flex-1 mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prompts Pré-definidos
              </CardTitle>
              <CardDescription>
                Selecione um prompt pronto ou escreva o seu próprio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PRESET_PROMPTS.map((prompt) => {
                  const Icon = prompt.icon;
                  const isSelected = selectedPrompt === prompt.id;
                  return (
                    <Button
                      key={prompt.id}
                      variant={isSelected ? "default" : "outline"}
                      className="h-auto py-3 px-4 flex flex-col items-center gap-2 text-center"
                      onClick={() => handleSelectPrompt(prompt.id)}
                      data-testid={`button-prompt-${prompt.id}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{prompt.title}</span>
                    </Button>
                  );
                })}
              </div>

              {selectedPrompt && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">Prompt selecionado:</p>
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-background p-3 rounded-md border max-h-40 overflow-y-auto">
                      {PRESET_PROMPTS.find(p => p.id === selectedPrompt)?.prompt}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Ou escreva seu próprio prompt:</label>
                <Textarea
                  placeholder="Digite sua dúvida ou caso clínico aqui..."
                  value={customPrompt}
                  onChange={(e) => handleCustomPromptChange(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-custom-prompt"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Selecione um prompt pré-definido ou escreva o seu próprio</li>
                <li>Clique em "Copiar Prompt" para copiar o texto</li>
                <li>Clique em "Abrir ChatGPT" para abrir o site em uma nova aba</li>
                <li>Cole o prompt no ChatGPT e personalize conforme necessário</li>
                <li>Faça login com sua conta do ChatGPT e envie a mensagem</li>
              </ol>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleCopyPrompt}
                  variant="outline"
                  className="flex-1"
                  disabled={!selectedPrompt && !customPrompt}
                  data-testid="button-copy-prompt"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Prompt
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleOpenChatGPT}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-open-chatgpt"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir ChatGPT
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">Aviso Importante</p>
              <p className="text-muted-foreground mt-1">
                O ChatGPT é uma ferramenta de apoio. Sempre valide as informações com fontes 
                oficiais e use seu julgamento clínico. O uso de IA não substitui a avaliação 
                médica profissional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
