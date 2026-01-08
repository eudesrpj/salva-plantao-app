import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Copy, Trash2, Lock, FileText, Baby, User, Heart, ChevronDown, ChevronRight, Pill, FolderPlus, PlusCircle, Edit, X, Printer, Share2, Download, AlertTriangle, ShieldAlert } from "lucide-react";
import { QuickPrintButton, SUSPrescriptionPrint } from "@/components/SUSPrescriptionPrint";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PreviewGate } from "@/components/PreviewGate";
import { PrescriptionSuggestionAssistant } from "@/components/PrescriptionSuggestionAssistant";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Prescription, Pathology, PathologyMedication, Medication, PrescriptionFavorite } from "@shared/schema";

const INTERVALS = ["6/6h", "8/8h", "12/12h", "1x/dia", "2x/dia", "3x/dia", "Dose única", "SOS"];
const DURATIONS = ["3 dias", "5 dias", "7 dias", "10 dias", "14 dias", "Uso contínuo", "Uso indeterminado"];
const ROUTES = ["VO", "IV", "IM", "SC", "Tópico", "Retal", "Sublingual", "Inalatório"];
const TIMINGS = ["Jejum", "Com alimentação", "Antes de dormir", "Longe das refeições"];
const CATEGORIES = ["Analgesia", "Antibióticos", "Anti-inflamatórios", "Antieméticos", "Cardiovascular", "Neurologia", "Gastro", "Outros"];
const PATHOLOGY_CATEGORIES = ["Infectologia", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia", "Ortopedia", "Dermatologia", "Endocrinologia", "Nefrologia", "Outros"];

const ALLERGY_CLASSES: Record<string, string[]> = {
  "penicilina": ["amoxicilina", "ampicilina", "amoxicilina+clavulanato", "oxacilina", "penicilina", "piperacilina"],
  "cefalosporina": ["cefalexina", "cefazolina", "ceftriaxona", "cefuroxima", "cefepime", "ceftazidima"],
  "sulfa": ["sulfametoxazol", "sulfadiazina", "sulfassalazina", "bactrim", "cotrimoxazol"],
  "aine": ["ibuprofeno", "diclofenaco", "naproxeno", "cetoprofeno", "piroxicam", "meloxicam", "nimesulida", "tenoxicam", "ácido acetilsalicílico", "aspirina"],
  "dipirona": ["dipirona", "metamizol", "novalgina"],
  "aas": ["ácido acetilsalicílico", "aspirina", "aas"],
  "macrolídeo": ["azitromicina", "claritromicina", "eritromicina"],
  "fluoroquinolona": ["ciprofloxacino", "levofloxacino", "moxifloxacino", "norfloxacino", "ofloxacino"],
  "opióide": ["morfina", "tramadol", "codeína", "oxicodona", "fentanil", "metadona"],
  "benzodiazepínico": ["diazepam", "clonazepam", "lorazepam", "alprazolam", "midazolam"],
  "contraste iodado": ["contraste iodado", "iodo"],
  "látex": ["látex"],
};

const COMMON_ALLERGIES = [
  "Penicilina", "Cefalosporina", "Sulfa", "AINE", "Dipirona", "AAS", 
  "Macrolídeo", "Fluoroquinolona", "Opióide", "Benzodiazepínico", 
  "Contraste Iodado", "Látex"
];

function checkMedicationAllergy(medicationName: string, patientAllergies: string[]): boolean {
  if (!medicationName || patientAllergies.length === 0) return false;
  
  const medLower = medicationName.toLowerCase();
  
  for (const allergy of patientAllergies) {
    const allergyLower = allergy.toLowerCase().trim();
    if (!allergyLower) continue;
    
    if (medLower.includes(allergyLower) || allergyLower.includes(medLower)) {
      return true;
    }
    
    const classKey = Object.keys(ALLERGY_CLASSES).find(k => 
      allergyLower.includes(k) || k.includes(allergyLower)
    );
    
    if (classKey) {
      const classMeds = ALLERGY_CLASSES[classKey];
      if (classMeds.some(m => medLower.includes(m) || m.includes(medLower))) {
        return true;
      }
    }
  }
  
  return false;
}

export default function Prescriptions() {
  const [mainTab, setMainTab] = useState<"minhas" | "patologias">("patologias");
  const [ageGroup, setAgeGroup] = useState<"adulto" | "pediatrico">("adulto");
  const [searchQuery, setSearchQuery] = useState("");
  const [draftPrescription, setDraftPrescription] = useState<Prescription | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [patientAllergies, setPatientAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [showAllergyFilter, setShowAllergyFilter] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";

  const addAllergy = () => {
    if (allergyInput.trim() && !patientAllergies.includes(allergyInput.trim())) {
      setPatientAllergies([...patientAllergies, allergyInput.trim()]);
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setPatientAllergies(patientAllergies.filter(a => a !== allergy));
  };

  const addCommonAllergy = (allergy: string) => {
    if (!patientAllergies.includes(allergy)) {
      setPatientAllergies([...patientAllergies, allergy]);
    }
  };

  const handleSuggestionSelect = (prescription: Prescription) => {
    setDraftPrescription(prescription);
    setShowDraftDialog(true);
    toast({
      title: "Sugestão carregada",
      description: "Revise os dados antes de confirmar.",
    });
  };

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions", ageGroup],
    queryFn: async () => {
      const res = await fetch(`/api/prescriptions?ageGroup=${ageGroup}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const myPrescriptions = prescriptions?.filter(p => p.userId === user?.id && !p.isPublic && !p.isLocked);

  const currentList = myPrescriptions;

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
          {isAdmin && mainTab === "patologias" && (
            <PathologyDialog ageGroup={ageGroup} isAdmin={true} />
          )}
          {mainTab === "minhas" && (
            <UserPathologyDialog ageGroup={ageGroup} />
          )}
          {(isAdmin || mainTab === "minhas") && mainTab !== "patologias" && (
            <PrescriptionDialog ageGroup={ageGroup} isAdmin={isAdmin} isPersonal={mainTab === "minhas"} />
          )}
        </div>
      </header>
      
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "minhas" | "patologias")} className="w-auto">
        <TabsList className="w-auto">
          <TabsTrigger value="patologias" className="gap-1" data-testid="tab-patologias">
            <FileText className="h-4 w-4" /> Por Patologia
          </TabsTrigger>
          <TabsTrigger value="minhas" className="gap-1" data-testid="tab-minhas">
            <Heart className="h-4 w-4" /> Minhas Prescrições
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar prescrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-prescriptions"
            />
          </div>
          <Button 
            variant={showAllergyFilter ? "default" : "outline"} 
            onClick={() => setShowAllergyFilter(!showAllergyFilter)}
            className="gap-2"
            data-testid="button-toggle-allergy-filter"
          >
            <ShieldAlert className="h-4 w-4" />
            {patientAllergies.length > 0 ? `Alergias (${patientAllergies.length})` : "Filtrar Alergias"}
          </Button>
        </div>

        {showAllergyFilter && (
          <Card className="p-4 bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Filtro de Alergias do Paciente</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">
                Digite as alergias do paciente para ocultar medicamentos contraindicados.
              </p>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Penicilina, AAS..."
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                  className="flex-1 bg-white dark:bg-slate-900"
                  data-testid="input-allergy"
                />
                <Button onClick={addAllergy} size="sm" data-testid="button-add-allergy">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {COMMON_ALLERGIES.filter(a => !patientAllergies.includes(a)).map(allergy => (
                  <Badge 
                    key={allergy} 
                    variant="outline" 
                    className="cursor-pointer text-xs hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => addCommonAllergy(allergy)}
                    data-testid={`badge-common-allergy-${allergy}`}
                  >
                    + {allergy}
                  </Badge>
                ))}
              </div>

              {patientAllergies.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-red-200 dark:border-red-800">
                  {patientAllergies.map(allergy => (
                    <Badge 
                      key={allergy} 
                      variant="destructive" 
                      className="gap-1 cursor-pointer"
                      onClick={() => removeAllergy(allergy)}
                      data-testid={`badge-patient-allergy-${allergy}`}
                    >
                      {allergy}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-red-600"
                    onClick={() => setPatientAllergies([])}
                    data-testid="button-clear-allergies"
                  >
                    Limpar todas
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <PrescriptionSuggestionAssistant 
        currentAgeGroup={ageGroup}
        onSelectSuggestion={handleSuggestionSelect}
      />

      {draftPrescription && (
        <DraftPrescriptionDialog
          draft={draftPrescription}
          open={showDraftDialog}
          onOpenChange={setShowDraftDialog}
          onClose={() => {
            setDraftPrescription(null);
            setShowDraftDialog(false);
          }}
        />
      )}

      {mainTab === "patologias" ? (
        <PathologiesView ageGroup={ageGroup} searchQuery={searchQuery} isAdmin={isAdmin} patientAllergies={patientAllergies} />
      ) : mainTab === "minhas" ? (
        <UserPathologiesView ageGroup={ageGroup} searchQuery={searchQuery} patientAllergies={patientAllergies} />
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
              <p>Nenhuma prescrição oficial encontrada.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DraftPrescriptionDialog({ 
  draft, 
  open, 
  onOpenChange, 
  onClose 
}: { 
  draft: Prescription; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: draft.title || "",
    medication: draft.medication || "",
    dose: draft.dose || "",
    pharmaceuticalForm: draft.pharmaceuticalForm || "",
    interval: draft.interval || "",
    duration: draft.duration || "",
    route: draft.route || "",
    timing: draft.timing || "",
    quantity: draft.quantity || "",
    patientNotes: draft.patientNotes || "",
    orientations: draft.orientations || "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prescription-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          originalPrescriptionId: draft.id,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescription-favorites"] });
      toast({ title: "Salvo!", description: "Prescrição salva como favorito." });
      onClose();
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar prescrição.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Sugestão Carregada como Rascunho
          </DialogTitle>
        </DialogHeader>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Revise e edite os dados conforme necessário antes de confirmar.
          </p>
        </div>
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-draft-title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Medicamento</label>
              <Input
                value={formData.medication}
                onChange={(e) => setFormData(prev => ({ ...prev, medication: e.target.value }))}
                data-testid="input-draft-medication"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dose</label>
              <Input
                value={formData.dose}
                onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                data-testid="input-draft-dose"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Forma Farmacêutica</label>
              <Select 
                value={formData.pharmaceuticalForm} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, pharmaceuticalForm: v }))}
              >
                <SelectTrigger data-testid="select-draft-form">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comprimido">Comprimido</SelectItem>
                  <SelectItem value="Gotas">Gotas</SelectItem>
                  <SelectItem value="Xarope">Xarope</SelectItem>
                  <SelectItem value="Solução/Ampola">Solução/Ampola</SelectItem>
                  <SelectItem value="Cápsula">Cápsula</SelectItem>
                  <SelectItem value="Pomada">Pomada</SelectItem>
                  <SelectItem value="Suspensão">Suspensão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Intervalo</label>
              <Select 
                value={formData.interval} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, interval: v }))}
              >
                <SelectTrigger data-testid="select-draft-interval">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Via</label>
              <Select 
                value={formData.route} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, route: v }))}
              >
                <SelectTrigger data-testid="select-draft-route">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Duração</label>
              <Select 
                value={formData.duration} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, duration: v }))}
              >
                <SelectTrigger data-testid="select-draft-duration">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Ex: 1 caixa"
                data-testid="input-draft-quantity"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Orientações / Sinais de Alarme</label>
            <Textarea
              value={formData.orientations}
              onChange={(e) => setFormData(prev => ({ ...prev, orientations: e.target.value }))}
              placeholder="Orientações ao paciente..."
              className="min-h-[80px]"
              data-testid="input-draft-orientations"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} data-testid="button-draft-cancel">
            Cancelar
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending}
            data-testid="button-draft-save"
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar como Favorito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareFavoriteButton({ favoriteId }: { favoriteId: number }) {
  const { toast } = useToast();
  const [shareToken, setShareToken] = useState<string | null>(null);

  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/prescription-favorites/${favoriteId}/share`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      setShareToken(data.token);
      const shareUrl = `${window.location.origin}/prescricoes?import=${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copiado!", description: "Envie o link para outro usuário importar esta prescrição." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao gerar link de compartilhamento.", variant: "destructive" });
    },
  });

  return (
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-6 w-6"
      onClick={() => shareMutation.mutate()}
      disabled={shareMutation.isPending}
      title="Compartilhar prescrição"
    >
      <Share2 className="h-3 w-3" />
    </Button>
  );
}

function ImportPrescriptionDialog() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (importToken: string) => {
      const getRes = await fetch(`/api/prescription-favorites/import/${importToken}`, { credentials: "include" });
      if (!getRes.ok) throw new Error("Prescrição não encontrada");
      const prescriptionData = await getRes.json();
      
      const createRes = await fetch("/api/prescription-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${prescriptionData.title} (importado)`,
          ...prescriptionData,
        }),
        credentials: "include",
      });
      if (!createRes.ok) throw new Error("Falha ao importar");
      return createRes.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescription-favorites"] });
      toast({ title: "Importado!", description: "Prescrição importada com sucesso." });
      setOpen(false);
      setToken("");
    },
    onError: () => {
      toast({ title: "Erro", description: "Token inválido ou prescrição não encontrada.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-import-prescription">
          <Download className="h-4 w-4" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Prescrição Compartilhada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cole o código de compartilhamento ou o link completo enviado por outro médico.
          </p>
          <Input
            value={token}
            onChange={(e) => {
              let value = e.target.value;
              if (value.includes("import=")) {
                const match = value.match(/import=([a-zA-Z0-9]+)/);
                if (match) value = match[1];
              }
              setToken(value);
            }}
            placeholder="Cole o link ou código aqui..."
            data-testid="input-import-token"
          />
          <Button 
            onClick={() => importMutation.mutate(token)} 
            disabled={!token || importMutation.isPending}
            className="w-full"
            data-testid="button-confirm-import"
          >
            {importMutation.isPending ? "Importando..." : "Importar Prescrição"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FavoritesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery<PrescriptionFavorite[]>({
    queryKey: ["/api/prescription-favorites"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/prescription-favorites/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescription-favorites"] });
      toast({ title: "Removido!", description: "Favorito removido com sucesso." });
    },
  });

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Carregando favoritos...</div>;
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Medicações Favoritas
          </h3>
          <ImportPrescriptionDialog />
        </div>
        <div className="text-center py-6 text-slate-400 border rounded-md bg-muted/20">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum favorito salvo ainda.</p>
          <p className="text-xs mt-1">Clique no coração ao lado de uma medicação oficial para salvá-la.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          Medicações Favoritas ({favorites.length})
        </h3>
        <ImportPrescriptionDialog />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {favorites.map((fav) => (
          <Card key={fav.id} className="p-3 group" data-testid={`card-favorite-${fav.id}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-sm">{fav.title}</h4>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ShareFavoriteButton favoriteId={fav.id} />
                <QuickPrintButton prescription={fav} />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-red-400"
                  onClick={() => deleteMutation.mutate(fav.id)}
                  title="Remover favorito"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-0.5">
              {fav.medication && <p><strong>Medicação:</strong> {fav.medication}</p>}
              {fav.dose && <p><strong>Dose:</strong> {fav.dose}</p>}
              {fav.interval && <p><strong>Intervalo:</strong> {fav.interval}</p>}
              {fav.duration && <p><strong>Duração:</strong> {fav.duration}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UserPathologiesView({ ageGroup, searchQuery, patientAllergies }: { ageGroup: string; searchQuery: string; patientAllergies: string[] }) {
  const { toast } = useToast();
  const [expandedPathologies, setExpandedPathologies] = useState<Set<number>>(new Set());

  const { data: pathologies, isLoading } = useQuery<Pathology[]>({
    queryKey: ["/api/pathologies", "mine", ageGroup],
    queryFn: async () => {
      const res = await fetch(`/api/pathologies/my?ageGroup=${ageGroup}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = pathologies?.filter(p => 
    !searchQuery || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPathologies = filtered?.sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

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
        <PageLoader text="Carregando suas patologias..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FavoritesSection />

      {(!sortedPathologies || sortedPathologies.length === 0) ? (
        <div className="text-center py-8 text-slate-400 border rounded-md bg-muted/20">
          <FolderPlus className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="mb-2">Você ainda não tem patologias pessoais.</p>
          <p className="text-sm">Clique em "Nova Patologia" para criar a sua primeira.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPathologies.map((pathology) => (
            <UserPathologyCard 
              key={pathology.id} 
              pathology={pathology} 
              isExpanded={expandedPathologies.has(pathology.id)}
              onToggle={() => toggleExpanded(pathology.id)}
              ageGroup={ageGroup}
              patientAllergies={patientAllergies}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PathologiesView({ ageGroup, searchQuery, isAdmin, patientAllergies }: { ageGroup: string; searchQuery: string; isAdmin: boolean; patientAllergies: string[] }) {
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

  const sortedPathologies = filtered?.sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

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

  if (!sortedPathologies || sortedPathologies.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma patologia encontrada.</p>
        {isAdmin && <p className="text-sm mt-2">Acesse o painel Admin para adicionar patologias.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedPathologies.map((pathology) => (
        <PathologyCard 
          key={pathology.id} 
          pathology={pathology} 
          isExpanded={expandedPathologies.has(pathology.id)}
          onToggle={() => toggleExpanded(pathology.id)}
          patientAllergies={patientAllergies}
        />
      ))}
    </div>
  );
}

const ROUTE_NAMES: Record<string, string> = {
  "VO": "via oral",
  "IV": "via intravenosa",
  "IM": "via intramuscular",
  "SC": "via subcutânea",
  "Tópico": "uso tópico",
  "Retal": "via retal",
  "Sublingual": "via sublingual",
  "Inalatório": "via inalatória",
};

function SaveToFavoritesButton({ medication, pathologyName }: { medication: PathologyMedication; pathologyName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/prescription-favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${medication.medication} - ${pathologyName}`,
          medication: medication.medication,
          dose: medication.dose,
          interval: medication.interval,
          quantity: medication.quantity,
          duration: medication.duration,
          route: medication.route,
          timing: medication.timing,
          patientNotes: medication.observations,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescription-favorites"] });
      toast({ title: "Salvo!", description: "Medicação salva nos favoritos." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao salvar favorito.", variant: "destructive" });
    },
  });

  return (
    <Button 
      size="icon" 
      variant="ghost" 
      onClick={() => saveMutation.mutate()} 
      disabled={saveMutation.isPending}
      title="Salvar nos favoritos"
      data-testid={`button-save-favorite-${medication.id}`}
    >
      <Heart className="h-4 w-4" />
    </Button>
  );
}

function formatMedicationSUS(med: PathologyMedication, index: number): string {
  const lines: string[] = [];
  
  lines.push(`${index}) ${med.medication}`);
  
  if (med.quantity) {
    lines.push(`   Quantidade: ${med.quantity}`);
  }
  
  const routeName = med.route ? (ROUTE_NAMES[med.route] || med.route.toLowerCase()) : "via oral";
  
  let posology = "   ";
  if (med.dose) {
    posology += `Tomar ${med.dose}`;
    if (med.dosePerKg) {
      posology += ` (${med.dosePerKg}/kg)`;
    }
    posology += `, ${routeName}`;
    if (med.interval) {
      posology += `, de ${med.interval}`;
    }
    if (med.duration) {
      posology += `, por ${med.duration}`;
    }
    lines.push(posology);
  }
  
  if (med.timing) {
    lines.push(`   Horário: ${med.timing}`);
  }
  
  if (med.maxDose) {
    lines.push(`   Dose máxima: ${med.maxDose}`);
  }
  
  if (med.observations) {
    lines.push(`   Obs: ${med.observations}`);
  }
  
  return lines.join("\n");
}

function UserPathologyCard({ pathology, isExpanded, onToggle, ageGroup, patientAllergies }: { pathology: Pathology; isExpanded: boolean; onToggle: () => void; ageGroup: string; patientAllergies: string[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMedicationDialog, setShowMedicationDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<PathologyMedication | null>(null);

  const { data: medications, isLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    queryFn: async () => {
      const res = await fetch(`/api/pathologies/${pathology.id}/medications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isExpanded,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/pathologies/${pathology.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", "mine"] });
      toast({ title: "Patologia removida!" });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: async (medicationId: number) => {
      const res = await fetch(`/api/pathology-medications/${medicationId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathology.id, "medications"] });
      toast({ title: "Medicação removida!" });
    },
  });

  const copyAllMedications = () => {
    if (!medications || medications.length === 0) return;
    
    const header = `PRESCRIÇÃO - ${pathology.name.toUpperCase()}`;
    const separator = "=".repeat(40);
    
    const formattedMeds = medications.map((m, idx) => formatMedicationSUS(m, idx + 1));
    
    const text = [
      separator,
      header,
      separator,
      "",
      ...formattedMeds,
      "",
      separator,
    ].join("\n");
    
    navigator.clipboard.writeText(text);
    toast({ title: "Prescrição copiada!", description: "Formato padrão SUS pronto para colar." });
  };

  const copySingleMedication = (med: PathologyMedication) => {
    const text = formatMedicationSUS(med, 1);
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${med.medication} copiado no formato SUS.` });
  };

  return (
    <Card className="overflow-hidden border-pink-200" data-testid={`card-user-pathology-${pathology.id}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              {isExpanded ? <ChevronDown className="h-5 w-5 text-pink-500" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  {pathology.name}
                </h3>
                {pathology.description && (
                  <p className="text-sm text-slate-500">{pathology.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-pink-300 text-pink-600">Pessoal</Badge>
              {pathology.ageGroup === "pediatrico" && <Badge className="text-xs bg-pink-100 text-pink-700">Pediátrico</Badge>}
              <UserPathologyDialog pathology={pathology} ageGroup={ageGroup} />
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(); }} className="h-7 w-7 text-red-400" title="Excluir patologia">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">Carregando medicações...</div>
            ) : (
              <div className="space-y-3 py-3">
                {patientAllergies.length > 0 && medications && medications.some(med => checkMedicationAllergy(med.medication, patientAllergies)) && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Medicações contraindicadas para alergias do paciente foram ocultadas.</span>
                  </div>
                )}
                {medications && medications.filter(med => !checkMedicationAllergy(med.medication, patientAllergies)).length > 0 ? (
                  medications.filter(med => !checkMedicationAllergy(med.medication, patientAllergies)).map((med, idx) => (
                    <div key={med.id} className="p-3 bg-background rounded-md border flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="h-4 w-4 text-primary" />
                          <span className="font-medium">{idx + 1}) {med.medication}</span>
                          {med.maxDose && <Badge variant="outline" className="text-xs">Max: {med.maxDose}</Badge>}
                        </div>
                        <div className="text-sm text-slate-600 space-y-0.5 ml-6">
                          {med.quantity && <p><strong>Quantidade:</strong> {med.quantity}</p>}
                          {med.dose && <p><strong>Posologia:</strong> Tomar {med.dose}{med.dosePerKg && ` (${med.dosePerKg}/kg)`}, {ROUTE_NAMES[med.route || "VO"] || med.route}{med.interval && `, de ${med.interval}`}{med.duration && `, por ${med.duration}`}</p>}
                          {med.timing && <p><strong>Horário:</strong> {med.timing}</p>}
                          {med.observations && <p className="text-slate-500 italic">Obs: {med.observations}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => copySingleMedication(med)} className="h-7 w-7" title="Copiar medicamento">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <MedicationDialog pathologyId={pathology.id} medication={med} ageGroup={ageGroup} />
                        <Button size="icon" variant="ghost" onClick={() => deleteMedicationMutation.mutate(med.id)} className="h-7 w-7 text-red-400" title="Excluir medicação">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-muted-foreground text-sm">
                    Nenhuma medicação adicionada ainda.
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <MedicationDialog pathologyId={pathology.id} ageGroup={ageGroup} />
                  {medications && medications.length > 0 && (
                    <Button onClick={copyAllMedications} className="flex-1 gap-2" data-testid="button-copy-user-prescription">
                      <Copy className="h-4 w-4" /> Copiar Prescrição Completa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
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

function PathologyCard({ pathology, isExpanded, onToggle, patientAllergies }: { pathology: Pathology; isExpanded: boolean; onToggle: () => void; patientAllergies: string[] }) {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState<number | null>(null);

  const { data: medications, isLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    queryFn: async () => {
      const res = await fetch(`/api/pathologies/${pathology.id}/medications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isExpanded,
  });

  const { data: prescriptionModels } = useQuery<PrescriptionModel[]>({
    queryKey: ["/api/prescription-models", pathology.id],
    queryFn: async () => {
      const res = await fetch(`/api/prescription-models?pathologyId=${pathology.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: isExpanded,
  });

  const { data: modelMedications } = useQuery<PrescriptionModelMedication[]>({
    queryKey: ["/api/prescription-models", selectedModel, "medications"],
    queryFn: async () => {
      if (!selectedModel) return [];
      const res = await fetch(`/api/prescription-models/${selectedModel}/medications`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!selectedModel,
  });

  const currentModel = prescriptionModels?.find(m => m.id === selectedModel);

  const copyModelPrescription = () => {
    if (!modelMedications || modelMedications.length === 0 || !currentModel) return;
    
    const header = `PRESCRIÇÃO - ${currentModel.title.toUpperCase()}`;
    const separator = "=".repeat(40);
    
    const formattedMeds = modelMedications.map((m, idx) => {
      const parts = [
        `${idx + 1}) ${m.medication}`,
        m.quantity ? `   Quantidade: ${m.quantity}` : null,
        m.dose ? `   Posologia: Tomar ${m.dose}${m.dosePerKg ? ` (${m.dosePerKg}/kg)` : ""}, ${m.route || "VO"}${m.interval ? `, de ${m.interval}` : ""}${m.duration ? `, por ${m.duration}` : ""}` : null,
        m.timing ? `   Horário: ${m.timing}` : null,
        m.observations ? `   Obs: ${m.observations}` : null,
      ].filter(Boolean);
      return parts.join("\n");
    });
    
    const text = [
      separator,
      header,
      separator,
      "",
      ...formattedMeds,
      "",
      currentModel.orientations ? `ORIENTAÇÕES: ${currentModel.orientations}` : null,
      currentModel.observations ? `OBSERVAÇÕES: ${currentModel.observations}` : null,
      separator,
    ].filter(Boolean).join("\n");
    
    navigator.clipboard.writeText(text);
    toast({ title: "Prescrição copiada!", description: "Formato padrão SUS pronto para colar." });
  };

  const copyAllMedications = () => {
    if (!medications || medications.length === 0) return;
    
    const header = `PRESCRIÇÃO - ${pathology.name.toUpperCase()}`;
    const separator = "=".repeat(40);
    
    const formattedMeds = medications.map((m, idx) => formatMedicationSUS(m, idx + 1));
    
    const text = [
      separator,
      header,
      separator,
      "",
      ...formattedMeds,
      "",
      separator,
    ].join("\n");
    
    navigator.clipboard.writeText(text);
    toast({ title: "Prescrição copiada!", description: "Formato padrão SUS pronto para colar." });
  };

  const copySingleMedication = (med: PathologyMedication) => {
    const text = formatMedicationSUS(med, 1);
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${med.medication} copiado no formato SUS.` });
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
            ) : (
              <PreviewGate>
                {prescriptionModels && prescriptionModels.length > 0 && (
                  <div className="py-3 space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Modelos de Prescrição Oficiais
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {prescriptionModels.map(model => (
                        <Button
                          key={model.id}
                          variant={selectedModel === model.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedModel(selectedModel === model.id ? null : model.id)}
                          data-testid={`button-model-${model.id}`}
                        >
                          {model.title}
                        </Button>
                      ))}
                    </div>
                    
                    {selectedModel && currentModel && (
                      <div className="mt-3 p-4 bg-background rounded-md border space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold">{currentModel.title}</h5>
                          <Button size="icon" variant="ghost" onClick={() => setSelectedModel(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {currentModel.description && (
                          <p className="text-sm text-muted-foreground">{currentModel.description}</p>
                        )}
                        
                        {patientAllergies.length > 0 && modelMedications && modelMedications.some(med => checkMedicationAllergy(med.medication, patientAllergies)) && (
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span>Medicações contraindicadas para alergias do paciente foram ocultadas.</span>
                          </div>
                        )}
                        {modelMedications && modelMedications.filter(med => !checkMedicationAllergy(med.medication, patientAllergies)).length > 0 && (
                          <div className="space-y-2">
                            {modelMedications.filter(med => !checkMedicationAllergy(med.medication, patientAllergies)).map((med, idx) => (
                              <div key={med.id} className="p-2 bg-muted/30 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                  <Pill className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">{idx + 1}) {med.medication}</span>
                                  {med.pharmaceuticalForm && <Badge variant="outline" className="text-xs">{med.pharmaceuticalForm}</Badge>}
                                </div>
                                <div className="text-xs text-muted-foreground ml-6">
                                  {[med.dose, med.route, med.interval, med.duration].filter(Boolean).join(" - ")}
                                  {med.observations && <span className="block italic mt-0.5">{med.observations}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {currentModel.orientations && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Orientações:</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{currentModel.orientations}</p>
                          </div>
                        )}
                        
                        {currentModel.observations && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Observações Clínicas:</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">{currentModel.observations}</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2 border-t">
                          <Button onClick={copyModelPrescription} className="flex-1 gap-2" data-testid="button-copy-model-prescription">
                            <Copy className="h-4 w-4" /> Copiar Modelo
                          </Button>
                          {modelMedications && modelMedications.length > 0 && (
                            <SUSPrescriptionPrint
                              prescriptions={modelMedications.map(med => ({
                                medication: med.medication,
                                dose: med.dose || "",
                                quantity: med.quantity || "",
                                interval: med.interval || "",
                                duration: med.duration || "",
                                route: med.route || "",
                                timing: med.timing || "",
                                orientations: med.observations || "",
                              }))}
                              trigger={
                                <Button variant="outline" className="gap-2" data-testid="button-print-model-prescription">
                                  <Printer className="h-4 w-4" /> Imprimir
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {medications && medications.length > 0 && (
                  <>
                    {prescriptionModels && prescriptionModels.length > 0 && (
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2 mt-4 pt-4 border-t">
                        <Pill className="h-4 w-4" /> Medicações Avulsas
                      </h4>
                    )}
                    {patientAllergies.length > 0 && medications.some(med => checkMedicationAllergy(med.medication, patientAllergies)) && (
                      <div className="p-2 mt-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>Medicações contraindicadas para alergias do paciente foram ocultadas.</span>
                      </div>
                    )}
                    <div className="space-y-3 py-3">
                      {medications.filter(med => !checkMedicationAllergy(med.medication, patientAllergies)).map((med, idx) => (
                        <div key={med.id} className="p-3 bg-background rounded-md border flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Pill className="h-4 w-4 text-primary" />
                              <span className="font-medium">{idx + 1}) {med.medication}</span>
                              {med.maxDose && <Badge variant="outline" className="text-xs">Max: {med.maxDose}</Badge>}
                            </div>
                            <div className="text-sm text-slate-600 space-y-0.5 ml-6">
                              {med.quantity && <p><strong>Quantidade:</strong> {med.quantity}</p>}
                              {med.dose && <p><strong>Posologia:</strong> Tomar {med.dose}{med.dosePerKg && ` (${med.dosePerKg}/kg)`}, {ROUTE_NAMES[med.route || "VO"] || med.route}{med.interval && `, de ${med.interval}`}{med.duration && `, por ${med.duration}`}</p>}
                              {med.timing && <p><strong>Horário:</strong> {med.timing}</p>}
                              {med.observations && <p className="text-slate-500 italic">Obs: {med.observations}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" onClick={() => copySingleMedication(med)} title="Copiar este medicamento">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <SaveToFavoritesButton medication={med} pathologyName={pathology.name} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t flex gap-2">
                      <Button onClick={copyAllMedications} className="flex-1 gap-2" data-testid="button-copy-prescription-sus">
                        <Copy className="h-4 w-4" /> Copiar (Padrão SUS)
                      </Button>
                      <SUSPrescriptionPrint
                        prescriptions={medications.map(med => ({
                          medication: med.medication,
                          dose: med.dose || "",
                          quantity: med.quantity || "",
                          interval: med.interval || "",
                          duration: med.duration || "",
                          route: med.route || "",
                          timing: med.timing || "",
                          orientations: med.observations || "",
                        }))}
                        trigger={
                          <Button variant="outline" className="gap-2" data-testid="button-print-pathology-prescription">
                            <Printer className="h-4 w-4" /> Imprimir
                          </Button>
                        }
                      />
                    </div>
                  </>
                )}

                {(!medications || medications.length === 0) && (!prescriptionModels || prescriptionModels.length === 0) && (
                  <div className="py-4 text-center text-muted-foreground">
                    Nenhuma medicação ou modelo cadastrado para esta patologia.
                  </div>
                )}
              </PreviewGate>
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
          {prescription.medication && (
            <QuickPrintButton prescription={prescription} />
          )}
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

function UserPathologyDialog({ pathology, ageGroup }: { pathology?: Pathology; ageGroup: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!pathology;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/pathologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", "mine"] });
      toast({ title: "Criado!", description: "Patologia salva com sucesso." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar patologia.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/pathologies/${pathology!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", "mine"] });
      toast({ title: "Atualizado!", description: "Patologia atualizada com sucesso." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar patologia.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      ageGroup,
      isPublic: false,
      isLocked: false,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()} className="h-7 w-7" title="Editar patologia">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button className="shadow-lg shadow-primary/25 gap-2" data-testid="button-new-user-pathology">
            <FolderPlus className="h-4 w-4" /> Nova Patologia
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Patologia" : "Nova Patologia"} ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Patologia</label>
            <Input name="name" required placeholder="Ex: Pneumonia Comunitária" defaultValue={pathology?.name} data-testid="input-pathology-name" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea name="description" placeholder="Descrição breve da patologia..." rows={2} defaultValue={pathology?.description || ""} data-testid="textarea-pathology-description" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select name="category" defaultValue={pathology?.category || "Outros"}>
              <SelectTrigger data-testid="select-pathology-category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PATHOLOGY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-pathology">
            {createMutation.isPending || updateMutation.isPending ? "Salvando..." : isEditing ? "Atualizar Patologia" : "Criar Patologia"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PathologyDialog({ ageGroup, isAdmin }: { ageGroup: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/pathologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies"] });
      toast({ title: "Criado!", description: "Patologia salva com sucesso." });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao criar patologia.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      ageGroup,
      isPublic: formData.get("isPublic") === "on",
      isLocked: formData.get("isLocked") === "on",
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25 gap-2" data-testid="button-new-pathology">
          <FolderPlus className="h-4 w-4" /> Nova Patologia Oficial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Nova Patologia Oficial ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Patologia</label>
            <Input name="name" required placeholder="Ex: Pneumonia Comunitária" data-testid="input-official-pathology-name" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea name="description" placeholder="Descrição breve da patologia..." rows={2} data-testid="textarea-official-pathology-description" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select name="category" defaultValue="Outros">
              <SelectTrigger data-testid="select-official-pathology-category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {PATHOLOGY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

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

          <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-official-pathology">
            {createMutation.isPending ? "Salvando..." : "Criar Patologia Oficial"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MedicationDialog({ pathologyId, medication, ageGroup }: { pathologyId: number; medication?: PathologyMedication; ageGroup: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!medication;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/pathologies/${pathologyId}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathologyId, "medications"] });
      toast({ title: "Medicação adicionada!" });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao adicionar medicação.", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/pathology-medications/${medication!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pathologies", pathologyId, "medications"] });
      toast({ title: "Medicação atualizada!" });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Erro", description: "Falha ao atualizar medicação.", variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const route = formData.get("route") as string;
    const timing = formData.get("timing") as string;
    const data = {
      medication: formData.get("medication") as string,
      dose: formData.get("dose") as string,
      dosePerKg: formData.get("dosePerKg") as string || null,
      interval: formData.get("interval") as string,
      duration: formData.get("duration") as string,
      route: route || "VO",
      timing: timing && timing !== "none" ? timing : null,
      quantity: formData.get("quantity") as string,
      maxDose: formData.get("maxDose") as string || null,
      observations: formData.get("observations") as string || null,
      order: medication?.order || 0,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar medicação">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" className="gap-2" data-testid="button-add-medication">
            <PlusCircle className="h-4 w-4" /> Adicionar Medicação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Medicação" : "Nova Medicação"} ({ageGroup === "adulto" ? "Adulto" : "Pediátrico"})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Medicação</label>
            <Input name="medication" required placeholder="Ex: Amoxicilina 500mg" defaultValue={medication?.medication} data-testid="input-medication-name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dose</label>
              <Input name="dose" placeholder="Ex: 500mg" defaultValue={medication?.dose || ""} data-testid="input-medication-dose" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dose/kg (pediátrico)</label>
              <Input name="dosePerKg" placeholder="Ex: 50mg/kg/dia" defaultValue={medication?.dosePerKg || ""} data-testid="input-medication-dose-kg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intervalo</label>
              <Select name="interval" defaultValue={medication?.interval || "8/8h"}>
                <SelectTrigger data-testid="select-medication-interval">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração</label>
              <Select name="duration" defaultValue={medication?.duration || "7 dias"}>
                <SelectTrigger data-testid="select-medication-duration">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Via</label>
              <Select name="route" defaultValue={medication?.route || "VO"}>
                <SelectTrigger data-testid="select-medication-route">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Horário</label>
              <Select name="timing" defaultValue={medication?.timing || "none"}>
                <SelectTrigger data-testid="select-medication-timing">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {TIMINGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input name="quantity" placeholder="Ex: 21 comprimidos" defaultValue={medication?.quantity || ""} data-testid="input-medication-quantity" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dose Máxima</label>
              <Input name="maxDose" placeholder="Ex: 4g/dia" defaultValue={medication?.maxDose || ""} data-testid="input-medication-maxdose" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Orientações / Sinais de Alarme</label>
            <Textarea 
              name="observations" 
              placeholder="Ex: Procurar atendimento se febre persistente, piora dos sintomas, dificuldade respiratória..." 
              rows={3} 
              defaultValue={medication?.observations || ""} 
              data-testid="textarea-medication-observations" 
            />
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-medication">
            {createMutation.isPending || updateMutation.isPending ? "Salvando..." : isEditing ? "Atualizar Medicação" : "Adicionar Medicação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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
      timing: timing && timing !== "none" ? timing : null,
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
              <Select name="timing" defaultValue="none">
                <SelectTrigger data-testid="select-timing">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
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
