import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Trash2, Lock, ClipboardList, Baby, User, ChevronRight, AlertTriangle, Zap } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { PreviewGate } from "@/components/PreviewGate";
import type { Protocol } from "@shared/schema";

const SPECIALTIES = ["Cardiologia", "Pneumologia", "Neurologia", "Gastroenterologia", "Infectologia", "Pediatria", "Emergência", "Clínica Geral", "Outros"];
const CATEGORIES = ["Urgência", "Emergência", "Ambulatório", "UTI", "Enfermaria"];

export default function Protocols() {
  const [ageGroup, setAgeGroup] = useState<"adulto" | "pediatrico">("adulto");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: protocols, isLoading } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols", ageGroup],
    queryFn: async () => {
      const res = await fetch(`/api/protocols?ageGroup=${ageGroup}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = protocols?.filter(p => 
    !searchQuery || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered?.reduce((acc, p) => {
    const spec = p.specialty || "Outros";
    if (!acc[spec]) acc[spec] = [];
    acc[spec].push(p);
    return acc;
  }, {} as Record<string, Protocol[]>);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Protocolos Clínicos</h1>
          <p className="text-slate-500">Condutas padronizadas para tomada de decisão rápida.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={ageGroup} onValueChange={(v) => setAgeGroup(v as "adulto" | "pediatrico")} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="adulto" className="gap-1">
                <User className="h-4 w-4" /> Adulto
              </TabsTrigger>
              <TabsTrigger value="pediatrico" className="gap-1">
                <Baby className="h-4 w-4" /> Pediátrico
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <ProtocolDialog ageGroup={ageGroup} isAdmin={isAdmin} />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar protocolo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-protocols"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <PageLoader text="Carregando protocolos..." />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {grouped && Object.entries(grouped).map(([specialty, items]) => (
              <div key={specialty}>
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  {specialty}
                </h2>
                <div className="space-y-3">
                  {items.map((protocol) => (
                    <Card 
                      key={protocol.id} 
                      className={`p-4 cursor-pointer transition-all ${selectedProtocol?.id === protocol.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                      onClick={() => setSelectedProtocol(protocol)}
                      data-testid={`card-protocol-${protocol.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{protocol.title}</h3>
                            {protocol.isLocked && <Lock className="h-3 w-3 text-slate-400" />}
                          </div>
                          {protocol.description && (
                            <p className="text-sm text-slate-500 line-clamp-2">{protocol.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {protocol.category && (
                              <Badge variant={protocol.category === "Emergência" || protocol.category === "Urgência" ? "destructive" : "secondary"} className="text-xs">
                                {protocol.category}
                              </Badge>
                            )}
                            {protocol.isPublic && <Badge variant="outline" className="text-xs">Oficial</Badge>}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {(!grouped || Object.keys(grouped).length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum protocolo encontrado.</p>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-4 h-fit">
            {selectedProtocol ? (
              <ProtocolDetailCard protocol={selectedProtocol} isAdmin={isAdmin} onClose={() => setSelectedProtocol(null)} />
            ) : (
              <Card className="p-6 text-center text-slate-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um protocolo para ver os detalhes.</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProtocolDetailCard({ protocol, isAdmin, onClose }: { protocol: Protocol; isAdmin: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const content = protocol.content as any;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/protocols/${protocol.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: "Removido!" });
      onClose();
    },
  });

  const canDelete = isAdmin || (!protocol.isPublic && !protocol.isLocked);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{protocol.title}</h3>
          {protocol.description && <p className="text-sm text-slate-500 mt-1">{protocol.description}</p>}
        </div>
        {canDelete && (
          <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate()} className="text-red-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {protocol.category && (
          <Badge variant={protocol.category === "Emergência" ? "destructive" : "secondary"}>
            {protocol.category === "Emergência" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {protocol.category === "Urgência" && <Zap className="h-3 w-3 mr-1" />}
            {protocol.category}
          </Badge>
        )}
        {protocol.specialty && <Badge variant="outline">{protocol.specialty}</Badge>}
      </div>

      <PreviewGate>
        {content?.steps && (
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700">Etapas</h4>
            <ol className="space-y-2">
              {content.steps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {content?.criteria && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700">Critérios</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {content.criteria.map((c: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">-</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content?.redFlags && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" /> Red Flags
            </h4>
            <ul className="text-sm text-red-600 space-y-1">
              {content.redFlags.map((rf: string, i: number) => (
                <li key={i}>- {rf}</li>
              ))}
            </ul>
          </div>
        )}
      </PreviewGate>
    </Card>
  );
}

function ProtocolDialog({ ageGroup, isAdmin }: { ageGroup: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protocols"] });
      toast({ title: "Criado!", description: "Protocolo salvo com sucesso." });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const stepsText = formData.get("steps") as string;
    const criteriaText = formData.get("criteria") as string;
    const redFlagsText = formData.get("redFlags") as string;

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      specialty: formData.get("specialty") as string,
      category: formData.get("category") as string,
      ageGroup,
      content: {
        steps: stepsText.split("\n").filter(s => s.trim()),
        criteria: criteriaText.split("\n").filter(s => s.trim()),
        redFlags: redFlagsText.split("\n").filter(s => s.trim()),
      },
      isPublic: isAdmin && formData.get("isPublic") === "on",
      isLocked: isAdmin && formData.get("isLocked") === "on",
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25" data-testid="button-new-protocol">
          <Plus className="mr-2 h-4 w-4" /> Novo Protocolo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Protocolo ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input name="title" required placeholder="Ex: Protocolo de Sepse" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea name="description" placeholder="Breve descrição do protocolo..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidade</label>
              <Select name="specialty" defaultValue="Clínica Geral">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select name="category" defaultValue="Ambulatório">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Etapas (uma por linha)</label>
            <Textarea name="steps" placeholder="1. Avaliar sinais vitais&#10;2. Solicitar exames&#10;3. Iniciar tratamento" rows={4} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Critérios (um por linha)</label>
            <Textarea name="criteria" placeholder="Critério 1&#10;Critério 2" rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Red Flags (um por linha)</label>
            <Textarea name="redFlags" placeholder="Sinal de alarme 1&#10;Sinal de alarme 2" rows={3} />
          </div>

          {isAdmin && (
            <div className="flex gap-6 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="rounded" />
                <span>Protocolo Oficial</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isLocked" className="rounded" />
                <span>Bloquear edição</span>
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Salvando..." : "Salvar Protocolo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
