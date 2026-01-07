import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Copy, Trash2, Lock, FileText, Baby, User, BookOpen, Heart, ChevronDown, ChevronRight, Pill } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Prescription, Pathology, PathologyMedication } from "@shared/schema";

const INTERVALS = ["6/6h", "8/8h", "12/12h", "1x/dia", "2x/dia", "3x/dia", "Dose única", "SOS"];
const DURATIONS = ["3 dias", "5 dias", "7 dias", "10 dias", "14 dias", "Uso contínuo", "Uso indeterminado"];
const ROUTES = ["VO", "IV", "IM", "SC", "Tópico", "Retal", "Sublingual", "Inalatório"];
const TIMINGS = ["Jejum", "Com alimentação", "Antes de dormir", "Longe das refeições"];
const CATEGORIES = ["Analgesia", "Antibióticos", "Anti-inflamatórios", "Antieméticos", "Cardiovascular", "Neurologia", "Gastro", "Outros"];

export default function Prescriptions() {
  const [mainTab, setMainTab] = useState<"oficiais" | "minhas" | "patologias">("patologias");
  const [ageGroup, setAgeGroup] = useState<"adulto" | "pediatrico">("adulto");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions", ageGroup],
    queryFn: async () => {
      const res = await fetch(`/api/prescriptions?ageGroup=${ageGroup}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const officialPrescriptions = prescriptions?.filter(p => p.isPublic || p.isLocked);
  const myPrescriptions = prescriptions?.filter(p => p.userId === user?.id && !p.isPublic && !p.isLocked);

  const currentList = mainTab === "oficiais" ? officialPrescriptions : myPrescriptions;

  const filtered = currentList?.filter(p => 
    !searchQuery || 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.medication?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered?.reduce((acc, p) => {
    const cat = p.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Prescription[]>);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Prescrições</h1>
          <p className="text-slate-500">Modelos prontos para uso rápido no plantão.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={ageGroup} onValueChange={(v) => setAgeGroup(v as "adulto" | "pediatrico")} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="adulto" className="gap-1" data-testid="tab-adulto">
                <User className="h-4 w-4" /> Adulto
              </TabsTrigger>
              <TabsTrigger value="pediatrico" className="gap-1" data-testid="tab-pediatrico">
                <Baby className="h-4 w-4" /> Pediátrico
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {(isAdmin || mainTab === "minhas") && (
            <PrescriptionDialog ageGroup={ageGroup} isAdmin={isAdmin} isPersonal={mainTab === "minhas"} />
          )}
        </div>
      </header>
      
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "oficiais" | "minhas" | "patologias")} className="w-auto">
        <TabsList className="w-auto">
          <TabsTrigger value="patologias" className="gap-1" data-testid="tab-patologias">
            <FileText className="h-4 w-4" /> Por Patologia
          </TabsTrigger>
          <TabsTrigger value="oficiais" className="gap-1" data-testid="tab-oficiais">
            <BookOpen className="h-4 w-4" /> Todas Oficiais
          </TabsTrigger>
          <TabsTrigger value="minhas" className="gap-1" data-testid="tab-minhas">
            <Heart className="h-4 w-4" /> Minhas Prescrições
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar prescrição..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-prescriptions"
        />
      </div>

      {mainTab === "patologias" ? (
        <PathologiesView ageGroup={ageGroup} searchQuery={searchQuery} isAdmin={isAdmin} />
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <PageLoader text="Carregando prescrições..." />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped && Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {category}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((prescription) => (
                  <PrescriptionCard key={prescription.id} prescription={prescription} isAdmin={isAdmin} userId={user?.id} />
                ))}
              </div>
            </div>
          ))}

          {(!grouped || Object.keys(grouped).length === 0) && (
            <div className="text-center py-12 text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {mainTab === "minhas" ? (
                <>
                  <p className="mb-2">Você ainda não tem prescrições pessoais.</p>
                  <p className="text-sm">Clique em "Nova Minha Prescrição" para criar a sua primeira.</p>
                </>
              ) : (
                <p>Nenhuma prescrição oficial encontrada.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PathologiesView({ ageGroup, searchQuery, isAdmin }: { ageGroup: string; searchQuery: string; isAdmin: boolean }) {
  const { toast } = useToast();
  const [expandedPathologies, setExpandedPathologies] = useState<Set<number>>(new Set());

  const { data: pathologies, isLoading } = useQuery<Pathology[]>({
    queryKey: ["/api/pathologies", ageGroup],
    queryFn: async () => {
      const res = await fetch(`/api/pathologies?ageGroup=${ageGroup}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = pathologies?.filter(p => 
    (p.isPublic || p.isLocked) && (
      !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const grouped = filtered?.reduce((acc, p) => {
    const cat = p.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, Pathology[]>);

  const toggleExpanded = (id: number) => {
    setExpandedPathologies(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <PageLoader text="Carregando patologias..." />
      </div>
    );
  }

  if (!grouped || Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma patologia encontrada.</p>
        {isAdmin && <p className="text-sm mt-2">Acesse o painel Admin para adicionar patologias.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {category}
          </h2>
          <div className="space-y-3">
            {items.map((pathology) => (
              <PathologyCard 
                key={pathology.id} 
                pathology={pathology} 
                isExpanded={expandedPathologies.has(pathology.id)}
                onToggle={() => toggleExpanded(pathology.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PathologyCard({ pathology, isExpanded, onToggle }: { pathology: Pathology; isExpanded: boolean; onToggle: () => void }) {
  const { toast } = useToast();

  const { data: medications, isLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    queryFn: async () => {
      const res = await fetch(`/api/pathologies/${pathology.id}/medications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isExpanded,
  });

  const copyAllMedications = () => {
    if (!medications || medications.length === 0) return;
    
    const text = medications.map(m => {
      const parts = [
        m.medication,
        m.quantity || "",
        m.dose ? `Tomar ${m.dose}, ${m.route || "VO"}, ${m.interval || ""} por ${m.duration || ""}` : "",
        m.observations || "",
      ].filter(Boolean);
      return parts.join("\n");
    }).join("\n\n---\n\n");
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Todas as medicações foram copiadas." });
  };

  const copySingleMedication = (med: PathologyMedication) => {
    const parts = [
      med.medication,
      med.quantity || "",
      med.dose ? `Tomar ${med.dose}, ${med.route || "VO"}, ${med.interval || ""} por ${med.duration || ""}` : "",
      med.observations || "",
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n"));
    toast({ title: "Copiado!", description: `${med.medication} copiado.` });
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-pathology-${pathology.id}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  {pathology.name}
                  {pathology.isLocked && <Lock className="h-3 w-3 text-slate-400" />}
                </h3>
                {pathology.description && (
                  <p className="text-sm text-slate-500">{pathology.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pathology.isPublic && <Badge variant="secondary" className="text-xs">Oficial</Badge>}
              {pathology.ageGroup === "pediatrico" && <Badge className="text-xs bg-pink-100 text-pink-700">Pediátrico</Badge>}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">Carregando medicações...</div>
            ) : medications && medications.length > 0 ? (
              <>
                <div className="flex justify-end py-2">
                  <Button size="sm" variant="outline" onClick={copyAllMedications} className="gap-1">
                    <Copy className="h-3 w-3" /> Copiar Tudo
                  </Button>
                </div>
                <div className="space-y-3">
                  {medications.map((med, idx) => (
                    <div key={med.id} className="p-3 bg-background rounded-md border flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="h-4 w-4 text-primary" />
                          <span className="font-medium">{med.medication}</span>
                          {med.maxDose && <Badge variant="outline" className="text-xs">Max: {med.maxDose}</Badge>}
                        </div>
                        <div className="text-sm text-slate-600 space-y-0.5">
                          {med.dose && <p><strong>Dose:</strong> {med.dose} {med.dosePerKg && `(${med.dosePerKg}/kg)`}</p>}
                          {med.interval && <p><strong>Intervalo:</strong> {med.interval}</p>}
                          {med.duration && <p><strong>Duração:</strong> {med.duration}</p>}
                          {med.route && <p><strong>Via:</strong> {med.route}</p>}
                          {med.quantity && <p><strong>Quantidade:</strong> {med.quantity}</p>}
                          {med.timing && <p><strong>Horário:</strong> {med.timing}</p>}
                          {med.observations && <p className="text-slate-500 italic">{med.observations}</p>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => copySingleMedication(med)} className="shrink-0">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                Nenhuma medicação cadastrada para esta patologia.
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function PrescriptionCard({ prescription, isAdmin, userId }: { prescription: Prescription; isAdmin: boolean; userId?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prescriptions/${prescription.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Removido!" });
    },
  });

  const copyToClipboard = () => {
    let text = "";
    if (prescription.medication) {
      const parts = [
        `${prescription.medication}`,
        prescription.quantity ? `${prescription.quantity}` : null,
        "",
        prescription.dose ? `Tomar ${prescription.dose}, ${prescription.route || "VO"}, ${prescription.interval || ""} por ${prescription.duration || ""}` : null,
        prescription.timing ? `Uso: ${prescription.timing}` : null,
        prescription.patientNotes ? `Observações: ${prescription.patientNotes}` : null,
      ].filter(Boolean);
      text = parts.join("\n");
    } else {
      text = prescription.content || prescription.title;
    }
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Prescrição copiada para a área de transferência." });
  };

  const canDelete = isAdmin || (prescription.userId === userId && !prescription.isLocked);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group" data-testid={`card-prescription-${prescription.id}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900">{prescription.title}</h3>
          {prescription.isLocked && <Lock className="h-3 w-3 text-slate-400" />}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={copyToClipboard} className="h-7 w-7">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {canDelete && (
            <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate()} className="h-7 w-7 text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {prescription.medication && (
        <div className="space-y-1 text-sm text-slate-600 mb-3">
          <p><strong>Medicação:</strong> {prescription.medication}</p>
          {prescription.dose && <p><strong>Dose:</strong> {prescription.dose}</p>}
          {prescription.interval && <p><strong>Intervalo:</strong> {prescription.interval}</p>}
          {prescription.duration && <p><strong>Duração:</strong> {prescription.duration}</p>}
        </div>
      )}

      {!prescription.medication && prescription.content && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-3">{prescription.content}</p>
      )}

      <div className="flex flex-wrap gap-1">
        {prescription.isPublic && <Badge variant="secondary" className="text-xs">Oficial</Badge>}
        {prescription.ageGroup === "pediatrico" && <Badge className="text-xs bg-pink-100 text-pink-700">Pediátrico</Badge>}
        {prescription.tags?.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
        ))}
      </div>
    </Card>
  );
}

function PrescriptionDialog({ ageGroup, isAdmin, isPersonal = false }: { ageGroup: string; isAdmin: boolean; isPersonal?: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({ title: "Criado!", description: "Prescrição salva com sucesso." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar prescrição.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const route = formData.get("route") as string;
    const timing = formData.get("timing") as string;
    const data: Record<string, any> = {
      title: formData.get("title") as string,
      medication: formData.get("medication") as string,
      dose: formData.get("dose") as string,
      interval: formData.get("interval") as string,
      quantity: formData.get("quantity") as string,
      duration: formData.get("duration") as string,
      route: route || "VO",
      timing: timing || null,
      patientNotes: formData.get("patientNotes") as string,
      category: formData.get("category") as string,
      ageGroup,
      content: `${formData.get("medication")} ${formData.get("dose")}, ${route || "VO"}, ${formData.get("interval")}, por ${formData.get("duration")}`,
    };

    if (isAdmin && !isPersonal) {
      data.isPublic = formData.get("isPublic") === "on";
      data.isLocked = formData.get("isLocked") === "on";
    }

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25" data-testid="button-new-prescription">
          <Plus className="mr-2 h-4 w-4" /> {isPersonal ? "Nova Minha Prescrição" : "Nova Prescrição Oficial"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isPersonal ? "Minha Prescrição" : "Prescrição Oficial"} ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título / Nome</label>
            <Input name="title" required placeholder="Ex: Dipirona para dor" data-testid="input-title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Medicação</label>
              <Input name="medication" placeholder="Ex: Dipirona" data-testid="input-medication" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dose</label>
              <Input name="dose" placeholder="Ex: 1g, 500mg" data-testid="input-dose" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo</label>
              <Select name="interval" defaultValue="6/6h">
                <SelectTrigger data-testid="select-interval">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input name="quantity" placeholder="Ex: 20 comprimidos" data-testid="input-quantity" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração</label>
              <Select name="duration" defaultValue="7 dias">
                <SelectTrigger data-testid="select-duration">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Via</label>
              <Select name="route" defaultValue="VO">
                <SelectTrigger data-testid="select-route">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário/Alimentação</label>
              <Select name="timing" defaultValue="">
                <SelectTrigger data-testid="select-timing">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select name="category" defaultValue="Outros">
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações do Paciente</label>
            <Textarea name="patientNotes" placeholder="Instruções adicionais..." rows={2} data-testid="textarea-notes" />
          </div>

          {isAdmin && !isPersonal && (
            <div className="flex gap-6 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="rounded" defaultChecked />
                <span>Modelo Oficial (público)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isLocked" className="rounded" defaultChecked />
                <span>Bloquear edição</span>
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit">
            {createMutation.isPending ? "Salvando..." : "Salvar Prescrição"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
