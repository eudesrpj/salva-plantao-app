import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ExternalLink, Copy, Plus, Trash2, MessageCircle, Sparkles, Zap } from "lucide-react";
import type { AiPrompt } from "@shared/schema";

const DEFAULT_PROMPTS = [
  { title: "Diagnóstico Diferencial", prompt: "Atue como um médico especialista. Dado os seguintes sintomas e achados clínicos, liste os diagnósticos diferenciais mais prováveis em ordem de probabilidade:\n\n[Descreva os sintomas aqui]", category: "diagnostico" },
  { title: "Conduta Terapêutica", prompt: "Atue como um médico plantonista experiente. Qual seria a conduta terapêutica inicial para um paciente com:\n\n[Descreva o quadro clínico]", category: "conduta" },
  { title: "Interpretação de Exames", prompt: "Atue como um médico especialista em medicina laboratorial. Interprete os seguintes resultados de exames:\n\n[Cole os resultados aqui]", category: "exames" },
  { title: "Resumo de Caso Clínico", prompt: "Faça um resumo estruturado do seguinte caso clínico, incluindo: dados relevantes, hipóteses diagnósticas e conduta sugerida:\n\n[Descreva o caso]", category: "resumo" },
  { title: "Prescrição Médica", prompt: "Sugira uma prescrição médica para um paciente adulto com:\n\n[Descreva diagnóstico e contexto]\n\nInclua: medicamentos, doses, via de administração, intervalo e duração.", category: "prescricao" },
  { title: "Orientações ao Paciente", prompt: "Crie orientações claras e simples para um paciente com:\n\n[Diagnóstico/Condição]\n\nIncluindo: cuidados em casa, sinais de alarme, quando retornar.", category: "orientacoes" },
];

export default function AiWebView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prompts");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ title: "", prompt: "", category: "" });

  const { data: savedPrompts = [] } = useQuery<AiPrompt[]>({
    queryKey: ["/api/ai-prompts"],
  });

  const createPromptMutation = useMutation({
    mutationFn: (data: typeof newPrompt) => apiRequest("POST", "/api/ai-prompts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-prompts"] });
      setIsAddDialogOpen(false);
      setNewPrompt({ title: "", prompt: "", category: "" });
      toast({ title: "Prompt salvo com sucesso" });
    },
  });

  const deletePromptMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ai-prompts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-prompts"] });
      toast({ title: "Prompt excluído" });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Prompt copiado!", description: "Cole no ChatGPT." });
  };

  const openChatGPT = (prompt?: string) => {
    const url = prompt 
      ? `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`
      : "https://chat.openai.com/";
    window.open(url, "_blank");
  };

  const allPrompts = [
    ...DEFAULT_PROMPTS.map((p, i) => ({ ...p, id: `default-${i}`, isDefault: true })),
    ...savedPrompts.map(p => ({ ...p, isDefault: false })),
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      diagnostico: "bg-blue-500/10 text-blue-500",
      conduta: "bg-green-500/10 text-green-500",
      exames: "bg-purple-500/10 text-purple-500",
      resumo: "bg-orange-500/10 text-orange-500",
      prescricao: "bg-red-500/10 text-red-500",
      orientacoes: "bg-cyan-500/10 text-cyan-500",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Assistente IA</h1>
          <p className="text-muted-foreground">Use prompts pré-definidos com o ChatGPT</p>
        </div>
        <Button onClick={() => openChatGPT()} variant="outline" data-testid="button-open-chatgpt">
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir ChatGPT
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-500" />
            <div>
              <p className="font-medium">Como usar</p>
              <p className="text-sm text-muted-foreground">
                Selecione um prompt abaixo, copie-o e cole no ChatGPT. 
                Você pode criar seus próprios prompts personalizados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prompts" data-testid="tab-prompts">
            <MessageCircle className="w-4 h-4 mr-2" />
            Prompts Prontos
          </TabsTrigger>
          <TabsTrigger value="meus" data-testid="tab-my-prompts">
            <Zap className="w-4 h-4 mr-2" />
            Meus Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEFAULT_PROMPTS.map((prompt, index) => (
              <Card key={index} className="hover-elevate cursor-pointer" data-testid={`card-prompt-${index}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{prompt.title}</CardTitle>
                    <Badge className={getCategoryColor(prompt.category)} variant="secondary">
                      {prompt.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {prompt.prompt.substring(0, 100)}...
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(prompt.prompt)} data-testid={`button-copy-${index}`}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copiar
                    </Button>
                    <Button size="sm" onClick={() => openChatGPT(prompt.prompt)} data-testid={`button-use-${index}`}>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meus" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-prompt">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Prompt
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Prompt</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Título do prompt"
                      value={newPrompt.title}
                      onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
                      data-testid="input-prompt-title"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Categoria (ex: diagnóstico, conduta)"
                      value={newPrompt.category}
                      onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                      data-testid="input-prompt-category"
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Texto do prompt..."
                      value={newPrompt.prompt}
                      onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                      rows={6}
                      data-testid="textarea-prompt-text"
                    />
                  </div>
                  <Button 
                    onClick={() => createPromptMutation.mutate(newPrompt)}
                    disabled={!newPrompt.title || !newPrompt.prompt || createPromptMutation.isPending}
                    data-testid="button-save-prompt"
                  >
                    Salvar Prompt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {savedPrompts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Você ainda não criou nenhum prompt personalizado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover-elevate" data-testid={`card-my-prompt-${prompt.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">{prompt.title}</CardTitle>
                      {prompt.category && (
                        <Badge variant="secondary">{prompt.category}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {prompt.promptText?.substring(0, 100)}...
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(prompt.promptText || "")} data-testid={`button-copy-my-${prompt.id}`}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePromptMutation.mutate(prompt.id)} data-testid={`button-delete-${prompt.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt Selecionado</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={selectedPrompt}
              onChange={(e) => setSelectedPrompt(e.target.value)}
              rows={8}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={() => copyToClipboard(selectedPrompt)}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button onClick={() => openChatGPT(selectedPrompt)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no ChatGPT
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
