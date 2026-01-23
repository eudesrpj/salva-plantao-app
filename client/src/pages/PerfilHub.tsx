/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Edit,
  FileText,
  Calendar,
  CheckSquare,
  Palette,
  Settings,
  Save
} from "lucide-react";

export default function PerfilHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (user?.firstName && user?.lastName) {
      setDisplayName(user.firstName + " " + user.lastName);
    }
  }, [user]);

  const updateDisplayNameMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/display-name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Salvo!", description: "Nome atualizado com sucesso." });
      setIsEditingName(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar nome.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header with Display Name */}
        <div className="mb-8 text-center">
          <div className="inline-block px-6 py-4 bg-white rounded-lg shadow-sm border border-purple-100 mb-4">
            <p className="text-sm text-slate-600">Bem-vindo(a) de volta</p>
            {isEditingName ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold text-center"
                  placeholder="Seu nome"
                />
                <Button
                  size="sm"
                  onClick={() => updateDisplayNameMutation.mutate()}
                  disabled={updateDisplayNameMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-2">
                <h1 className="text-3xl font-bold text-purple-900">Dr(a). {displayName}</h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-purple-600 hover:text-purple-900 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info" className="text-xs md:text-sm">
              <User className="h-4 w-4 mr-1" />
              Info
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs md:text-sm">
              <FileText className="h-4 w-4 mr-1" />
              Anotações
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs md:text-sm">
              <CheckSquare className="h-4 w-4 mr-1" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">
              <Settings className="h-4 w-4 mr-1" />
              Config
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>Informações pessoais e profissionais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <Input value={user?.email || ""} disabled className="mt-1" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Primeiro Nome</label>
                    <Input value={user?.firstName || ""} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Último Nome</label>
                    <Input value={user?.lastName || ""} disabled className="mt-1" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Para alterar informações básicas, acesse as Configurações do app.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Anotações</CardTitle>
                <CardDescription>Suas anotações pessoais</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Anotações
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Agenda/Calendário</CardTitle>
                <CardDescription>Visualize seus compromissos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Acessar Plantões
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Seus plantões são exibidos na seção de Plantões
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas/Lembretes</CardTitle>
                <CardDescription>Gerencie suas tarefas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Gerenciar Tarefas
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Funcionalidade em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalização</CardTitle>
                <CardDescription>Tema, idioma e preferências</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Palette className="h-4 w-4 mr-2" />
                  Tema (Claro/Escuro)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Preferências de Mensagem do Dia
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerenciar Privacidade
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Personalize sua experiência no app
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
