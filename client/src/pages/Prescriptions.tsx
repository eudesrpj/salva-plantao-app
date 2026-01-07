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
import { Search, Plus, Copy, Trash2, Lock, FileText, Baby, User } from "lucide-react";
import { PageLoader } from "@/components/ui/loading-spinner";
import type { Prescription } from "@shared/schema";

const INTERVALS = ["6/6h", "8/8h", "12/12h", "1x/dia", "2x/dia", "3x/dia", "Dose única", "SOS"];
const DURATIONS = ["3 dias", "5 dias", "7 dias", "10 dias", "14 dias", "Uso contínuo", "Uso indeterminado"];
const ROUTES = ["VO", "IV", "IM", "SC", "Tópico", "Retal", "Sublingual", "Inalatório"];
const TIMINGS = ["Jejum", "Com alimentação", "Antes de dormir", "Longe das refeições"];
const CATEGORIES = ["Analgesia", "Antibióticos", "Anti-inflamatórios", "Antieméticos", "Cardiovascular", "Neurologia", "Gastro", "Outros"];

export default function Prescriptions() {
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

  const filtered = prescriptions?.filter(p => 
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
          <PrescriptionDialog ageGroup={ageGroup} isAdmin={isAdmin} />
        </div>
      </header>

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

      {isLoading ? (
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
              <p>Nenhuma prescrição encontrada.</p>
            </div>
          )}
        </div>
      )}
    </div>
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

function PrescriptionDialog({ ageGroup, isAdmin }: { ageGroup: string; isAdmin: boolean }) {
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
    const data = {
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
      isPublic: isAdmin && formData.get("isPublic") === "on",
      isLocked: isAdmin && formData.get("isLocked") === "on",
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25" data-testid="button-new-prescription">
          <Plus className="mr-2 h-4 w-4" /> Nova Prescrição
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Prescrição ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})</DialogTitle>
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

          {isAdmin && (
            <div className="flex gap-6 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="rounded" />
                <span>Modelo Oficial (público)</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isLocked" className="rounded" />
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
