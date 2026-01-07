import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Ban, ShieldAlert, Save, Users, Settings, FileText, CreditCard, BarChart3, Bot, Plus, Trash2, Pencil } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/models/auth";

interface AdminSetting {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Painel Administrativo</h1>
          <p className="text-slate-500">Gerencie usuários, conteúdo e configurações.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1">
            <CreditCard className="h-4 w-4" /> Pagamento
          </TabsTrigger>
          <TabsTrigger value="ai-prompts" className="gap-1">
            <Bot className="h-4 w-4" /> IA
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1">
            <FileText className="h-4 w-4" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1">
            <BarChart3 className="h-4 w-4" /> Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettingsTab />
        </TabsContent>

        <TabsContent value="ai-prompts">
          <AiPromptsTab />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab />
        </TabsContent>

        <TabsContent value="stats">
          <StatsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Permissão atualizada!" });
    },
  });

  if (isLoading) return <div className="flex justify-center p-8"><PageLoader text="Carregando usuários..." /></div>;

  const activeUsers = users?.filter(u => u.status === "active").length || 0;
  const pendingUsers = users?.filter(u => u.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Usuários</CardDescription>
            <CardTitle className="text-3xl">{users?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{activeUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{pendingUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
          <CardDescription>Libere ou bloqueie acesso dos usuários.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      {user.firstName} {user.lastName}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'} 
                      className={user.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                      {user.status === 'active' ? 'Ativo' : user.status === 'blocked' ? 'Bloqueado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.status !== 'active' && (
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                          data-testid={`button-activate-${user.id}`}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Liberar
                        </Button>
                      )}
                      {user.status === 'active' && (
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => updateStatus.mutate({ id: user.id, status: 'blocked' })}
                          data-testid={`button-block-${user.id}`}>
                          <Ban className="w-4 h-4 mr-1" /> Bloquear
                        </Button>
                      )}
                      {user.role !== 'admin' && (
                        <Button size="sm" variant="ghost" title="Tornar Admin"
                          onClick={() => updateRole.mutate({ id: user.id, role: 'admin' })}>
                          <ShieldAlert className="w-4 h-4 text-slate-400" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSettingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: settings, isLoading } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const getSetting = (key: string) => settings?.find(s => s.key === key)?.value || "";

  const [pixKey, setPixKey] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [price, setPrice] = useState("");
  const [instructions, setInstructions] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setPixKey(getSetting("pix_key"));
      setWhatsapp(getSetting("whatsapp_number"));
      setPrice(getSetting("subscription_price"));
      setInstructions(getSetting("payment_instructions"));
      setAiPrompt(getSetting("ai_prompt"));
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Configuração salva!" });
    },
  });

  const handleSaveAll = () => {
    saveMutation.mutate({ key: "pix_key", value: pixKey });
    saveMutation.mutate({ key: "whatsapp_number", value: whatsapp });
    saveMutation.mutate({ key: "subscription_price", value: price });
    saveMutation.mutate({ key: "payment_instructions", value: instructions });
    saveMutation.mutate({ key: "ai_prompt", value: aiPrompt });
  };

  if (isLoading) return <div className="flex justify-center p-8"><PageLoader text="Carregando configurações..." /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" /> Configurações de Pagamento
          </CardTitle>
          <CardDescription>Configure as informações de pagamento exibidas para novos usuários.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chave Pix</label>
              <Input 
                value={pixKey} 
                onChange={(e) => setPixKey(e.target.value)} 
                placeholder="CNPJ, Email ou Telefone"
                data-testid="input-pix-key"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número WhatsApp (com DDI)</label>
              <Input 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)} 
                placeholder="5511999999999"
                data-testid="input-whatsapp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor da Assinatura (R$)</label>
            <Input 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              placeholder="29,90"
              data-testid="input-price"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Instruções de Pagamento</label>
            <Textarea 
              value={instructions} 
              onChange={(e) => setInstructions(e.target.value)} 
              placeholder="Instruções exibidas para o usuário..."
              rows={3}
              data-testid="textarea-instructions"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Configurações da IA
          </CardTitle>
          <CardDescription>Defina o comportamento do assistente de IA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt do Sistema</label>
            <Textarea 
              value={aiPrompt} 
              onChange={(e) => setAiPrompt(e.target.value)} 
              placeholder="Você é um assistente médico..."
              rows={5}
              data-testid="textarea-ai-prompt"
            />
            <p className="text-xs text-slate-500">Este texto define o comportamento da IA nas conversas.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-settings">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>
    </div>
  );
}

function ContentTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [appName, setAppName] = useState("Salva Plantão");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [footerText, setFooterText] = useState("");
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [enableDarkMode, setEnableDarkMode] = useState(true);

  const { data: settings, isLoading } = useQuery<AdminSetting[]>({
    queryKey: ["/api/admin/settings"],
  });

  useEffect(() => {
    if (settings) {
      const getSetting = (key: string) => settings.find(s => s.key === key)?.value || "";
      setAppName(getSetting("app_name") || "Salva Plantão");
      setWelcomeMessage(getSetting("welcome_message"));
      setFooterText(getSetting("footer_text"));
      setTermsUrl(getSetting("terms_url"));
      setPrivacyUrl(getSetting("privacy_url"));
      setSupportEmail(getSetting("support_email"));
      setPrimaryColor(getSetting("primary_color") || "#3b82f6");
      setEnableDarkMode(getSetting("enable_dark_mode") !== "false");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const res = await apiRequest("POST", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
  });

  const handleSaveAll = async () => {
    const settingsToSave = [
      { key: "app_name", value: appName },
      { key: "welcome_message", value: welcomeMessage },
      { key: "footer_text", value: footerText },
      { key: "terms_url", value: termsUrl },
      { key: "privacy_url", value: privacyUrl },
      { key: "support_email", value: supportEmail },
      { key: "primary_color", value: primaryColor },
      { key: "enable_dark_mode", value: enableDarkMode.toString() },
    ];

    try {
      for (const setting of settingsToSave) {
        await saveMutation.mutateAsync(setting);
      }
      toast({ title: "Configurações salvas!", description: "Todas as configurações de layout foram atualizadas." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><PageLoader text="Carregando configurações..." /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Configurações da Interface
          </CardTitle>
          <CardDescription>Personalize a aparência e textos do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do App</label>
              <Input 
                value={appName} 
                onChange={(e) => setAppName(e.target.value)} 
                placeholder="Salva Plantão"
                data-testid="input-app-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email de Suporte</label>
              <Input 
                value={supportEmail} 
                onChange={(e) => setSupportEmail(e.target.value)} 
                placeholder="suporte@exemplo.com"
                data-testid="input-support-email"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensagem de Boas-Vindas</label>
            <Textarea 
              value={welcomeMessage} 
              onChange={(e) => setWelcomeMessage(e.target.value)} 
              placeholder="Bem-vindo ao sistema! Aqui você encontra..."
              rows={2}
              data-testid="textarea-welcome-message"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Texto do Rodapé</label>
            <Input 
              value={footerText} 
              onChange={(e) => setFooterText(e.target.value)} 
              placeholder="© 2025 Salva Plantão. Todos os direitos reservados."
              data-testid="input-footer-text"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aparência e Layout</CardTitle>
          <CardDescription>Personalize cores e tema do aplicativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor Primária</label>
              <div className="flex gap-2">
                <Input 
                  type="color"
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  className="w-16 h-9 p-1 cursor-pointer"
                  data-testid="input-primary-color"
                />
                <Input 
                  value={primaryColor} 
                  onChange={(e) => setPrimaryColor(e.target.value)} 
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Modo Escuro</label>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox 
                  id="enableDarkMode" 
                  checked={enableDarkMode} 
                  onCheckedChange={(checked) => setEnableDarkMode(checked === true)}
                  data-testid="checkbox-dark-mode"
                />
                <label htmlFor="enableDarkMode" className="text-sm cursor-pointer">
                  Permitir alternância de tema (claro/escuro)
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links Legais</CardTitle>
          <CardDescription>Configure URLs para termos e políticas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL dos Termos de Uso</label>
              <Input 
                value={termsUrl} 
                onChange={(e) => setTermsUrl(e.target.value)} 
                placeholder="https://seusite.com/termos"
                data-testid="input-terms-url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">URL da Política de Privacidade</label>
              <Input 
                value={privacyUrl} 
                onChange={(e) => setPrivacyUrl(e.target.value)} 
                placeholder="https://seusite.com/privacidade"
                data-testid="input-privacy-url"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ContentManagementSection />

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={saveMutation.isPending} className="gap-2" data-testid="button-save-layout">
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configurações de Layout"}
        </Button>
      </div>
    </div>
  );
}

function StatsTab() {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Prescrições Copiadas</CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consultas IA</CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Protocolos Visualizados</CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flashcards Estudados</CardDescription>
            <CardTitle className="text-3xl">--</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <p className="text-sm text-slate-500 text-center">
        As estatísticas de uso serão implementadas na próxima versão.
      </p>
    </div>
  );
}

interface AiPrompt {
  id: number;
  title: string;
  description: string | null;
  promptText: string;
  category: string | null;
  isActive: boolean | null;
  createdBy: string | null;
  createdAt: string | null;
}

function AiPromptsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<AiPrompt | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { data: prompts, isLoading } = useQuery<AiPrompt[]>({
    queryKey: ["/api/admin/ai/prompts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; promptText: string; category: string; isActive: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/ai/prompts", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ai/prompts"] });
      toast({ title: "Prompt criado!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar prompt", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AiPrompt> }) => {
      const res = await apiRequest("PUT", `/api/admin/ai/prompts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ai/prompts"] });
      toast({ title: "Prompt atualizado!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar prompt", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/ai/prompts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/ai/prompts"] });
      toast({ title: "Prompt removido!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover prompt", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPromptText("");
    setCategory("");
    setIsActive(true);
    setEditingPrompt(null);
  };

  const openEditDialog = (prompt: AiPrompt) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setDescription(prompt.description || "");
    setPromptText(prompt.promptText);
    setCategory(prompt.category || "");
    setIsActive(prompt.isActive !== false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!title || !promptText) {
      toast({ title: "Preencha titulo e texto do prompt", variant: "destructive" });
      return;
    }

    const data = { title, description, promptText, category, isActive };
    
    if (editingPrompt) {
      updateMutation.mutate({ id: editingPrompt.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><PageLoader text="Carregando prompts..." /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Prompts da IA Médica
            </CardTitle>
            <CardDescription>Crie e gerencie os prompts pré-definidos para consultas médicas com IA.</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-prompt">
                <Plus className="h-4 w-4" /> Novo Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPrompt ? "Editar Prompt" : "Novo Prompt"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Titulo</label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Diagnóstico Diferencial"
                      data-testid="input-prompt-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Input 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ex: Cardiologia"
                      data-testid="input-prompt-category"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve descrição do uso deste prompt"
                    data-testid="input-prompt-description"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Texto do Prompt</label>
                  <Textarea 
                    value={promptText} 
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Você é um especialista médico. Analise o caso clínico apresentado..."
                    rows={6}
                    data-testid="textarea-prompt-text"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este texto será usado como instrução do sistema para a IA durante as consultas.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="isActive" 
                    checked={isActive} 
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                    data-testid="input-prompt-active"
                  />
                  <label htmlFor="isActive" className="text-sm cursor-pointer">Ativo (visível para usuários)</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-prompt"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {prompts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum prompt criado ainda. Clique em "Novo Prompt" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts?.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prompt.title}</div>
                        {prompt.description && (
                          <div className="text-sm text-muted-foreground">{prompt.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {prompt.category ? (
                        <Badge variant="secondary">{prompt.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={prompt.isActive !== false ? "default" : "secondary"}>
                        {prompt.isActive !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => openEditDialog(prompt)}
                          data-testid={`button-edit-prompt-${prompt.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(prompt.id)}
                          data-testid={`button-delete-prompt-${prompt.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas para Prompts Médicos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Exemplos de prompts úteis:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Diagnóstico Diferencial:</strong> "Analise os sintomas e sugira diagnósticos diferenciais ordenados por probabilidade."</li>
            <li><strong>Revisão de Prescrição:</strong> "Verifique interações medicamentosas e ajustes de dose para função renal/hepática."</li>
            <li><strong>Orientação para Emergência:</strong> "Forneça conduta inicial para o quadro clínico apresentado no contexto de PS."</li>
            <li><strong>Interpretação de Exames:</strong> "Interprete os resultados laboratoriais no contexto clínico do paciente."</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ContentManagementSection() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: prescriptions, isLoading: loadingPrescriptions } = useQuery<any[]>({
    queryKey: ["/api/prescriptions"],
    enabled: activeSection === "prescriptions",
  });

  const { data: protocols, isLoading: loadingProtocols } = useQuery<any[]>({
    queryKey: ["/api/protocols"],
    enabled: activeSection === "protocols",
  });

  const { data: pathologies, isLoading: loadingPathologies } = useQuery<any[]>({
    queryKey: ["/api/pathologies"],
    enabled: activeSection === "pathologies",
  });

  const deletePrescription = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/prescriptions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Prescrição removida!" });
    },
  });

  const deleteProtocol = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protocols/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: "Protocolo removido!" });
    },
  });

  const deletePathology = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pathologies/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ title: "Patologia removida!" });
    },
  });

  if (activeSection === "prescriptions") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Prescrições Oficiais</CardTitle>
            <CardDescription>Gerencie modelos de prescrições do sistema.</CardDescription>
          </div>
          <div className="flex gap-2">
            <NewPrescriptionDialog />
            <Button variant="outline" onClick={() => setActiveSection(null)}>Voltar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPrescriptions ? (
            <PageLoader text="Carregando prescrições..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Medicação</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions?.filter(p => p.isPublic || p.isLocked).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.medication || "-"}</TableCell>
                    <TableCell>{p.category || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.isPublic && <Badge variant="secondary">Oficial</Badge>}
                        {p.isLocked && <Badge variant="outline">Bloqueado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePrescription.mutate(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!prescriptions || prescriptions.filter(p => p.isPublic || p.isLocked).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma prescrição oficial encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeSection === "protocols") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Protocolos Clínicos</CardTitle>
            <CardDescription>Gerencie protocolos oficiais do sistema.</CardDescription>
          </div>
          <div className="flex gap-2">
            <NewProtocolDialog />
            <Button variant="outline" onClick={() => setActiveSection(null)}>Voltar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProtocols ? (
            <PageLoader text="Carregando protocolos..." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {protocols?.filter(p => p.isPublic || p.isLocked).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.specialty || "-"}</TableCell>
                    <TableCell>{p.category || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.isPublic && <Badge variant="secondary">Oficial</Badge>}
                        {p.isLocked && <Badge variant="outline">Bloqueado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProtocol.mutate(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!protocols || protocols.filter(p => p.isPublic || p.isLocked).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum protocolo oficial encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  if (activeSection === "medications") {
    return <MedicationLibraryManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === "pathologies") {
    return <PathologyManagement onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("prescriptions")}>
        <CardHeader>
          <CardTitle className="text-lg">Prescrições Oficiais</CardTitle>
          <CardDescription>Gerencie modelos de prescrições.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" data-testid="button-manage-prescriptions">Gerenciar</Button>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("protocols")}>
        <CardHeader>
          <CardTitle className="text-lg">Protocolos</CardTitle>
          <CardDescription>Edite protocolos clínicos oficiais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" data-testid="button-manage-protocols">Gerenciar</Button>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("medications")}>
        <CardHeader>
          <CardTitle className="text-lg">Medicações</CardTitle>
          <CardDescription>Biblioteca de medicamentos reutilizáveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" data-testid="button-manage-medications">Gerenciar</Button>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveSection("pathologies")}>
        <CardHeader>
          <CardTitle className="text-lg">Patologias</CardTitle>
          <CardDescription>Gerencie patologias e selecione medicações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" data-testid="button-manage-pathologies">Gerenciar</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PathologyManagement({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPathology, setSelectedPathology] = useState<any>(null);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [pathologyName, setPathologyName] = useState("");
  const [pathologyDescription, setPathologyDescription] = useState("");
  const [pathologyCategory, setPathologyCategory] = useState("");
  const [pathologyAgeGroup, setPathologyAgeGroup] = useState("adulto");
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("");

  const { data: pathologies, isLoading } = useQuery<any[]>({
    queryKey: ["/api/pathologies"],
  });

  const { data: pathologyMeds } = useQuery<any[]>({
    queryKey: ["/api/pathologies", selectedPathology?.id, "medications"],
    enabled: !!selectedPathology,
  });

  const { data: libraryMedications } = useQuery<any[]>({
    queryKey: ["/api/medications"],
  });

  const createPathology = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/pathologies", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ title: "Patologia criada!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar patologia", variant: "destructive" });
    },
  });

  const deletePathology = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pathologies/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ title: "Patologia removida!" });
      setSelectedPathology(null);
    },
  });

  const addMedicationFromLibrary = useMutation({
    mutationFn: async (medicationId: number) => {
      const libMed = libraryMedications?.find(m => m.id === medicationId);
      if (!libMed) throw new Error("Medication not found");
      const res = await apiRequest("POST", `/api/pathologies/${selectedPathology.id}/medications`, {
        medicationId: libMed.id,
        medication: libMed.name,
        dose: libMed.dose,
        dosePerKg: libMed.dosePerKg,
        maxDose: libMed.maxDose,
        interval: libMed.interval,
        duration: libMed.duration,
        route: libMed.route,
        quantity: libMed.quantity,
        timing: libMed.timing,
        observations: libMed.observations,
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies", selectedPathology.id, "medications"] });
      toast({ title: "Medicação adicionada!" });
      setMedicationDialogOpen(false);
      setSelectedMedicationId("");
    },
    onError: () => {
      toast({ title: "Erro ao adicionar medicação", variant: "destructive" });
    },
  });

  const deleteMedication = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pathology-medications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies", selectedPathology.id, "medications"] });
      toast({ title: "Medicação removida!" });
    },
  });

  const resetForm = () => {
    setPathologyName("");
    setPathologyDescription("");
    setPathologyCategory("");
    setPathologyAgeGroup("adulto");
  };

  const handleCreatePathology = () => {
    if (!pathologyName) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    createPathology.mutate({
      name: pathologyName,
      description: pathologyDescription,
      category: pathologyCategory,
      ageGroup: pathologyAgeGroup,
      isPublic: true,
      isLocked: true,
    });
  };

  const handleAddMedication = () => {
    if (!selectedMedicationId) {
      toast({ title: "Selecione uma medicação", variant: "destructive" });
      return;
    }
    addMedicationFromLibrary.mutate(Number(selectedMedicationId));
  };

  if (isLoading) return <PageLoader text="Carregando patologias..." />;

  if (selectedPathology) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{selectedPathology.name}</CardTitle>
            <CardDescription>Gerencie as medicações desta patologia</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={medicationDialogOpen} onOpenChange={(open) => { setMedicationDialogOpen(open); if (!open) setSelectedMedicationId(""); }}>
              <DialogTrigger asChild>
                <Button className="gap-1" data-testid="button-add-medication">
                  <Plus className="h-4 w-4" /> Adicionar Medicação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Selecionar Medicação da Biblioteca</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {libraryMedications && libraryMedications.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione uma medicação *</label>
                        <select 
                          value={selectedMedicationId} 
                          onChange={(e) => setSelectedMedicationId(e.target.value)}
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                          data-testid="select-medication"
                        >
                          <option value="">-- Escolha uma medicação --</option>
                          {libraryMedications.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} {m.presentation && `(${m.presentation})`} - {m.dose || "sem dose"} {m.route || ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedMedicationId && (
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {(() => {
                            const med = libraryMedications.find(m => m.id === Number(selectedMedicationId));
                            if (!med) return null;
                            return (
                              <div className="space-y-1">
                                <p><strong>{med.name}</strong></p>
                                {med.dose && <p>Dose: {med.dose}</p>}
                                {med.interval && <p>Intervalo: {med.interval}</p>}
                                {med.duration && <p>Duração: {med.duration}</p>}
                                {med.route && <p>Via: {med.route}</p>}
                                {med.quantity && <p>Quantidade: {med.quantity}</p>}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setMedicationDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleAddMedication} disabled={addMedicationFromLibrary.isPending || !selectedMedicationId}>
                          {addMedicationFromLibrary.isPending ? "Adicionando..." : "Adicionar à Patologia"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Nenhuma medicação na biblioteca.</p>
                      <p className="text-sm mt-2">Vá para "Medicações" no menu anterior para criar medicamentos primeiro.</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setSelectedPathology(null)}>Voltar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {pathologyMeds && pathologyMeds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicação</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Via</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pathologyMeds.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.medication}</TableCell>
                    <TableCell>{m.dose || "-"} {m.dosePerKg && `(${m.dosePerKg}/kg)`}</TableCell>
                    <TableCell>{m.interval || "-"}</TableCell>
                    <TableCell>{m.route || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMedication.mutate(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma medicação cadastrada. Clique em "Adicionar Medicação" para selecionar da biblioteca.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Patologias e Medicações</CardTitle>
          <CardDescription>Gerencie patologias com suas medicações associadas.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-1" data-testid="button-add-pathology">
                <Plus className="h-4 w-4" /> Nova Patologia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Patologia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Patologia *</label>
                  <Input 
                    value={pathologyName} 
                    onChange={(e) => setPathologyName(e.target.value)}
                    placeholder="Ex: Pneumonia Adquirida na Comunidade"
                    data-testid="input-pathology-name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea 
                    value={pathologyDescription} 
                    onChange={(e) => setPathologyDescription(e.target.value)}
                    placeholder="Descrição breve da patologia..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Input 
                      value={pathologyCategory} 
                      onChange={(e) => setPathologyCategory(e.target.value)}
                      placeholder="Ex: Infecciosas"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faixa Etária</label>
                    <select 
                      value={pathologyAgeGroup} 
                      onChange={(e) => setPathologyAgeGroup(e.target.value)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="adulto">Adulto</option>
                      <option value="pediatrico">Pediátrico</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreatePathology} disabled={createPathology.isPending}>
                    {createPathology.isPending ? "Salvando..." : "Criar Patologia"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={onBack}>Voltar</Button>
        </div>
      </CardHeader>
      <CardContent>
        {pathologies && pathologies.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patologia</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Faixa Etária</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pathologies.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPathology(p)}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category || "-"}</TableCell>
                  <TableCell>{p.ageGroup === "pediatrico" ? "Pediátrico" : "Adulto"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.isPublic && <Badge variant="secondary">Pública</Badge>}
                      {p.isLocked && <Badge variant="outline">Bloqueada</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePathology.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma patologia cadastrada. Clique em "Nova Patologia" para começar.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MedicationLibraryManagement({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: medicationsList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/medications"],
  });

  const createMedication = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/medications", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medicação criada!" });
      setDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar medicação", variant: "destructive" });
    },
  });

  const deleteMedication = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medicação removida!" });
    },
  });

  const handleCreateMedication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMedication.mutate({
      name: formData.get("name"),
      presentation: formData.get("presentation"),
      dose: formData.get("dose"),
      dosePerKg: formData.get("dosePerKg"),
      maxDose: formData.get("maxDose"),
      interval: formData.get("interval"),
      duration: formData.get("duration"),
      route: formData.get("route"),
      quantity: formData.get("quantity"),
      timing: formData.get("timing"),
      observations: formData.get("observations"),
      category: formData.get("category"),
      ageGroup: formData.get("ageGroup") || "adulto",
    });
  };

  if (isLoading) return <PageLoader text="Carregando medicações..." />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Biblioteca de Medicações</CardTitle>
          <CardDescription>Crie medicamentos reutilizáveis para associar às patologias.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1" data-testid="button-add-library-medication">
                <Plus className="h-4 w-4" /> Nova Medicação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Medicação à Biblioteca</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMedication} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome da Medicação *</label>
                    <Input name="name" required placeholder="Ex: Dipirona 500mg" data-testid="input-med-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Apresentação</label>
                    <Input name="presentation" placeholder="Ex: Comprimido, Gotas" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Input name="category" placeholder="Ex: Analgésicos" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faixa Etária</label>
                    <select name="ageGroup" className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                      <option value="adulto">Adulto</option>
                      <option value="pediatrico">Pediátrico</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dose Padrão</label>
                    <Input name="dose" placeholder="Ex: 1g" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dose/kg (pediátrico)</label>
                    <Input name="dosePerKg" placeholder="Ex: 10mg/kg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dose Máxima</label>
                    <Input name="maxDose" placeholder="Ex: 4g/dia" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo</label>
                    <Input name="interval" placeholder="Ex: 6/6h" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duração</label>
                    <Input name="duration" placeholder="Ex: 5 dias" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Via</label>
                    <Input name="route" placeholder="Ex: VO, IV, IM" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade</label>
                    <Input name="quantity" placeholder="Ex: 20 comprimidos" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Horário</label>
                    <Input name="timing" placeholder="Ex: Jejum" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea name="observations" placeholder="Observações adicionais..." rows={2} />
                </div>
                <Button type="submit" className="w-full" disabled={createMedication.isPending}>
                  {createMedication.isPending ? "Salvando..." : "Adicionar à Biblioteca"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={onBack}>Voltar</Button>
        </div>
      </CardHeader>
      <CardContent>
        {medicationsList && medicationsList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicação</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Via</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicationsList.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.name}
                    {m.presentation && <span className="text-muted-foreground ml-1">({m.presentation})</span>}
                  </TableCell>
                  <TableCell>{m.category || "-"}</TableCell>
                  <TableCell>{m.dose || "-"} {m.dosePerKg && `(${m.dosePerKg}/kg)`}</TableCell>
                  <TableCell>{m.interval || "-"}</TableCell>
                  <TableCell>{m.route || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMedication.mutate(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma medicação cadastrada. Clique em "Nova Medicação" para criar sua biblioteca de medicamentos.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewPrescriptionDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/prescriptions", data);
      if (!res.ok) throw new Error("Failed to create prescription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Prescrição criada!", description: "A prescrição oficial foi adicionada." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar prescrição.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const medication = (formData.get("medication") as string) || "";
    const dose = (formData.get("dose") as string) || "";
    const interval = (formData.get("interval") as string) || "";
    const duration = (formData.get("duration") as string) || "";
    const route = (formData.get("route") as string) || "VO";
    const quantity = formData.get("quantity") as string;
    const patientNotes = formData.get("patientNotes") as string;
    const category = formData.get("category") as string;
    const ageGroup = formData.get("ageGroup") as string;
    
    const data = {
      title: formData.get("title") as string,
      medication: medication || null,
      dose: dose || null,
      interval: interval || null,
      quantity: quantity || null,
      duration: duration || null,
      route: route || null,
      timing: null,
      patientNotes: patientNotes || null,
      category: category || null,
      ageGroup: ageGroup || "adulto",
      content: `${medication} ${dose}, ${route}, ${interval}, por ${duration}`.trim(),
      isPublic: true,
      isLocked: formData.get("isLocked") === "on",
    };
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1" data-testid="button-new-prescription-admin">
          <Plus className="h-4 w-4" /> Nova Prescrição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição Oficial</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título / Nome</label>
            <Input name="title" required placeholder="Ex: Dipirona para dor" data-testid="input-admin-presc-title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Medicação</label>
              <Input name="medication" required placeholder="Ex: Dipirona 1g" data-testid="input-admin-presc-medication" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dose</label>
              <Input name="dose" required placeholder="Ex: 1g" data-testid="input-admin-presc-dose" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo</label>
              <Input name="interval" required placeholder="Ex: 6/6h" data-testid="input-admin-presc-interval" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração</label>
              <Input name="duration" placeholder="Ex: 7 dias" data-testid="input-admin-presc-duration" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Via</label>
              <Input name="route" placeholder="Ex: VO, IV, IM" defaultValue="VO" data-testid="input-admin-presc-route" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input name="category" placeholder="Ex: Analgesia" defaultValue="Outros" data-testid="input-admin-presc-category" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Faixa Etária</label>
              <select name="ageGroup" defaultValue="adulto" className="w-full h-9 px-3 border rounded-md text-sm bg-background" data-testid="select-admin-presc-age-group">
                <option value="adulto">Adulto</option>
                <option value="pediatrico">Pediátrico</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input name="quantity" placeholder="Ex: 21 comprimidos" data-testid="input-admin-presc-quantity" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Observações do Paciente</label>
            <Textarea name="patientNotes" placeholder="Instruções adicionais..." rows={2} data-testid="textarea-admin-presc-notes" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox id="isLocked" name="isLocked" />
            <label htmlFor="isLocked" className="text-sm cursor-pointer">Bloquear edição por usuários</label>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-admin-prescription">
            {createMutation.isPending ? "Salvando..." : "Criar Prescrição Oficial"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewProtocolDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest("POST", "/api/protocols", data);
      if (!res.ok) throw new Error("Failed to create protocol");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: "Protocolo criado!", description: "O protocolo oficial foi adicionado." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar protocolo.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contentText = (formData.get("content") as string) || "";
    const referencesText = formData.get("references") as string;
    const specialty = formData.get("specialty") as string;
    const category = formData.get("category") as string;
    
    const data = {
      title: formData.get("title") as string,
      content: { 
        text: contentText,
        steps: contentText.split('\n').filter(s => s.trim()).map((s, i) => ({ id: i + 1, text: s })),
        references: referencesText ? referencesText.split('\n').filter(s => s.trim()) : []
      },
      description: contentText.substring(0, 200) || null,
      specialty: specialty || null,
      category: category || null,
      ageGroup: formData.get("ageGroup") as string || "adulto",
      isPublic: true,
      isLocked: formData.get("isLocked") === "on",
    };
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1" data-testid="button-new-protocol-admin">
          <Plus className="h-4 w-4" /> Novo Protocolo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Protocolo Clínico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input name="title" required placeholder="Ex: Protocolo de Sepse" data-testid="input-admin-protocol-title" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidade</label>
              <Input name="specialty" placeholder="Ex: Clínica Médica" data-testid="input-admin-protocol-specialty" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input name="category" placeholder="Ex: Emergência" defaultValue="Geral" data-testid="input-admin-protocol-category" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Faixa Etária</label>
            <select name="ageGroup" defaultValue="adulto" className="w-full h-9 px-3 border rounded-md text-sm bg-background" data-testid="select-admin-protocol-age-group">
              <option value="adulto">Adulto</option>
              <option value="pediatrico">Pediátrico</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo do Protocolo</label>
            <Textarea name="content" required placeholder="Descreva o protocolo em detalhes..." rows={6} data-testid="textarea-admin-protocol-content" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Referências</label>
            <Textarea name="references" placeholder="Literatura ou guidelines de referência..." rows={2} data-testid="textarea-admin-protocol-references" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <Checkbox id="isLockedProtocol" name="isLocked" />
            <label htmlFor="isLockedProtocol" className="text-sm cursor-pointer">Bloquear edição por usuários</label>
          </div>
          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-admin-protocol">
            {createMutation.isPending ? "Salvando..." : "Criar Protocolo Oficial"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
