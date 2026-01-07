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
import { Loader2, CheckCircle, Ban, ShieldAlert, Save, Users, Settings, FileText, CreditCard, BarChart3 } from "lucide-react";
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
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1">
            <CreditCard className="h-4 w-4" /> Pagamento
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

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

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

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

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
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Prescrições Oficiais</CardTitle>
            <CardDescription>Gerencie modelos de prescrições.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Gerenciar</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Protocolos</CardTitle>
            <CardDescription>Edite protocolos clínicos oficiais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Gerenciar</Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Biblioteca</CardTitle>
            <CardDescription>Adicione vídeos e materiais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">Gerenciar</Button>
          </CardContent>
        </Card>
      </div>
      <p className="text-sm text-slate-500 text-center">
        Dica: Acesse as páginas de Prescrições, Protocolos ou Memorização e marque a opção "Oficial" ao criar conteúdo.
      </p>
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
