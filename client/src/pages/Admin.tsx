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
import { CheckCircle, Ban, ShieldAlert, Save, Users, Settings, FileText, CreditCard, BarChart3, Bot, Plus, Trash2, Pencil, Pill, AlertTriangle, Sparkles, Loader2, Ticket, Calculator, Copy, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        <TabsList className="flex flex-wrap gap-1 w-full max-w-5xl">
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1">
            <CreditCard className="h-4 w-4" /> Pagamento
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1">
            <Ticket className="h-4 w-4" /> Cupons
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-1">
            <Calculator className="h-4 w-4" /> Calculadora
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1">
            <FileText className="h-4 w-4" /> Modelos
          </TabsTrigger>
          <TabsTrigger value="ai-prompts" className="gap-1">
            <Bot className="h-4 w-4" /> IA
          </TabsTrigger>
          <TabsTrigger value="interactions" className="gap-1">
            <Pill className="h-4 w-4" /> Interações
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1">
            <Settings className="h-4 w-4" /> Config
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

        <TabsContent value="coupons">
          <CouponsTab />
        </TabsContent>

        <TabsContent value="calculator">
          <CalculatorSettingsTab />
        </TabsContent>

        <TabsContent value="models">
          <PrescriptionModelsTab />
        </TabsContent>

        <TabsContent value="ai-prompts">
          <AiPromptsTab />
        </TabsContent>

        <TabsContent value="interactions">
          <InteractionsTab />
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

interface DrugInteractionItem {
  id: number;
  drug1: string;
  drug2: string;
  severity: string;
  description: string;
  recommendation: string;
  isActive: boolean;
}

interface ContraindicationItem {
  id: number;
  medicationName: string;
  contraindication: string;
  severity: string;
  notes: string;
  isActive: boolean;
}

function InteractionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [isAddingContraindication, setIsAddingContraindication] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<DrugInteractionItem | null>(null);
  const [editingContraindication, setEditingContraindication] = useState<ContraindicationItem | null>(null);

  const [newInteraction, setNewInteraction] = useState({
    drug1: "", drug2: "", severity: "moderada", description: "", recommendation: ""
  });
  const [newContraindication, setNewContraindication] = useState({
    medicationName: "", contraindication: "", severity: "moderada", notes: ""
  });

  const { data: interactions = [], isLoading: loadingInteractions } = useQuery<DrugInteractionItem[]>({
    queryKey: ["/api/drug-interactions"],
  });

  const { data: contraindications = [], isLoading: loadingContraindications } = useQuery<ContraindicationItem[]>({
    queryKey: ["/api/medication-contraindications"],
  });

  const createInteractionMutation = useMutation({
    mutationFn: async (data: typeof newInteraction) => {
      const res = await apiRequest("POST", "/api/drug-interactions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drug-interactions"] });
      toast({ title: "Interação cadastrada!" });
      setIsAddingInteraction(false);
      setNewInteraction({ drug1: "", drug2: "", severity: "moderada", description: "", recommendation: "" });
    },
    onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
  });

  const updateInteractionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DrugInteractionItem> }) => {
      const res = await apiRequest("PUT", `/api/drug-interactions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drug-interactions"] });
      toast({ title: "Interação atualizada!" });
      setEditingInteraction(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/drug-interactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drug-interactions"] });
      toast({ title: "Interação removida!" });
    },
  });

  const createContraindicationMutation = useMutation({
    mutationFn: async (data: typeof newContraindication) => {
      const res = await apiRequest("POST", "/api/medication-contraindications", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-contraindications"] });
      toast({ title: "Contraindicação cadastrada!" });
      setIsAddingContraindication(false);
      setNewContraindication({ medicationName: "", contraindication: "", severity: "moderada", notes: "" });
    },
    onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
  });

  const updateContraindicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ContraindicationItem> }) => {
      const res = await apiRequest("PUT", `/api/medication-contraindications/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-contraindications"] });
      toast({ title: "Contraindicação atualizada!" });
      setEditingContraindication(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteContraindicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medication-contraindications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-contraindications"] });
      toast({ title: "Contraindicação removida!" });
    },
  });

  const severityOptions = [
    { value: "leve", label: "Leve" },
    { value: "moderada", label: "Moderada" },
    { value: "grave", label: "Grave" },
    { value: "contraindicada", label: "Contraindicada" },
  ];

  const severityColors: Record<string, string> = {
    leve: "bg-yellow-100 text-yellow-800",
    moderada: "bg-orange-100 text-orange-800",
    grave: "bg-red-100 text-red-800",
    contraindicada: "bg-red-200 text-red-900",
  };

  if (loadingInteractions || loadingContraindications) {
    return <div className="flex justify-center p-8"><PageLoader text="Carregando..." /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" /> Interações Medicamentosas
            </CardTitle>
            <CardDescription>Cadastre interações entre medicamentos que serão verificadas pelos usuários.</CardDescription>
          </div>
          <Dialog open={isAddingInteraction} onOpenChange={setIsAddingInteraction}>
            <DialogTrigger asChild>
              <Button className="gap-1" data-testid="button-add-interaction">
                <Plus className="h-4 w-4" /> Nova Interação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Interação Medicamentosa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Medicamento 1</label>
                    <Input
                      value={newInteraction.drug1}
                      onChange={(e) => setNewInteraction({ ...newInteraction, drug1: e.target.value })}
                      placeholder="Ex: Varfarina"
                      data-testid="input-new-drug1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Medicamento 2</label>
                    <Input
                      value={newInteraction.drug2}
                      onChange={(e) => setNewInteraction({ ...newInteraction, drug2: e.target.value })}
                      placeholder="Ex: AAS"
                      data-testid="input-new-drug2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gravidade</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border bg-background"
                    value={newInteraction.severity}
                    onChange={(e) => setNewInteraction({ ...newInteraction, severity: e.target.value })}
                  >
                    {severityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={newInteraction.description}
                    onChange={(e) => setNewInteraction({ ...newInteraction, description: e.target.value })}
                    placeholder="Descreva a interação..."
                    data-testid="textarea-new-description"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recomendação</label>
                  <Textarea
                    value={newInteraction.recommendation}
                    onChange={(e) => setNewInteraction({ ...newInteraction, recommendation: e.target.value })}
                    placeholder="Ex: Evitar associação, monitorar INR..."
                    data-testid="textarea-new-recommendation"
                  />
                </div>
                <Button
                  onClick={() => createInteractionMutation.mutate(newInteraction)}
                  disabled={!newInteraction.drug1 || !newInteraction.drug2 || createInteractionMutation.isPending}
                  className="w-full"
                  data-testid="button-save-interaction"
                >
                  {createInteractionMutation.isPending ? "Salvando..." : "Salvar Interação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamentos</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactions.map((int) => (
                  <TableRow key={int.id} data-testid={`row-interaction-${int.id}`}>
                    <TableCell className="font-medium">{int.drug1} + {int.drug2}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[int.severity || "moderada"]}>{int.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{int.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingInteraction(int)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteInteractionMutation.mutate(int.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Contraindicações
            </CardTitle>
            <CardDescription>Cadastre contraindicações de medicamentos.</CardDescription>
          </div>
          <Dialog open={isAddingContraindication} onOpenChange={setIsAddingContraindication}>
            <DialogTrigger asChild>
              <Button className="gap-1" data-testid="button-add-contraindication">
                <Plus className="h-4 w-4" /> Nova Contraindicação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Contraindicação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicamento</label>
                  <Input
                    value={newContraindication.medicationName}
                    onChange={(e) => setNewContraindication({ ...newContraindication, medicationName: e.target.value })}
                    placeholder="Ex: Metformina"
                    data-testid="input-new-medication"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraindicação</label>
                  <Textarea
                    value={newContraindication.contraindication}
                    onChange={(e) => setNewContraindication({ ...newContraindication, contraindication: e.target.value })}
                    placeholder="Ex: Insuficiência renal grave"
                    data-testid="textarea-new-contraindication"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gravidade</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border bg-background"
                    value={newContraindication.severity}
                    onChange={(e) => setNewContraindication({ ...newContraindication, severity: e.target.value })}
                  >
                    {severityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea
                    value={newContraindication.notes}
                    onChange={(e) => setNewContraindication({ ...newContraindication, notes: e.target.value })}
                    placeholder="Notas adicionais..."
                    data-testid="textarea-new-notes"
                  />
                </div>
                <Button
                  onClick={() => createContraindicationMutation.mutate(newContraindication)}
                  disabled={!newContraindication.medicationName || !newContraindication.contraindication || createContraindicationMutation.isPending}
                  className="w-full"
                  data-testid="button-save-contraindication"
                >
                  {createContraindicationMutation.isPending ? "Salvando..." : "Salvar Contraindicação"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {contraindications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma contraindicação cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Contraindicação</TableHead>
                  <TableHead>Gravidade</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contraindications.map((c) => (
                  <TableRow key={c.id} data-testid={`row-contraindication-${c.id}`}>
                    <TableCell className="font-medium">{c.medicationName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{c.contraindication}</TableCell>
                    <TableCell>
                      <Badge className={severityColors[c.severity || "moderada"]}>{c.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingContraindication(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteContraindicationMutation.mutate(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {editingInteraction && (
        <Dialog open={!!editingInteraction} onOpenChange={() => setEditingInteraction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Interação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicamento 1</label>
                  <Input
                    value={editingInteraction.drug1}
                    onChange={(e) => setEditingInteraction({ ...editingInteraction, drug1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicamento 2</label>
                  <Input
                    value={editingInteraction.drug2}
                    onChange={(e) => setEditingInteraction({ ...editingInteraction, drug2: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gravidade</label>
                <select
                  className="w-full h-9 px-3 rounded-md border bg-background"
                  value={editingInteraction.severity}
                  onChange={(e) => setEditingInteraction({ ...editingInteraction, severity: e.target.value })}
                >
                  {severityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={editingInteraction.description}
                  onChange={(e) => setEditingInteraction({ ...editingInteraction, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recomendação</label>
                <Textarea
                  value={editingInteraction.recommendation}
                  onChange={(e) => setEditingInteraction({ ...editingInteraction, recommendation: e.target.value })}
                />
              </div>
              <Button
                onClick={() => updateInteractionMutation.mutate({ id: editingInteraction.id, data: editingInteraction })}
                disabled={updateInteractionMutation.isPending}
                className="w-full"
              >
                {updateInteractionMutation.isPending ? "Salvando..." : "Atualizar Interação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingContraindication && (
        <Dialog open={!!editingContraindication} onOpenChange={() => setEditingContraindication(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Contraindicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Medicamento</label>
                <Input
                  value={editingContraindication.medicationName}
                  onChange={(e) => setEditingContraindication({ ...editingContraindication, medicationName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraindicação</label>
                <Textarea
                  value={editingContraindication.contraindication}
                  onChange={(e) => setEditingContraindication({ ...editingContraindication, contraindication: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gravidade</label>
                <select
                  className="w-full h-9 px-3 rounded-md border bg-background"
                  value={editingContraindication.severity}
                  onChange={(e) => setEditingContraindication({ ...editingContraindication, severity: e.target.value })}
                >
                  {severityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={editingContraindication.notes}
                  onChange={(e) => setEditingContraindication({ ...editingContraindication, notes: e.target.value })}
                />
              </div>
              <Button
                onClick={() => updateContraindicationMutation.mutate({ id: editingContraindication.id, data: editingContraindication })}
                disabled={updateContraindicationMutation.isPending}
                className="w-full"
              >
                {updateContraindicationMutation.isPending ? "Salvando..." : "Atualizar Contraindicação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface PromoCoupon {
  id: number;
  code: string;
  discountType: string | null;
  discountValue: string;
  discountMonths: number | null;
  maxUses: number | null;
  currentUses: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean | null;
  description: string | null;
  createdAt: string | null;
}

function CouponsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountMonths, setDiscountMonths] = useState("1");
  const [maxUses, setMaxUses] = useState("");
  const [validUntilDays, setValidUntilDays] = useState("");
  const [description, setDescription] = useState("");

  const { data: coupons, isLoading } = useQuery<PromoCoupon[]>({
    queryKey: ["/api/promo-coupons"],
    queryFn: async () => {
      const res = await fetch("/api/promo-coupons", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promo-coupons", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/promo-coupons"] });
      toast({ title: "Cupom criado!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar cupom", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/promo-coupons/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/promo-coupons"] });
      toast({ title: "Cupom atualizado!" });
      setEditingCoupon(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/promo-coupons/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/promo-coupons"] });
      toast({ title: "Cupom excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountMonths("1");
    setMaxUses("");
    setValidUntilDays("");
    setDescription("");
  };

  const handleCreate = () => {
    if (!code || !discountValue) return;
    const validUntil = validUntilDays ? new Date(Date.now() + parseInt(validUntilDays) * 24 * 60 * 60 * 1000).toISOString() : null;
    createMutation.mutate({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      discountMonths: parseInt(discountMonths) || 1,
      maxUses: maxUses ? parseInt(maxUses) : null,
      validUntil,
      description,
      isActive: true,
    });
  };

  if (isLoading) return <PageLoader text="Carregando cupons..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" /> Cupons de Desconto
            </CardTitle>
            <CardDescription>Gerencie cupons promocionais para pagamentos</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-coupon">
                <Plus className="h-4 w-4" /> Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Cupom de Desconto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Código do Cupom *</label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="EX: DESCONTO20"
                    data-testid="input-coupon-code"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo de Desconto</label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger data-testid="select-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor do Desconto *</label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "Ex: 20" : "Ex: 50"}
                      data-testid="input-discount-value"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meses de Desconto</label>
                    <Input
                      type="number"
                      value={discountMonths}
                      onChange={(e) => setDiscountMonths(e.target.value)}
                      placeholder="1"
                      data-testid="input-discount-months"
                    />
                    <p className="text-xs text-muted-foreground">Por quantos meses o desconto será aplicado</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Limite de Usos</label>
                    <Input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="Ilimitado"
                      data-testid="input-max-uses"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Validade (dias)</label>
                  <Input
                    type="number"
                    value={validUntilDays}
                    onChange={(e) => setValidUntilDays(e.target.value)}
                    placeholder="Ex: 30 (deixe vazio para sem validade)"
                    data-testid="input-valid-days"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição interna do cupom"
                    data-testid="input-coupon-description"
                  />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !code || !discountValue} className="w-full" data-testid="button-create-coupon">
                  {createMutation.isPending ? "Criando..." : "Criar Cupom"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {coupons && coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Meses</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `R$ ${coupon.discountValue}`}
                    </TableCell>
                    <TableCell>{coupon.discountMonths || 1} mês(es)</TableCell>
                    <TableCell>
                      {coupon.currentUses || 0}{coupon.maxUses ? `/${coupon.maxUses}` : ""}
                    </TableCell>
                    <TableCell>
                      {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString("pt-BR") : "Sem limite"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? "default" : "secondary"}>
                        {coupon.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateMutation.mutate({ id: coupon.id, data: { isActive: !coupon.isActive } })}
                          title={coupon.isActive ? "Desativar" : "Ativar"}
                        >
                          {coupon.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(coupon.id)}
                          className="text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cupom cadastrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface CalcSetting {
  id: number;
  medication: string;
  indication: string | null;
  dosePerKg: string;
  doseFormula: string | null;
  fixedDose: string | null;
  maxDosePerDose: string | null;
  maxDosePerDay: string | null;
  maxDose: string | null;
  unit: string | null;
  interval: string | null;
  notes: string | null;
  ageGroup: string | null;
  calculatorMode: string | null;
  usageMode: string | null;
  pharmaceuticalForm: string | null;
  concentration: string | null;
  route: string | null;
  category: string | null;
  isActive: boolean | null;
}

function CalculatorSettingsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<CalcSetting | null>(null);
  const [medication, setMedication] = useState("");
  const [indication, setIndication] = useState("");
  const [dosePerKg, setDosePerKg] = useState("");
  const [doseFormula, setDoseFormula] = useState("mg/kg/dose");
  const [maxDose, setMaxDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [interval, setInterval] = useState("");
  const [notes, setNotes] = useState("");
  const [calculatorMode, setCalculatorMode] = useState("pediatrico");
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState("");
  const [concentration, setConcentration] = useState("");
  const [route, setRoute] = useState("VO");
  const [category, setCategory] = useState("");

  const { data: settings, isLoading } = useQuery<CalcSetting[]>({
    queryKey: ["/api/calculator-settings"],
    queryFn: async () => {
      const res = await fetch("/api/calculator-settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/calculator-settings", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calculator-settings"] });
      toast({ title: "Medicamento adicionado!" });
      resetForm();
      setDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao adicionar", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/calculator-settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calculator-settings"] });
      toast({ title: "Medicamento atualizado!" });
      setEditingMed(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/calculator-settings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calculator-settings"] });
      toast({ title: "Medicamento removido!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const resetForm = () => {
    setMedication("");
    setIndication("");
    setDosePerKg("");
    setDoseFormula("mg/kg/dose");
    setMaxDose("");
    setUnit("mg");
    setInterval("");
    setNotes("");
    setCalculatorMode("pediatrico");
    setPharmaceuticalForm("");
    setConcentration("");
    setRoute("VO");
    setCategory("");
  };

  const handleCreate = () => {
    if (!medication || !dosePerKg) return;
    createMutation.mutate({
      medication,
      indication,
      dosePerKg,
      doseFormula,
      maxDose,
      unit,
      interval,
      notes,
      calculatorMode,
      pharmaceuticalForm,
      concentration,
      route,
      category,
      isActive: true,
    });
  };

  const modeLabels: Record<string, string> = {
    pediatrico: "Pediátrico",
    adulto: "Adulto",
    emergencia: "Emergência",
    comum: "Comum",
  };

  if (isLoading) return <PageLoader text="Carregando medicamentos..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Medicamentos da Calculadora
            </CardTitle>
            <CardDescription>Configure os medicamentos e cálculos disponíveis na calculadora</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-calc-med">
                <Plus className="h-4 w-4" /> Novo Medicamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Medicamento à Calculadora</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Medicamento *</label>
                    <Input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="Ex: Dipirona" data-testid="input-calc-medication" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Modo da Calculadora</label>
                    <Select value={calculatorMode} onValueChange={setCalculatorMode}>
                      <SelectTrigger data-testid="select-calc-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pediatrico">Pediátrico</SelectItem>
                        <SelectItem value="adulto">Adulto</SelectItem>
                        <SelectItem value="emergencia">Emergência</SelectItem>
                        <SelectItem value="comum">Comum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Indicação</label>
                  <Input value={indication} onChange={(e) => setIndication(e.target.value)} placeholder="Ex: Febre, dor" data-testid="input-calc-indication" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dose por Kg *</label>
                    <Input value={dosePerKg} onChange={(e) => setDosePerKg(e.target.value)} placeholder="Ex: 10-15" data-testid="input-calc-dose-per-kg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fórmula</label>
                    <Select value={doseFormula} onValueChange={setDoseFormula}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg/kg/dose">mg/kg/dose</SelectItem>
                        <SelectItem value="mg/kg/dia">mg/kg/dia</SelectItem>
                        <SelectItem value="dose_fixa">Dose Fixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dose Máxima</label>
                    <Input value={maxDose} onChange={(e) => setMaxDose(e.target.value)} placeholder="Ex: 1g" data-testid="input-calc-max-dose" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unidade</label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg">mg</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="mcg">mcg</SelectItem>
                        <SelectItem value="UI">UI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo</label>
                    <Input value={interval} onChange={(e) => setInterval(e.target.value)} placeholder="Ex: 6/6h" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Via</label>
                    <Select value={route} onValueChange={setRoute}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VO">VO (Oral)</SelectItem>
                        <SelectItem value="IV">IV (Intravenosa)</SelectItem>
                        <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                        <SelectItem value="SC">SC (Subcutânea)</SelectItem>
                        <SelectItem value="Retal">Retal</SelectItem>
                        <SelectItem value="Inalatório">Inalatório</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Forma Farmacêutica</label>
                    <Input value={pharmaceuticalForm} onChange={(e) => setPharmaceuticalForm(e.target.value)} placeholder="Ex: Gotas, Xarope" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Concentração</label>
                    <Input value={concentration} onChange={(e) => setConcentration(e.target.value)} placeholder="Ex: 500mg/ml" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Analgésico, Antibiótico" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações sobre dosagem, contraindicações, etc." />
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending || !medication || !dosePerKg} className="w-full" data-testid="button-create-calc-med">
                  {createMutation.isPending ? "Adicionando..." : "Adicionar Medicamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {settings && settings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Dose/Kg</TableHead>
                  <TableHead>Máx.</TableHead>
                  <TableHead>Intervalo</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Via</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">
                      {med.medication}
                      {med.indication && <span className="block text-xs text-muted-foreground">{med.indication}</span>}
                    </TableCell>
                    <TableCell>{med.dosePerKg} {med.unit || "mg"}</TableCell>
                    <TableCell>{med.maxDose || "-"}</TableCell>
                    <TableCell>{med.interval || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{modeLabels[med.calculatorMode || "pediatrico"] || med.calculatorMode}</Badge>
                    </TableCell>
                    <TableCell>{med.route || "VO"}</TableCell>
                    <TableCell>
                      <Badge variant={med.isActive ? "default" : "secondary"}>
                        {med.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateMutation.mutate({ id: med.id, data: { isActive: !med.isActive } })}
                          title={med.isActive ? "Desativar" : "Ativar"}
                        >
                          {med.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(med.id)}
                          className="text-red-500"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum medicamento cadastrado na calculadora.</p>
              <p className="text-sm mt-2">Adicione medicamentos para aparecerem na calculadora de doses.</p>
            </div>
          )}
        </CardContent>
      </Card>
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

      <AiContentGenerator />

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

function AiContentGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState("protocol");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, title, context }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao gerar conteúdo");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedDraft(data.draft);
      setShowPreview(true);
      toast({ title: "Rascunho gerado!", description: "Revise o conteúdo antes de salvar." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao gerar conteúdo com IA.", variant: "destructive" });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!generatedDraft) throw new Error("Nenhum rascunho");
      
      const endpoints: Record<string, string> = {
        protocol: "/api/protocols",
        checklist: "/api/checklists",
        flashcard: "/api/flashcards",
        prescription: "/api/prescriptions",
      };
      
      const endpoint = endpoints[contentType];
      const body: any = { ...generatedDraft };
      
      if (contentType === "protocol" || contentType === "flashcard") {
        body.isPublic = true;
      }
      if (contentType === "prescription") {
        body.isPublic = true;
        body.isLocked = true;
      }
      if (contentType === "checklist" && Array.isArray(body.items)) {
        body.items = body.items.join("|");
      }
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      const keys: Record<string, string> = {
        protocol: "/api/protocols",
        checklist: "/api/checklists",
        flashcard: "/api/flashcards",
        prescription: "/api/prescriptions",
      };
      queryClient.invalidateQueries({ queryKey: [keys[contentType]] });
      toast({ title: "Salvo!", description: "Conteúdo publicado com sucesso." });
      setGeneratedDraft(null);
      setShowPreview(false);
      setTitle("");
      setContext("");
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar conteúdo.", variant: "destructive" });
    },
  });

  const contentTypeLabels: Record<string, string> = {
    protocol: "Protocolo",
    checklist: "Checklist",
    flashcard: "Flashcard",
    prescription: "Prescrição",
  };

  return (
    <Card className="border-purple-200 dark:border-purple-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" /> Gerador de Conteúdo com IA
        </CardTitle>
        <CardDescription>
          Use a IA para gerar rascunhos de protocolos, checklists, flashcards e prescrições. 
          Todo conteúdo deve ser revisado antes de publicar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Conteúdo</label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger data-testid="select-ai-content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protocol">Protocolo Clínico</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="flashcard">Flashcard</SelectItem>
                <SelectItem value="prescription">Modelo de Prescrição</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Título Sugerido</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Protocolo de IAM"
              data-testid="input-ai-title"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contexto / Descrição</label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o que o conteúdo deve abordar. Ex: Protocolo completo para manejo de infarto agudo do miocárdio no PS, incluindo critérios diagnósticos, conduta inicial e indicações de reperfusão..."
            rows={4}
            data-testid="textarea-ai-context"
          />
        </div>
        <Button 
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !context}
          className="gap-2"
          data-testid="button-generate-ai-content"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Gerar Rascunho
            </>
          )}
        </Button>

        {showPreview && generatedDraft && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Rascunho: {contentTypeLabels[contentType]}
              </h4>
              <Badge variant="outline">Revisão Obrigatória</Badge>
            </div>
            
            <div className="bg-background p-4 rounded border text-sm space-y-2 max-h-[300px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {JSON.stringify(generatedDraft, null, 2)}
              </pre>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Revise cuidadosamente o conteúdo gerado pela IA antes de publicar. 
                Verifique doses, indicações e contraindicações.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => { setShowPreview(false); setGeneratedDraft(null); }}
                data-testid="button-discard-draft"
              >
                Descartar
              </Button>
              <Button 
                onClick={() => saveDraftMutation.mutate()}
                disabled={saveDraftMutation.isPending}
                data-testid="button-save-draft"
              >
                {saveDraftMutation.isPending ? "Salvando..." : "Revisar e Publicar"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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

const CLINICAL_CATEGORIES = [
  "Cardiologia",
  "Pneumologia",
  "Gastro/Hepato",
  "Nefro/Uro",
  "Endocrino/Metabolico",
  "Infectologia",
  "Reumatologia/Ortopedia",
  "Dermatologia",
  "Neurologia",
  "Psiquiatria",
  "Gineco/Obstetricia",
  "Pediatria Geral",
  "Trauma/Urgencia",
  "Toxicologico",
  "Oftalmologia/Otorrino",
  "Hematologia",
  "Oncologia",
  "Outros",
];

function PathologyManagement({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPathology, setSelectedPathology] = useState<any>(null);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [pathologyName, setPathologyName] = useState("");
  const [pathologyDescription, setPathologyDescription] = useState("");
  const [pathologyCategory, setPathologyCategory] = useState("");
  const [pathologyClinicalCategory, setPathologyClinicalCategory] = useState("");
  const [pathologyAgeGroup, setPathologyAgeGroup] = useState("adulto");
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"adulto" | "pediatrico">("adulto");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const duplicatePathology = useMutation({
    mutationFn: async ({ id, targetAgeGroup }: { id: number; targetAgeGroup: string }) => {
      const res = await apiRequest("POST", `/api/pathologies/${id}/duplicate`, { targetAgeGroup });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ title: "Patologia duplicada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Patologia já existe no grupo de idade alvo", variant: "destructive" });
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
    setPathologyClinicalCategory("");
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
      clinicalCategory: pathologyClinicalCategory || null,
      ageGroup: pathologyAgeGroup,
      isPublic: true,
      isLocked: true,
    });
  };

  const filteredPathologies = pathologies?.filter(p => p.ageGroup === activeTab) || [];
  
  const groupedPathologies = filteredPathologies.reduce((groups: Record<string, any[]>, p) => {
    const category = p.clinicalCategory || p.category || "Sem Categoria";
    if (!groups[category]) groups[category] = [];
    groups[category].push(p);
    return groups;
  }, {});

  const sortedCategories = Object.keys(groupedPathologies).sort((a, b) => {
    if (a === "Sem Categoria") return 1;
    if (b === "Sem Categoria") return -1;
    return a.localeCompare(b, 'pt-BR');
  });

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
                    <label className="text-sm font-medium">Categoria Clínica</label>
                    <select 
                      value={pathologyClinicalCategory} 
                      onChange={(e) => setPathologyClinicalCategory(e.target.value)}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="">-- Selecione --</option>
                      {CLINICAL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
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
      <CardContent className="space-y-4">
        <div className="flex gap-2 border-b pb-3">
          <Button 
            variant={activeTab === "adulto" ? "default" : "outline"} 
            onClick={() => setActiveTab("adulto")}
            data-testid="tab-adulto"
          >
            Adulto ({pathologies?.filter(p => p.ageGroup === "adulto").length || 0})
          </Button>
          <Button 
            variant={activeTab === "pediatrico" ? "default" : "outline"} 
            onClick={() => setActiveTab("pediatrico")}
            data-testid="tab-pediatrico"
          >
            Pediátrico ({pathologies?.filter(p => p.ageGroup === "pediatrico").length || 0})
          </Button>
        </div>

        {filteredPathologies.length > 0 ? (
          <div className="space-y-6">
            {sortedCategories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">{category}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patologia</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedPathologies[category].map((p: any) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPathology(p)}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {p.isPublic && <Badge variant="secondary">Oficial</Badge>}
                            {p.sourceGroup && <Badge variant="outline">{p.sourceGroup.replace(/_/g, " ")}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => duplicatePathology.mutate({ 
                                id: p.id, 
                                targetAgeGroup: activeTab === "adulto" ? "pediatrico" : "adulto" 
                              })}
                              disabled={duplicatePathology.isPending}
                              title={activeTab === "adulto" ? "Duplicar para Pediatria" : "Duplicar para Adulto"}
                              data-testid={`button-duplicate-${p.id}`}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              {activeTab === "adulto" ? "Ped" : "Adult"}
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePathology.mutate(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma patologia cadastrada para {activeTab === "adulto" ? "adultos" : "pediatria"}. Clique em "Nova Patologia" para começar.
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

interface PathologyForModels {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  ageGroup: string | null;
}

interface PrescriptionModel {
  id: number;
  pathologyId: number;
  title: string;
  description: string | null;
  orientations: string | null;
  observations: string | null;
  ageGroup: string | null;
  order: number;
  isActive: boolean;
}

interface PrescriptionModelMedication {
  id: number;
  prescriptionModelId: number;
  medication: string;
  pharmaceuticalForm: string | null;
  dose: string | null;
  dosePerKg: string | null;
  maxDose: string | null;
  interval: string | null;
  duration: string | null;
  route: string | null;
  quantity: string | null;
  timing: string | null;
  observations: string | null;
  order: number;
}

function PrescriptionModelsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPathology, setSelectedPathology] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<PrescriptionModel | null>(null);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  const { data: pathologies, isLoading: loadingPathologies } = useQuery<PathologyForModels[]>({
    queryKey: ["/api/pathologies"],
  });

  const { data: models, isLoading: loadingModels } = useQuery<PrescriptionModel[]>({
    queryKey: ["/api/prescription-models", selectedPathology],
    queryFn: async () => {
      const url = selectedPathology 
        ? `/api/prescription-models?pathologyId=${selectedPathology}`
        : "/api/prescription-models";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: true,
  });

  const { data: medications } = useQuery<PrescriptionModelMedication[]>({
    queryKey: ["/api/prescription-models", selectedModel?.id, "medications"],
    queryFn: async () => {
      if (!selectedModel) return [];
      const res = await fetch(`/api/prescription-models/${selectedModel.id}/medications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedModel,
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: Partial<PrescriptionModel>) => {
      const res = await apiRequest("POST", "/api/admin/prescription-models", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/prescription-models"] });
      toast({ title: "Modelo criado!" });
      setModelDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar modelo", variant: "destructive" });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/prescription-models/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/prescription-models"] });
      toast({ title: "Modelo removido!" });
      setSelectedModel(null);
    },
  });

  const createMedicationMutation = useMutation({
    mutationFn: async (data: Partial<PrescriptionModelMedication>) => {
      const res = await apiRequest("POST", "/api/admin/prescription-model-medications", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/prescription-models", selectedModel?.id, "medications"] });
      toast({ title: "Medicação adicionada!" });
      setMedicationDialogOpen(false);
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/prescription-model-medications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/prescription-models", selectedModel?.id, "medications"] });
      toast({ title: "Medicação removida!" });
    },
  });

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Digite uma descrição", variant: "destructive" });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/ai/chat", {
        message: `Gere uma prescrição médica completa para: ${aiPrompt}. 
        Retorne em JSON com este formato exato:
        {
          "title": "Nome do modelo",
          "description": "Descrição breve",
          "orientations": "Orientações ao paciente",
          "observations": "Observações clínicas",
          "medications": [
            {
              "medication": "Nome do medicamento",
              "pharmaceuticalForm": "Forma farmacêutica",
              "dose": "Dose",
              "interval": "Intervalo",
              "duration": "Duração",
              "route": "Via",
              "observations": "Observações"
            }
          ]
        }`,
        mode: "quick",
      });
      const data = await res.json();
      if (data.reply) {
        try {
          const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setGeneratedContent(parsed);
            toast({ title: "Conteúdo gerado!", description: "Revise antes de salvar." });
          }
        } catch {
          toast({ title: "Erro ao processar resposta da IA", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "Erro ao gerar conteúdo", variant: "destructive" });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedContent || !selectedPathology) {
      toast({ title: "Selecione uma patologia primeiro", variant: "destructive" });
      return;
    }
    try {
      const modelRes = await apiRequest("POST", "/api/admin/prescription-models", {
        pathologyId: selectedPathology,
        title: generatedContent.title,
        description: generatedContent.description,
        orientations: generatedContent.orientations,
        observations: generatedContent.observations,
        ageGroup: "adulto",
        order: (models?.length || 0) + 1,
        isActive: true,
      });
      const model = await modelRes.json();

      if (generatedContent.medications) {
        for (let i = 0; i < generatedContent.medications.length; i++) {
          const med = generatedContent.medications[i];
          await apiRequest("POST", "/api/admin/prescription-model-medications", {
            prescriptionModelId: model.id,
            medication: med.medication,
            pharmaceuticalForm: med.pharmaceuticalForm,
            dose: med.dose,
            interval: med.interval,
            duration: med.duration,
            route: med.route,
            observations: med.observations,
            order: i + 1,
          });
        }
      }

      qc.invalidateQueries({ queryKey: ["/api/prescription-models"] });
      toast({ title: "Modelo salvo com sucesso!" });
      setGeneratedContent(null);
      setAiPrompt("");
      setAiDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar modelo", variant: "destructive" });
    }
  };

  if (loadingPathologies) {
    return <PageLoader text="Carregando patologias..." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Modelos de Prescrição por Patologia</CardTitle>
            <CardDescription>Crie modelos oficiais de prescrição organizados por patologia.</CardDescription>
          </div>
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1" data-testid="button-ai-generate-model">
                <Sparkles className="h-4 w-4" /> Gerar com IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" /> Assistente IA - Gerar Modelo de Prescrição
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Selecione a Patologia</label>
                  <Select value={selectedPathology?.toString() || ""} onValueChange={(v) => setSelectedPathology(Number(v))}>
                    <SelectTrigger data-testid="select-ai-pathology">
                      <SelectValue placeholder="Escolha uma patologia" />
                    </SelectTrigger>
                    <SelectContent>
                      {pathologies?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descreva a Prescrição Desejada</label>
                  <Textarea 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                    placeholder="Ex: Tratamento para pneumonia adquirida na comunidade em adulto, sem alergia a medicamentos..."
                    rows={3}
                    data-testid="textarea-ai-prompt"
                  />
                </div>
                <Button 
                  onClick={handleAiGenerate} 
                  disabled={aiGenerating || !selectedPathology}
                  className="w-full gap-1"
                  data-testid="button-generate-ai"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Gerar Prescrição
                    </>
                  )}
                </Button>

                {generatedContent && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/50 space-y-3">
                    <h4 className="font-semibold">{generatedContent.title}</h4>
                    {generatedContent.description && (
                      <p className="text-sm text-muted-foreground">{generatedContent.description}</p>
                    )}
                    {generatedContent.orientations && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Orientações:</span>
                        <p className="text-sm">{generatedContent.orientations}</p>
                      </div>
                    )}
                    {generatedContent.medications && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Medicações ({generatedContent.medications.length}):</span>
                        <ul className="mt-1 space-y-1">
                          {generatedContent.medications.map((med: any, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <Pill className="h-3 w-3 mt-1 text-primary" />
                              <span>{med.medication} - {med.dose} - {med.route} - {med.interval}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button onClick={handleSaveGenerated} className="w-full mt-4" data-testid="button-save-generated">
                      Salvar Modelo Gerado
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">Patologias</h4>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {pathologies?.map(p => (
                  <Button 
                    key={p.id}
                    variant={selectedPathology === p.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => {
                      setSelectedPathology(p.id);
                      setSelectedModel(null);
                    }}
                    data-testid={`button-pathology-${p.id}`}
                  >
                    {p.name}
                    {p.category && <Badge variant="outline" className="ml-auto text-xs">{p.category}</Badge>}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">Modelos</h4>
                {selectedPathology && (
                  <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1" data-testid="button-new-model">
                        <Plus className="h-3 w-3" /> Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Modelo de Prescrição</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        createModelMutation.mutate({
                          pathologyId: selectedPathology,
                          title: fd.get("title") as string,
                          description: fd.get("description") as string,
                          orientations: fd.get("orientations") as string,
                          observations: fd.get("observations") as string,
                          ageGroup: fd.get("ageGroup") as string || "adulto",
                          order: (models?.length || 0) + 1,
                          isActive: true,
                        });
                      }} className="space-y-4">
                        <Input name="title" placeholder="Título do modelo" required data-testid="input-model-title" />
                        <Textarea name="description" placeholder="Descrição" rows={2} data-testid="textarea-model-description" />
                        <Textarea name="orientations" placeholder="Orientações ao paciente" rows={2} data-testid="textarea-model-orientations" />
                        <Textarea name="observations" placeholder="Observações clínicas" rows={2} data-testid="textarea-model-observations" />
                        <select name="ageGroup" className="w-full h-9 px-3 border rounded-md text-sm bg-background" data-testid="select-model-agegroup">
                          <option value="adulto">Adulto</option>
                          <option value="pediatrico">Pediátrico</option>
                        </select>
                        <Button type="submit" className="w-full" disabled={createModelMutation.isPending} data-testid="button-submit-model">
                          {createModelMutation.isPending ? "Salvando..." : "Criar Modelo"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {loadingModels ? (
                <div className="py-4 text-center text-muted-foreground text-sm">Carregando...</div>
              ) : selectedPathology ? (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {models?.filter(m => m.pathologyId === selectedPathology).map(m => (
                    <div key={m.id} className="flex items-center gap-1">
                      <Button 
                        variant={selectedModel?.id === m.id ? "secondary" : "ghost"}
                        className="flex-1 justify-start text-left"
                        onClick={() => setSelectedModel(m)}
                        data-testid={`button-model-${m.id}`}
                      >
                        {m.title}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteModelMutation.mutate(m.id)}
                        data-testid={`button-delete-model-${m.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {models?.filter(m => m.pathologyId === selectedPathology).length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum modelo cadastrado</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Selecione uma patologia</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm text-muted-foreground">Medicações do Modelo</h4>
                {selectedModel && (
                  <Dialog open={medicationDialogOpen} onOpenChange={setMedicationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1" data-testid="button-new-medication">
                        <Plus className="h-3 w-3" /> Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Medicação</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        createMedicationMutation.mutate({
                          prescriptionModelId: selectedModel.id,
                          medication: fd.get("medication") as string,
                          pharmaceuticalForm: fd.get("pharmaceuticalForm") as string,
                          dose: fd.get("dose") as string,
                          dosePerKg: fd.get("dosePerKg") as string,
                          maxDose: fd.get("maxDose") as string,
                          interval: fd.get("interval") as string,
                          duration: fd.get("duration") as string,
                          route: fd.get("route") as string,
                          quantity: fd.get("quantity") as string,
                          timing: fd.get("timing") as string,
                          observations: fd.get("observations") as string,
                          order: (medications?.length || 0) + 1,
                        });
                      }} className="space-y-3">
                        <Input name="medication" placeholder="Nome do medicamento" required data-testid="input-med-name" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="pharmaceuticalForm" placeholder="Forma farmacêutica" data-testid="input-med-form" />
                          <Input name="dose" placeholder="Dose" data-testid="input-med-dose" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="dosePerKg" placeholder="Dose/kg (ped)" data-testid="input-med-dosepkg" />
                          <Input name="maxDose" placeholder="Dose máxima" data-testid="input-med-maxdose" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="interval" placeholder="Intervalo" data-testid="input-med-interval" />
                          <Input name="duration" placeholder="Duração" data-testid="input-med-duration" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="route" placeholder="Via (VO, IV...)" data-testid="input-med-route" />
                          <Input name="quantity" placeholder="Quantidade" data-testid="input-med-qty" />
                        </div>
                        <Input name="timing" placeholder="Horário (jejum, etc)" data-testid="input-med-timing" />
                        <Textarea name="observations" placeholder="Observações" rows={2} data-testid="textarea-med-obs" />
                        <Button type="submit" className="w-full" disabled={createMedicationMutation.isPending} data-testid="button-submit-medication">
                          {createMedicationMutation.isPending ? "Salvando..." : "Adicionar"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {selectedModel ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {medications?.map(med => (
                    <div key={med.id} className="p-2 border rounded-md bg-muted/30 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {med.medication}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[med.dose, med.route, med.interval, med.duration].filter(Boolean).join(" - ")}
                        </div>
                        {med.observations && (
                          <div className="text-xs text-muted-foreground mt-1">{med.observations}</div>
                        )}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => deleteMedicationMutation.mutate(med.id)}
                        data-testid={`button-delete-med-${med.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {medications?.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma medicação</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Selecione um modelo</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
