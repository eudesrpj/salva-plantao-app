import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Ban, ShieldAlert, Save, Users, Settings, FileText, CreditCard, BarChart3, Bot, Plus, Trash2, Pencil, Pill, AlertTriangle, Sparkles, Loader2, Ticket, Calculator, Copy, Upload, Syringe, CheckSquare, Power, PowerOff, Download, Layout, Zap, Heart } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
          <TabsTrigger value="subscriptions" className="gap-1">
            <CreditCard className="h-4 w-4" /> Assinaturas
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
          <TabsTrigger value="dashboard-config" className="gap-1">
            <Layout className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="donations" className="gap-1">
            <Heart className="h-4 w-4" /> Doações
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

        <TabsContent value="subscriptions">
          <SubscriptionsTab />
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

        <TabsContent value="dashboard-config">
          <DashboardConfigTab />
        </TabsContent>

        <TabsContent value="donations">
          <DonationsTab />
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

interface DilutionItem {
  id: number;
  medicationName: string;
  route: string;
  dilutionNeeded: boolean;
  dilutionHow: string;
  infusionTime: string;
  compatibility: string;
  administrationNotes: string;
  isActive: boolean;
}

function InteractionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [isAddingContraindication, setIsAddingContraindication] = useState(false);
  const [isAddingDilution, setIsAddingDilution] = useState(false);
  const [isBulkImportDilution, setIsBulkImportDilution] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<DrugInteractionItem | null>(null);
  const [editingContraindication, setEditingContraindication] = useState<ContraindicationItem | null>(null);
  const [editingDilution, setEditingDilution] = useState<DilutionItem | null>(null);
  const [dilutionBulkData, setDilutionBulkData] = useState("");

  const [newInteraction, setNewInteraction] = useState({
    drug1: "", drug2: "", severity: "moderada", description: "", recommendation: ""
  });
  const [newContraindication, setNewContraindication] = useState({
    medicationName: "", contraindication: "", severity: "moderada", notes: ""
  });
  const [newDilution, setNewDilution] = useState({
    medicationName: "", route: "IV", dilutionNeeded: false, dilutionHow: "", infusionTime: "", compatibility: "", administrationNotes: ""
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

  const { data: dilutions = [], isLoading: loadingDilutions } = useQuery<DilutionItem[]>({
    queryKey: ["/api/medication-dilutions"],
  });

  const createDilutionMutation = useMutation({
    mutationFn: async (data: typeof newDilution) => {
      const res = await apiRequest("POST", "/api/medication-dilutions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-dilutions"] });
      toast({ title: "Diluição cadastrada!" });
      setIsAddingDilution(false);
      setNewDilution({ medicationName: "", route: "IV", dilutionNeeded: false, dilutionHow: "", infusionTime: "", compatibility: "", administrationNotes: "" });
    },
    onError: () => toast({ title: "Erro ao cadastrar", variant: "destructive" }),
  });

  const updateDilutionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DilutionItem> }) => {
      const res = await apiRequest("PUT", `/api/medication-dilutions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-dilutions"] });
      toast({ title: "Diluição atualizada!" });
      setEditingDilution(null);
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteDilutionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/medication-dilutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-dilutions"] });
      toast({ title: "Diluição removida!" });
    },
  });

  const bulkImportDilutionMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest("POST", "/api/medication-dilutions/bulk-import", { data });
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/medication-dilutions"] });
      toast({ title: `${result.imported} diluições importadas!` });
      setIsBulkImportDilution(false);
      setDilutionBulkData("");
    },
    onError: () => toast({ title: "Erro ao importar", variant: "destructive" }),
  });

  const routeOptions = [
    { value: "IV", label: "Intravenoso (IV)" },
    { value: "IM", label: "Intramuscular (IM)" },
    { value: "SC", label: "Subcutâneo (SC)" },
    { value: "VO", label: "Via Oral (VO)" },
    { value: "VR", label: "Via Retal (VR)" },
    { value: "Tópico", label: "Tópico" },
  ];

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

  if (loadingInteractions || loadingContraindications || loadingDilutions) {
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-blue-500" /> Diluições e Administração
            </CardTitle>
            <CardDescription>Cadastre informações de diluição e administração de medicamentos IV/IM/SC.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBulkImportDilution} onOpenChange={setIsBulkImportDilution}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1" data-testid="button-bulk-import-dilutions">
                  <Upload className="h-4 w-4" /> Importar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importar Diluições em Massa</DialogTitle>
                  <DialogDescription>
                    Formato: medicamento;via;requer_diluicao;como_diluir;tempo_infusao;compatibilidade;notas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={dilutionBulkData}
                    onChange={(e) => setDilutionBulkData(e.target.value)}
                    placeholder="Vancomicina;IV;sim;Diluir em 100-200mL SF;Infundir em 60min;Compatível com SF/SG5%;Nefrotóxico"
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="textarea-bulk-dilutions"
                  />
                  <Button
                    onClick={() => bulkImportDilutionMutation.mutate(dilutionBulkData)}
                    disabled={!dilutionBulkData.trim() || bulkImportDilutionMutation.isPending}
                    className="w-full"
                    data-testid="button-import-dilutions"
                  >
                    {bulkImportDilutionMutation.isPending ? "Importando..." : "Importar Diluições"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddingDilution} onOpenChange={setIsAddingDilution}>
              <DialogTrigger asChild>
                <Button className="gap-1" data-testid="button-add-dilution">
                  <Plus className="h-4 w-4" /> Nova Diluição
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Diluição</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Medicamento</label>
                      <Input
                        value={newDilution.medicationName}
                        onChange={(e) => setNewDilution({ ...newDilution, medicationName: e.target.value })}
                        placeholder="Ex: Vancomicina"
                        data-testid="input-dilution-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Via</label>
                      <select
                        className="w-full h-9 px-3 rounded-md border bg-background"
                        value={newDilution.route}
                        onChange={(e) => setNewDilution({ ...newDilution, route: e.target.value })}
                        data-testid="select-dilution-route"
                      >
                        {routeOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dilutionNeeded"
                      checked={newDilution.dilutionNeeded}
                      onChange={(e) => setNewDilution({ ...newDilution, dilutionNeeded: e.target.checked })}
                    />
                    <label htmlFor="dilutionNeeded" className="text-sm font-medium">Requer diluição</label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Como diluir</label>
                    <Input
                      value={newDilution.dilutionHow}
                      onChange={(e) => setNewDilution({ ...newDilution, dilutionHow: e.target.value })}
                      placeholder="Ex: Diluir em 100-200mL SF 0,9%"
                      data-testid="input-dilution-how"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tempo de infusão</label>
                    <Input
                      value={newDilution.infusionTime}
                      onChange={(e) => setNewDilution({ ...newDilution, infusionTime: e.target.value })}
                      placeholder="Ex: Infundir em 60 minutos"
                      data-testid="input-dilution-time"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Compatibilidade</label>
                    <Input
                      value={newDilution.compatibility}
                      onChange={(e) => setNewDilution({ ...newDilution, compatibility: e.target.value })}
                      placeholder="Ex: Compatível com SF, SG5%"
                      data-testid="input-dilution-compat"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notas de administração</label>
                    <Textarea
                      value={newDilution.administrationNotes}
                      onChange={(e) => setNewDilution({ ...newDilution, administrationNotes: e.target.value })}
                      placeholder="Observações importantes..."
                      data-testid="textarea-dilution-notes"
                    />
                  </div>
                  <Button
                    onClick={() => createDilutionMutation.mutate(newDilution)}
                    disabled={!newDilution.medicationName || createDilutionMutation.isPending}
                    className="w-full"
                    data-testid="button-save-dilution"
                  >
                    {createDilutionMutation.isPending ? "Salvando..." : "Salvar Diluição"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {dilutions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma diluição cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Via</TableHead>
                  <TableHead>Diluição</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dilutions.map((d) => (
                  <TableRow key={d.id} data-testid={`row-dilution-${d.id}`}>
                    <TableCell className="font-medium">{d.medicationName}</TableCell>
                    <TableCell><Badge variant="outline">{d.route}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{d.dilutionHow || "-"}</TableCell>
                    <TableCell className="text-sm">{d.infusionTime || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditingDilution(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteDilutionMutation.mutate(d.id)}>
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

      {editingDilution && (
        <Dialog open={!!editingDilution} onOpenChange={() => setEditingDilution(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Diluição</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Medicamento</label>
                  <Input
                    value={editingDilution.medicationName}
                    onChange={(e) => setEditingDilution({ ...editingDilution, medicationName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Via</label>
                  <select
                    className="w-full h-9 px-3 rounded-md border bg-background"
                    value={editingDilution.route}
                    onChange={(e) => setEditingDilution({ ...editingDilution, route: e.target.value })}
                  >
                    {routeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editDilutionNeeded"
                  checked={editingDilution.dilutionNeeded}
                  onChange={(e) => setEditingDilution({ ...editingDilution, dilutionNeeded: e.target.checked })}
                />
                <label htmlFor="editDilutionNeeded" className="text-sm font-medium">Requer diluição</label>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Como diluir</label>
                <Input
                  value={editingDilution.dilutionHow}
                  onChange={(e) => setEditingDilution({ ...editingDilution, dilutionHow: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tempo de infusão</label>
                <Input
                  value={editingDilution.infusionTime}
                  onChange={(e) => setEditingDilution({ ...editingDilution, infusionTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compatibilidade</label>
                <Input
                  value={editingDilution.compatibility}
                  onChange={(e) => setEditingDilution({ ...editingDilution, compatibility: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas de administração</label>
                <Textarea
                  value={editingDilution.administrationNotes}
                  onChange={(e) => setEditingDilution({ ...editingDilution, administrationNotes: e.target.value })}
                />
              </div>
              <Button
                onClick={() => updateDilutionMutation.mutate({ id: editingDilution.id, data: editingDilution })}
                disabled={updateDilutionMutation.isPending}
                className="w-full"
              >
                {updateDilutionMutation.isPending ? "Salvando..." : "Atualizar Diluição"}
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

interface Subscription {
  id: number;
  userId: string;
  planId: number;
  providerSubscriptionId: string | null;
  providerCustomerId: string | null;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextBillingDate: string | null;
  lastPaymentStatus: string | null;
  appliedCouponId: number | null;
  canceledAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Payment {
  id: number;
  subscriptionId: number | null;
  userId: string;
  providerPaymentId: string | null;
  amountCents: number;
  discountCents: number | null;
  status: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

function SubscriptionsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: subscriptions, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: payments, isLoading: loadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments", selectedSubscription?.id],
    queryFn: async () => {
      if (!selectedSubscription) return [];
      const res = await fetch(`/api/admin/payments/${selectedSubscription.userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedSubscription && dialogOpen,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      const res = await apiRequest("POST", `/api/admin/subscription/confirm-payment/${paymentId}`, {});
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/payments", selectedSubscription?.id] });
      toast({ title: "Pagamento confirmado!", description: "A assinatura do usuário foi ativada." });
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao confirmar pagamento", 
        description: error?.message || "Tente novamente.",
        variant: "destructive" 
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelada</Badge>;
      case "overdue":
        return <Badge className="bg-orange-500">Vencida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-orange-500">Vencido</Badge>;
      case "refunded":
        return <Badge variant="secondary">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) return <PageLoader text="Carregando assinaturas..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Assinaturas
            </CardTitle>
            <CardDescription>Gerencie assinaturas e confirme pagamentos manualmente</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions && subscriptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Próximo Venc.</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id}</TableCell>
                    <TableCell className="font-mono text-xs">{sub.userId.substring(0, 8)}...</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedSubscription?.id === sub.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (open) setSelectedSubscription(sub);
                        else setSelectedSubscription(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-view-payments-${sub.id}`}
                          >
                            Ver Pagamentos
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Pagamentos do Usuário</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {loadingPayments ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                              </div>
                            ) : payments && payments.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                      <TableCell>{payment.id}</TableCell>
                                      <TableCell>
                                        R$ {(payment.amountCents / 100).toFixed(2).replace(".", ",")}
                                        {payment.discountCents && payment.discountCents > 0 && (
                                          <span className="text-xs text-green-600 ml-1">
                                            (-R$ {(payment.discountCents / 100).toFixed(2).replace(".", ",")})
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>{payment.method || "-"}</TableCell>
                                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString("pt-BR") : "-"}
                                      </TableCell>
                                      <TableCell>
                                        {payment.status === "pending" && (
                                          <Button
                                            size="sm"
                                            onClick={() => confirmPaymentMutation.mutate(payment.id)}
                                            disabled={confirmPaymentMutation.isPending}
                                            data-testid={`button-confirm-payment-${payment.id}`}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Confirmar
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <p className="text-center text-muted-foreground py-4">Nenhum pagamento encontrado.</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma assinatura encontrada.</p>
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

      {/* Medicamentos Autorizados na Calculadora */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" /> Medicamentos Autorizados
            </CardTitle>
            <CardDescription>Controle quais medicamentos aparecem na calculadora rápida para usuários.</CardDescription>
          </div>
          <AllowedMedsDialog onSuccess={() => qc.invalidateQueries({ queryKey: ["/api/calculator-allowed-meds"] })} />
        </CardHeader>
        <CardContent>
          <AllowedMedsList />
        </CardContent>
      </Card>
    </div>
  );
}

function AllowedMedsDialog({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [patientType, setPatientType] = useState<string>("pediatrico");
  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);

  const { data: settings } = useQuery<CalcSetting[]>({
    queryKey: ["/api/calculator-settings"],
    queryFn: async () => {
      const res = await fetch("/api/calculator-settings", { credentials: "include" });
      return res.json();
    },
  });

  const filteredSettings = useMemo(() => {
    if (!settings) return [];
    return settings.filter(s => 
      s.calculatorMode === patientType || s.calculatorMode === "comum" || s.ageGroup === "ambos"
    );
  }, [settings, patientType]);

  const addMutation = useMutation({
    mutationFn: async (data: { patientType: string; calculatorSettingId: number }) => {
      const res = await apiRequest("POST", "/api/admin/calculator-allowed-meds", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Medicamento autorizado!" });
      onSuccess();
      setOpen(false);
      setSelectedSettingId(null);
    },
    onError: () => toast({ title: "Erro ao autorizar", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-add-allowed-med">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Autorizar Medicamento na Calculadora</DialogTitle>
          <DialogDescription>Escolha o modo e o medicamento para autorizar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Modo</label>
            <Select value={patientType} onValueChange={setPatientType}>
              <SelectTrigger data-testid="select-allowed-patient-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pediatrico">Pediátrico</SelectItem>
                <SelectItem value="adulto">Adulto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Medicamento</label>
            <Select 
              value={selectedSettingId?.toString() || ""} 
              onValueChange={(v) => setSelectedSettingId(parseInt(v))}
            >
              <SelectTrigger data-testid="select-allowed-med">
                <SelectValue placeholder="Selecione um medicamento" />
              </SelectTrigger>
              <SelectContent>
                {filteredSettings.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.medication}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => selectedSettingId && addMutation.mutate({ patientType, calculatorSettingId: selectedSettingId })}
              disabled={!selectedSettingId || addMutation.isPending}
              data-testid="button-confirm-allowed-med"
            >
              {addMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AllowedMedsList() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("pediatrico");

  const { data: allowedMeds, isLoading } = useQuery<any[]>({
    queryKey: ["/api/calculator-allowed-meds"],
    queryFn: async () => {
      const res = await fetch("/api/calculator-allowed-meds", { credentials: "include" });
      return res.json();
    },
  });

  const { data: settings } = useQuery<CalcSetting[]>({
    queryKey: ["/api/calculator-settings"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/calculator-allowed-meds/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/calculator-allowed-meds"] });
      toast({ title: "Medicamento removido!" });
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const filteredMeds = useMemo(() => {
    if (!allowedMeds) return [];
    return allowedMeds.filter(m => m.patientType === activeTab);
  }, [allowedMeds, activeTab]);

  const getMedName = (settingId: number) => {
    return settings?.find(s => s.id === settingId)?.medication || `ID: ${settingId}`;
  };

  if (isLoading) return <div className="py-4 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pediatrico" data-testid="tab-allowed-pedi">Pediátrico</TabsTrigger>
          <TabsTrigger value="adulto" data-testid="tab-allowed-adulto">Adulto</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="border rounded-md">
        {filteredMeds.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicamento</TableHead>
                <TableHead className="w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeds.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{getMedName(m.calculatorSettingId)}</TableCell>
                  <TableCell>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(m.id)}
                      data-testid={`button-remove-allowed-${m.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum medicamento autorizado para {activeTab === "pediatrico" ? "pediátrico" : "adulto"}.
          </div>
        )}
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
  const [prescBulkImportOpen, setPrescBulkImportOpen] = useState(false);
  const [prescBulkImportText, setPrescBulkImportText] = useState("");
  const [protocolImportDialogOpen, setProtocolImportDialogOpen] = useState(false);
  const [protocolImporting, setProtocolImporting] = useState(false);
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

  const prescBulkImportMutation = useMutation({
    mutationFn: async (prescriptions: any[]) => {
      const res = await apiRequest("POST", "/api/prescriptions/bulk-import", { prescriptions });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ 
        title: "Importação concluída!", 
        description: `${data.success} de ${data.total} prescrições importadas.${data.errors.length > 0 ? ` ${data.errors.length} erros.` : ''}`
      });
      setPrescBulkImportOpen(false);
      setPrescBulkImportText("");
    },
    onError: (err: any) => {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    },
  });

  const handlePrescBulkImport = () => {
    try {
      const lines = prescBulkImportText.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        toast({ title: "Nenhum dado para importar", variant: "destructive" });
        return;
      }

      const prescriptions = lines.map(line => {
        const parts = line.split(';').map(p => p.trim());
        return {
          title: parts[0] || '',
          medication: parts[1] || parts[0] || '',
          dose: parts[2] || null,
          interval: parts[3] || null,
          route: parts[4] || 'VO',
          duration: parts[5] || null,
          quantity: parts[6] || null,
          category: parts[7] || null,
          ageGroup: parts[8] || 'adulto',
          orientation: parts[9] || null,
          observations: parts[10] || null
        };
      }).filter(p => p.title || p.medication);

      if (prescriptions.length === 0) {
        toast({ title: "Nenhuma prescrição válida encontrada", variant: "destructive" });
        return;
      }

      prescBulkImportMutation.mutate(prescriptions);
    } catch (err) {
      toast({ title: "Erro ao processar dados", description: "Verifique o formato do texto", variant: "destructive" });
    }
  };

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
          <div className="flex gap-2 flex-wrap">
            <Dialog open={prescBulkImportOpen} onOpenChange={setPrescBulkImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1" data-testid="button-bulk-import-prescriptions">
                  <Upload className="h-4 w-4" /> Importar em Massa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Importação em Massa de Prescrições</DialogTitle>
                  <DialogDescription>
                    Cole os dados das prescrições no formato: Título;Medicação;Dose;Intervalo;Via;Duração;Quantidade;Categoria;FaixaEtária;Orientação;Observações
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium mb-2">Formato (separado por ponto-e-vírgula):</p>
                    <code className="text-xs block">Febre;Dipirona 500mg;1g;6/6h;VO;5 dias;;;adulto;;</code>
                    <code className="text-xs block">IVAS;Amoxicilina Susp;50mg/kg/dia;8/8h;VO;7 dias;;Infecto;pediatrico;Retornar se não melhorar;</code>
                  </div>
                  <Textarea 
                    value={prescBulkImportText}
                    onChange={(e) => setPrescBulkImportText(e.target.value)}
                    placeholder="Cole aqui as prescrições (uma por linha)..."
                    rows={10}
                    className="font-mono text-sm"
                    data-testid="textarea-bulk-import-prescriptions"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setPrescBulkImportOpen(false)}>Cancelar</Button>
                    <Button onClick={handlePrescBulkImport} disabled={prescBulkImportMutation.isPending || !prescBulkImportText.trim()}>
                      {prescBulkImportMutation.isPending ? "Importando..." : "Importar Prescrições"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
            <Dialog open={protocolImportDialogOpen} onOpenChange={setProtocolImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1" data-testid="button-import-protocols">
                  <Upload className="h-4 w-4" /> Importar em massa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Importar Protocolos em Massa</DialogTitle>
                  <DialogDescription>Cole dados em CSV ou JSON para importar múltiplos protocolos.</DialogDescription>
                </DialogHeader>
                <ProtocolBulkImportContent 
                  onClose={() => setProtocolImportDialogOpen(false)}
                  importing={protocolImporting}
                  setImporting={setProtocolImporting}
                  qc={qc}
                  toast={toast}
                />
              </DialogContent>
            </Dialog>
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
  const [medAgeFilter, setMedAgeFilter] = useState<string>("all");

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
                        <label className="text-sm font-medium">Filtrar por faixa etária</label>
                        <Select value={medAgeFilter} onValueChange={setMedAgeFilter}>
                          <SelectTrigger data-testid="select-pathology-med-age-filter">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="adulto">Adulto</SelectItem>
                            <SelectItem value="pediatrico">Pediátrico</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Selecione uma medicação *</label>
                        <select 
                          value={selectedMedicationId} 
                          onChange={(e) => setSelectedMedicationId(e.target.value)}
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                          data-testid="select-medication"
                        >
                          <option value="">-- Escolha uma medicação --</option>
                          {libraryMedications
                            .filter(m => medAgeFilter === "all" || m.ageGroup === medAgeFilter || m.ageGroup === "ambos")
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} {m.presentation && `(${m.presentation})`} - {m.dose || "sem dose"} {m.route || ""} [{m.ageGroup || "adulto"}]
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
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1" data-testid="button-import-pathologies">
                <Upload className="h-4 w-4" /> Importar em massa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Patologias em Massa</DialogTitle>
                <DialogDescription>Cole dados em CSV ou JSON para importar múltiplas patologias.</DialogDescription>
              </DialogHeader>
              <PathologyBulkImportContent 
                onClose={() => setImportDialogOpen(false)}
                importing={importing}
                setImporting={setImporting}
                qc={qc}
                toast={toast}
              />
            </DialogContent>
          </Dialog>
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

interface BulkImportResult {
  created: number;
  updated: number;
  errors: string[];
}

function PathologyBulkImportContent({ 
  onClose, 
  importing, 
  setImporting, 
  qc, 
  toast 
}: { 
  onClose: () => void; 
  importing: boolean; 
  setImporting: (v: boolean) => void; 
  qc: ReturnType<typeof useQueryClient>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [upsert, setUpsert] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const parseData = () => {
    if (!importData.trim()) {
      setPreview([]);
      return;
    }
    try {
      if (importFormat === "json") {
        const parsed = JSON.parse(importData);
        const items = parsed.pathologies || [];
        setPreview(items.slice(0, 5));
      } else {
        const lines = importData.trim().split('\n').filter(l => l.trim());
        const items = lines.map(line => {
          const parts = line.split(';').map(p => p.trim());
          return {
            name: parts[0] || '',
            description: parts[1] || '',
            ageGroup: parts[2] || 'adulto',
            specialty: parts[3] || '',
            tags: parts[4] ? parts[4].split(',').map(t => t.trim()) : []
          };
        }).filter(p => p.name);
        setPreview(items.slice(0, 5));
      }
    } catch {
      setPreview([]);
    }
  };

  useEffect(() => {
    parseData();
  }, [importData, importFormat]);

  const handleImport = async () => {
    if (!importData.trim()) {
      toast({ title: "Dados vazios", variant: "destructive" });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/import/pathologies", {
        data: importData,
        format: importFormat,
        upsert
      });
      const data = await res.json();
      setResult(data);
      qc.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ 
        title: "Importação concluída!", 
        description: `${data.created} criadas, ${data.updated} atualizadas${data.errors?.length > 0 ? `, ${data.errors.length} erros` : ''}`
      });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Formato</label>
        <Select value={importFormat} onValueChange={(v) => setImportFormat(v as "csv" | "json")}>
          <SelectTrigger data-testid="select-pathology-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV (separado por ;)</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {importFormat === "csv" 
            ? "Formato: name;description;ageGroup;specialty;tags (separadas por vírgula)"
            : 'Formato: { "pathologies": [{ "name": "...", "description": "...", "ageGroup": "adulto", "specialty": "...", "tags": [] }] }'
          }
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Dados para importar</label>
        <Textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder={importFormat === "csv" 
            ? "Pneumonia;Pneumonia comunitária;adulto;Pneumologia;infecção,respiratório\nITU;Infecção urinária;adulto;Infectologia;infecção"
            : '{\n  "pathologies": [\n    { "name": "Pneumonia", "ageGroup": "adulto" }\n  ]\n}'
          }
          rows={6}
          data-testid="textarea-pathology-import"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox 
          id="upsert-pathology" 
          checked={upsert} 
          onCheckedChange={(c) => setUpsert(c === true)} 
          data-testid="checkbox-pathology-upsert"
        />
        <label htmlFor="upsert-pathology" className="text-sm cursor-pointer">
          Adicionar e atualizar existentes (upsert)
        </label>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Pré-visualização ({preview.length} itens)</label>
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50 text-xs space-y-1">
            {preview.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Badge variant="outline">{p.ageGroup || 'adulto'}</Badge>
                <span className="font-medium">{p.name}</span>
                {p.specialty && <span className="text-muted-foreground">({p.specialty})</span>}
              </div>
            ))}
            {preview.length === 5 && <div className="text-muted-foreground">... e mais itens</div>}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="default">{result.created} criadas</Badge>
            <Badge variant="secondary">{result.updated} atualizadas</Badge>
            {result.errors?.length > 0 && <Badge variant="destructive">{result.errors.length} erros</Badge>}
          </div>
          {result.errors?.length > 0 && (
            <div className="max-h-24 overflow-y-auto border rounded-md p-2 bg-destructive/10 text-xs">
              {result.errors.map((e, i) => (
                <div key={i} className="text-destructive">{e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
        <Button onClick={handleImport} disabled={importing || !importData.trim()} className="gap-1">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? "Importando..." : "Importar"}
        </Button>
      </div>
    </div>
  );
}

function ProtocolBulkImportContent({ 
  onClose, 
  importing, 
  setImporting, 
  qc, 
  toast 
}: { 
  onClose: () => void; 
  importing: boolean; 
  setImporting: (v: boolean) => void; 
  qc: ReturnType<typeof useQueryClient>;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("csv");
  const [upsert, setUpsert] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const parseData = () => {
    if (!importData.trim()) {
      setPreview([]);
      return;
    }
    try {
      if (importFormat === "json") {
        const parsed = JSON.parse(importData);
        const items = parsed.protocols || [];
        setPreview(items.slice(0, 5));
      } else {
        const lines = importData.trim().split('\n').filter(l => l.trim());
        const items = lines.map(line => {
          const parts = line.split(';').map(p => p.trim());
          return {
            title: parts[0] || '',
            content: parts[1] || '',
            specialty: parts[2] || '',
            category: parts[3] || '',
            tags: parts[4] ? parts[4].split(',').map(t => t.trim()) : []
          };
        }).filter(p => p.title);
        setPreview(items.slice(0, 5));
      }
    } catch {
      setPreview([]);
    }
  };

  useEffect(() => {
    parseData();
  }, [importData, importFormat]);

  const handleImport = async () => {
    if (!importData.trim()) {
      toast({ title: "Dados vazios", variant: "destructive" });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/admin/import/protocols", {
        data: importData,
        format: importFormat,
        upsert
      });
      const data = await res.json();
      setResult(data);
      qc.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ 
        title: "Importação concluída!", 
        description: `${data.created} criados, ${data.updated} atualizados${data.errors?.length > 0 ? `, ${data.errors.length} erros` : ''}`
      });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <label className="text-sm font-medium">Formato</label>
        <Select value={importFormat} onValueChange={(v) => setImportFormat(v as "csv" | "json")}>
          <SelectTrigger data-testid="select-protocol-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV (separado por ;)</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {importFormat === "csv" 
            ? "Formato: title;content;specialty;category;tags (separadas por vírgula)"
            : 'Formato: { "protocols": [{ "title": "...", "content": "...", "specialty": "...", "category": "...", "tags": [] }] }'
          }
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Dados para importar</label>
        <Textarea
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder={importFormat === "csv" 
            ? "Protocolo IAM;Conteúdo do protocolo...;Cardiologia;Emergência;cardio,urgência"
            : '{\n  "protocols": [\n    { "title": "Protocolo IAM", "content": "...", "specialty": "Cardiologia" }\n  ]\n}'
          }
          rows={6}
          data-testid="textarea-protocol-import"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox 
          id="upsert-protocol" 
          checked={upsert} 
          onCheckedChange={(c) => setUpsert(c === true)} 
          data-testid="checkbox-protocol-upsert"
        />
        <label htmlFor="upsert-protocol" className="text-sm cursor-pointer">
          Adicionar e atualizar existentes (upsert)
        </label>
      </div>

      {preview.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Pré-visualização ({preview.length} itens)</label>
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50 text-xs space-y-1">
            {preview.map((p, i) => (
              <div key={i} className="flex gap-2">
                <span className="font-medium">{p.title}</span>
                {p.specialty && <span className="text-muted-foreground">({p.specialty})</span>}
              </div>
            ))}
            {preview.length === 5 && <div className="text-muted-foreground">... e mais itens</div>}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge variant="default">{result.created} criados</Badge>
            <Badge variant="secondary">{result.updated} atualizados</Badge>
            {result.errors?.length > 0 && <Badge variant="destructive">{result.errors.length} erros</Badge>}
          </div>
          {result.errors?.length > 0 && (
            <div className="max-h-24 overflow-y-auto border rounded-md p-2 bg-destructive/10 text-xs">
              {result.errors.map((e, i) => (
                <div key={i} className="text-destructive">{e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Fechar</Button>
        <Button onClick={handleImport} disabled={importing || !importData.trim()} className="gap-1">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {importing ? "Importando..." : "Importar"}
        </Button>
      </div>
    </div>
  );
}

function MedicationLibraryManagement({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [importMode, setImportMode] = useState<"upsert" | "create">("upsert");
  const [ageGroupFilter, setAgeGroupFilter] = useState<"all" | "adulto" | "pediatrico" | "ambos">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: medicationsList, isLoading } = useQuery<any[]>({
    queryKey: ["/api/medications"],
  });

  const categories = useMemo(() => {
    if (!medicationsList) return [];
    const cats = new Set(medicationsList.map(m => m.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [medicationsList]);

  const filteredMedications = useMemo(() => {
    if (!medicationsList) return [];
    return medicationsList.filter(m => {
      if (ageGroupFilter !== "all" && m.ageGroup !== ageGroupFilter && m.ageGroup !== "ambos") return false;
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (searchQuery && !m.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [medicationsList, ageGroupFilter, categoryFilter, searchQuery]);

  const bulkImportMutation = useMutation({
    mutationFn: async ({ medications, mode }: { medications: any[]; mode: string }) => {
      const res = await apiRequest("POST", "/api/medications/bulk-import", { medications, mode });
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ 
        title: "Importação concluída!", 
        description: `${data.success} de ${data.total} medicações importadas.${data.errors.length > 0 ? ` ${data.errors.length} erros.` : ''}`
      });
      setBulkImportOpen(false);
      setBulkImportText("");
    },
    onError: (err: any) => {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    },
  });

  const handleBulkImport = () => {
    try {
      const lines = bulkImportText.trim().split('\n').filter(l => l.trim());
      if (lines.length === 0) {
        toast({ title: "Nenhum dado para importar", variant: "destructive" });
        return;
      }

      const medications = lines.map(line => {
        const parts = line.split(';').map(p => p.trim());
        return {
          name: parts[0] || '',
          category: parts[1] || null,
          dose: parts[2] || null,
          interval: parts[3] || null,
          route: parts[4] || null,
          dosePerKg: parts[5] || null,
          maxDose: parts[6] || null,
          duration: parts[7] || null,
          ageGroup: parts[8] || 'adulto',
          observations: parts[9] || null
        };
      }).filter(m => m.name);

      if (medications.length === 0) {
        toast({ title: "Nenhuma medicação válida encontrada", variant: "destructive" });
        return;
      }

      bulkImportMutation.mutate({ medications, mode: importMode });
    } catch (err) {
      toast({ title: "Erro ao processar dados", description: "Verifique o formato do texto", variant: "destructive" });
    }
  };

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

  const batchActivateMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/admin/medications/batch-activate", { ids });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medicações ativadas!" });
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    onError: () => toast({ title: "Erro ao ativar", variant: "destructive" }),
  });

  const batchDeactivateMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/admin/medications/batch-deactivate", { ids });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medicações desativadas!" });
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    onError: () => toast({ title: "Erro ao desativar", variant: "destructive" }),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await apiRequest("POST", "/api/admin/medications/batch-delete", { ids });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({ title: "Medicações removidas!" });
      setSelectedIds(new Set());
      setSelectionMode(false);
    },
    onError: () => toast({ title: "Erro ao remover", variant: "destructive" }),
  });

  const handleExport = async (format: "csv" | "json") => {
    const ids = Array.from(selectedIds);
    const res = await fetch(`/api/admin/medications/export?format=${format}&ids=${ids.join(",")}`, { credentials: "include" });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medications.${format}`;
    a.click();
    toast({ title: `Exportado em ${format.toUpperCase()}!` });
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredMedications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedications.map(m => m.id)));
    }
  };

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
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={selectionMode ? "default" : "outline"} 
            className="gap-1"
            onClick={() => { setSelectionMode(!selectionMode); setSelectedIds(new Set()); }}
            data-testid="button-selection-mode"
          >
            <CheckSquare className="h-4 w-4" /> {selectionMode ? "Sair Seleção" : "Modo Seleção"}
          </Button>
          <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1" data-testid="button-bulk-import-medications">
                <Upload className="h-4 w-4" /> Importar em Massa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importação em Massa de Medicações</DialogTitle>
                <DialogDescription>
                  Cole os dados das medicações no formato: Nome;Categoria;Dose;Intervalo;Via;Dose/kg;DoseMáx;Duração;FaixaEtária;Observações
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium mb-2">Formato (separado por ponto-e-vírgula):</p>
                  <code className="text-xs block">Dipirona 500mg;Analgésicos;1g;6/6h;VO;;;;</code>
                  <code className="text-xs block">Amoxicilina;Antibióticos;50mg/kg/dia;8/8h;VO;50mg/kg;3g/dia;7 dias;pediatrico;</code>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modo de Importação</label>
                  <select 
                    value={importMode} 
                    onChange={(e) => setImportMode(e.target.value as "upsert" | "create")}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="upsert">Atualizar existentes e criar novos</option>
                    <option value="create">Apenas criar novos (ignorar duplicados)</option>
                  </select>
                </div>
                <Textarea 
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="Cole aqui as medicações (uma por linha)..."
                  rows={10}
                  className="font-mono text-sm"
                  data-testid="textarea-bulk-import"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setBulkImportOpen(false)}>Cancelar</Button>
                  <Button onClick={handleBulkImport} disabled={bulkImportMutation.isPending || !bulkImportText.trim()}>
                    {bulkImportMutation.isPending ? "Importando..." : "Importar Medicações"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Tabs value={ageGroupFilter} onValueChange={(v) => setAgeGroupFilter(v as any)} className="flex-shrink-0">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-med-all">Todos</TabsTrigger>
              <TabsTrigger value="adulto" data-testid="tab-med-adulto">Adulto</TabsTrigger>
              <TabsTrigger value="pediatrico" data-testid="tab-med-pediatrico">Pediatria</TabsTrigger>
              <TabsTrigger value="ambos" data-testid="tab-med-ambos">Ambos</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-med-category">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
            data-testid="input-med-search"
          />
          <Badge variant="secondary" className="ml-auto">{filteredMedications.length} medicações</Badge>
        </div>
        {selectionMode && selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">{selectedIds.size} selecionado(s)</span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" variant="outline" onClick={() => batchActivateMutation.mutate(Array.from(selectedIds))} data-testid="button-batch-activate">
                <Power className="h-4 w-4 mr-1" /> Ativar
              </Button>
              <Button size="sm" variant="outline" onClick={() => batchDeactivateMutation.mutate(Array.from(selectedIds))} data-testid="button-batch-deactivate">
                <PowerOff className="h-4 w-4 mr-1" /> Desativar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-batch-export">
                    <Download className="h-4 w-4 mr-1" /> Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("json")}>JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="destructive" onClick={() => batchDeleteMutation.mutate(Array.from(selectedIds))} data-testid="button-batch-delete">
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        )}
        {filteredMedications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {selectionMode && (
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedIds.size === filteredMedications.length && filteredMedications.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                )}
                <TableHead>Medicação</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead>Via</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedications.map((m) => (
                <TableRow key={m.id}>
                  {selectionMode && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(m.id)} 
                        onCheckedChange={() => toggleSelection(m.id)}
                        data-testid={`checkbox-med-${m.id}`}
                      />
                    </TableCell>
                  )}
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
            {medicationsList && medicationsList.length > 0 
              ? "Nenhuma medicação encontrada com os filtros selecionados."
              : "Nenhuma medicação cadastrada. Clique em \"Nova Medicação\" para criar sua biblioteca de medicamentos."}
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

function DashboardConfigTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: dashboardItems, isLoading: dashboardLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/dashboard-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard-config", { credentials: "include" });
      return res.json();
    },
  });

  const { data: quickAccessItems, isLoading: qaLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/quick-access-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/quick-access-config", { credentials: "include" });
      return res.json();
    },
  });

  const dashboardMutation = useMutation({
    mutationFn: async (data: { itemType: string; itemId: string; label: string; order: number; isActive: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/dashboard-config", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/dashboard-config"] });
      toast({ title: "Item do dashboard salvo!" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const quickAccessMutation = useMutation({
    mutationFn: async (data: { itemType: string; itemId: string; label: string; icon: string; order: number; isActive: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/quick-access-config", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/quick-access-config"] });
      toast({ title: "Item de acesso rápido salvo!" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteDashboardItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/dashboard-config/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/dashboard-config"] });
      toast({ title: "Item removido!" });
    },
  });

  const deleteQuickAccessItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/quick-access-config/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/quick-access-config"] });
      toast({ title: "Item removido!" });
    },
  });

  const [newDashboardItem, setNewDashboardItem] = useState({ itemType: "protocol", itemId: "", label: "", order: 1, isActive: true });
  const [newQuickAccessItem, setNewQuickAccessItem] = useState({ itemType: "route", itemId: "", label: "", icon: "FileText", order: 1, isActive: true });

  if (dashboardLoading || qaLoading) return <PageLoader text="Carregando configurações..." />;

  return (
    <div className="space-y-6">
      {/* Dashboard Config */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" /> Itens do Dashboard
            </CardTitle>
            <CardDescription>Configure quais itens aparecem no dashboard do usuário.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newDashboardItem.itemType} onValueChange={(v) => setNewDashboardItem({...newDashboardItem, itemType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="protocol">Protocolo</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="prescription">Prescrição</SelectItem>
                  <SelectItem value="calculator">Calculadora</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">ID do Item</label>
              <Input value={newDashboardItem.itemId} onChange={(e) => setNewDashboardItem({...newDashboardItem, itemId: e.target.value})} placeholder="ex: 1" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rótulo</label>
              <Input value={newDashboardItem.label} onChange={(e) => setNewDashboardItem({...newDashboardItem, label: e.target.value})} placeholder="Nome exibido" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ordem</label>
              <Input type="number" value={newDashboardItem.order} onChange={(e) => setNewDashboardItem({...newDashboardItem, order: parseInt(e.target.value) || 1})} />
            </div>
            <Button onClick={() => dashboardMutation.mutate(newDashboardItem)} disabled={!newDashboardItem.label} data-testid="button-add-dashboard-item">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="w-[60px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardItems?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline">{item.itemType}</Badge></TableCell>
                    <TableCell>{item.itemId}</TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{item.order}</TableCell>
                    <TableCell>{item.isActive ? <Badge>Sim</Badge> : <Badge variant="secondary">Não</Badge>}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDashboardItem.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!dashboardItems || dashboardItems.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum item configurado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Acesso Rápido
          </CardTitle>
          <CardDescription>Configure os atalhos do menu de acesso rápido.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newQuickAccessItem.itemType} onValueChange={(v) => setNewQuickAccessItem({...newQuickAccessItem, itemType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="route">Rota</SelectItem>
                  <SelectItem value="action">Ação</SelectItem>
                  <SelectItem value="external">Link Externo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">ID/Rota</label>
              <Input value={newQuickAccessItem.itemId} onChange={(e) => setNewQuickAccessItem({...newQuickAccessItem, itemId: e.target.value})} placeholder="/prescricoes" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Rótulo</label>
              <Input value={newQuickAccessItem.label} onChange={(e) => setNewQuickAccessItem({...newQuickAccessItem, label: e.target.value})} placeholder="Nome" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ícone</label>
              <Input value={newQuickAccessItem.icon} onChange={(e) => setNewQuickAccessItem({...newQuickAccessItem, icon: e.target.value})} placeholder="FileText" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Ordem</label>
              <Input type="number" value={newQuickAccessItem.order} onChange={(e) => setNewQuickAccessItem({...newQuickAccessItem, order: parseInt(e.target.value) || 1})} />
            </div>
            <Button onClick={() => quickAccessMutation.mutate(newQuickAccessItem)} disabled={!newQuickAccessItem.label} data-testid="button-add-qa-item">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>ID/Rota</TableHead>
                  <TableHead>Rótulo</TableHead>
                  <TableHead>Ícone</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="w-[60px]">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quickAccessItems?.map(item => (
                  <TableRow key={item.id}>
                    <TableCell><Badge variant="outline">{item.itemType}</Badge></TableCell>
                    <TableCell>{item.itemId}</TableCell>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>{item.icon}</TableCell>
                    <TableCell>{item.order}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteQuickAccessItem.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!quickAccessItems || quickAccessItems.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum item configurado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DonationsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [causeDialogOpen, setCauseDialogOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<any>(null);
  const [causeName, setCauseName] = useState("");
  const [causeDescription, setCauseDescription] = useState("");
  const [causeTarget, setCauseTarget] = useState("");
  const [causeIsActive, setCauseIsActive] = useState(true);
  const [causeDestinationType, setCauseDestinationType] = useState("PIX");
  const [causeDestinationKey, setCauseDestinationKey] = useState("");

  const { data: causes, isLoading: causesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/donation-causes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/donation-causes", { credentials: "include" });
      return res.json();
    },
  });

  const { data: donations, isLoading: donationsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/donations"],
    queryFn: async () => {
      const res = await fetch("/api/admin/donations", { credentials: "include" });
      return res.json();
    },
  });

  const createCauseMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/donation-causes", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/donation-causes"] });
      toast({ title: "Causa criada!" });
      resetCauseForm();
      setCauseDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar causa", variant: "destructive" }),
  });

  const updateCauseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/donation-causes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/donation-causes"] });
      toast({ title: "Causa atualizada!" });
      resetCauseForm();
      setCauseDialogOpen(false);
    },
    onError: () => toast({ title: "Erro ao atualizar causa", variant: "destructive" }),
  });

  const deleteCauseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/donation-causes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/donation-causes"] });
      toast({ title: "Causa removida!" });
    },
    onError: () => toast({ title: "Erro ao remover causa", variant: "destructive" }),
  });

  const resetCauseForm = () => {
    setCauseName("");
    setCauseDescription("");
    setCauseTarget("");
    setCauseIsActive(true);
    setCauseDestinationType("PIX");
    setCauseDestinationKey("");
    setEditingCause(null);
  };

  const openEditCause = (cause: any) => {
    setEditingCause(cause);
    setCauseName(cause.name);
    setCauseDescription(cause.description || "");
    setCauseTarget(cause.targetAmount?.toString() || "");
    setCauseIsActive(cause.isActive !== false);
    setCauseDestinationType(cause.destinationType || "PIX");
    setCauseDestinationKey(cause.destinationKey || "");
    setCauseDialogOpen(true);
  };

  const handleSaveCause = () => {
    const data = {
      name: causeName,
      description: causeDescription,
      targetAmount: causeTarget ? parseFloat(causeTarget) : null,
      isActive: causeIsActive,
      destinationType: causeDestinationType,
      destinationKey: causeDestinationKey,
    };
    if (editingCause) {
      updateCauseMutation.mutate({ id: editingCause.id, data });
    } else {
      createCauseMutation.mutate(data);
    }
  };

  const statusColors: Record<string, string> = {
    CREATED: "outline",
    PAID: "default",
    TRANSFERRED: "secondary",
    FAILED: "destructive",
    REFUNDED: "secondary",
  };

  if (causesLoading || donationsLoading) return <PageLoader text="Carregando doações..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" /> Causas de Doação
            </CardTitle>
            <CardDescription>Gerencie as causas disponíveis para doação.</CardDescription>
          </div>
          <Dialog open={causeDialogOpen} onOpenChange={(open) => { setCauseDialogOpen(open); if (!open) resetCauseForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-add-cause">
                <Plus className="h-4 w-4" /> Nova Causa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCause ? "Editar Causa" : "Nova Causa de Doação"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Causa</label>
                  <Input value={causeName} onChange={(e) => setCauseName(e.target.value)} placeholder="Ex: Ajuda para Creche" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea value={causeDescription} onChange={(e) => setCauseDescription(e.target.value)} placeholder="Descreva a causa..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meta (R$)</label>
                    <Input type="number" value={causeTarget} onChange={(e) => setCauseTarget(e.target.value)} placeholder="1000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo Destino</label>
                    <Select value={causeDestinationType} onValueChange={setCauseDestinationType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PIX">PIX</SelectItem>
                        <SelectItem value="BANK">Conta Bancária</SelectItem>
                        <SelectItem value="LINK">Link Externo</SelectItem>
                        <SelectItem value="INTERNAL">Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chave/Destino</label>
                  <Input value={causeDestinationKey} onChange={(e) => setCauseDestinationKey(e.target.value)} placeholder="Chave PIX, conta, ou link" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={causeIsActive} onCheckedChange={(c) => setCauseIsActive(c === true)} id="causeActive" />
                  <label htmlFor="causeActive" className="text-sm">Causa ativa</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCauseDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleSaveCause} disabled={!causeName} data-testid="button-save-cause">
                    {editingCause ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Arrecadado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {causes?.map(cause => (
                  <TableRow key={cause.id}>
                    <TableCell className="font-medium">{cause.name}</TableCell>
                    <TableCell><Badge variant="outline">{cause.destinationType}</Badge></TableCell>
                    <TableCell>{cause.targetAmount ? `R$ ${Number(cause.targetAmount).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>R$ {Number(cause.currentAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>{cause.isActive ? <Badge>Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEditCause(cause)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCauseMutation.mutate(cause.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!causes || causes.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma causa cadastrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Histórico de Doações
          </CardTitle>
          <CardDescription>Todas as doações recebidas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Doador</TableHead>
                  <TableHead>Causa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations?.map(donation => (
                  <TableRow key={donation.id}>
                    <TableCell>{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString("pt-BR") : "-"}</TableCell>
                    <TableCell>{donation.donorName || "Anônimo"}</TableCell>
                    <TableCell>{causes?.find(c => c.id === donation.causeId)?.name || "-"}</TableCell>
                    <TableCell>R$ {Number(donation.amount || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge variant={statusColors[donation.status] as any || "outline"}>{donation.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(!donations || donations.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma doação registrada.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
