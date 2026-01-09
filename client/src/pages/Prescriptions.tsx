
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Copy, Trash2, Lock, FileText, Baby, User, ChevronDown, ChevronRight, Pill, FolderPlus, PlusCircle, Edit, X, Printer, Share2, Download, AlertTriangle, ShieldAlert, CheckSquare, Square, Star, FileDown, UserCheck, Heart } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SUSPrescriptionPrint } from "@/components/SUSPrescriptionPrint";
import { PageLoader } from "@/components/ui/loading-spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PreviewGate } from "@/components/PreviewGate";
import { PrescriptionSuggestionAssistant } from "@/components/PrescriptionSuggestionAssistant";
import { PatientContextForm } from "@/components/PatientContextForm";
import { usePatientContextStore, PatientContextState } from "@/stores/usePatientContextStore";
import type { Prescription, Pathology, PathologyMedication, PrescriptionFavorite } from "shared/schema";

const INTERVALS = ["6/6h", "8/8h", "12/12h", "1x/dia", "2x/dia", "3x/dia", "Dose única", "SOS"];
const DURATIONS = ["3 dias", "5 dias", "7 dias", "10 dias", "14 dias", "Uso contínuo", "Uso indeterminado"];
const ROUTES = ["VO", "IV", "IM", "SC", "Tópico", "Retal", "Sublingual", "Inalatório"];
const TIMINGS = ["Jejum", "Com alimentação", "Antes de dormir", "Longe das refeições"];
const PATHOLOGY_CATEGORIES = ["Infectologia", "Cardiologia", "Pneumologia", "Gastroenterologia", "Neurologia", "Ortopedia", "Dermatologia", "Endocrinologia", "Nefrologia", "Outros"];

const COMMON_WARNING_SIGNS = [
  "Febre persistente (>72h) ou febre alta (>39°C)", "Dificuldade para respirar ou falta de ar", "Dor torácica ou palpitações",
  "Vômitos persistentes ou incoercíveis", "Sinais de desidratação (boca seca, urina escura, tontura)", "Alteração do nível de consciência ou confusão mental",
  "Convulsões", "Dor abdominal intensa", "Piora significativa dos sintomas", "Recusa alimentar (crianças)",
];

const ALLERGY_CLASSES: Record<string, string[]> = {
  penicillin: ["amoxicilina", "ampicilina", "penicilina", "piperacilina", "benzilpenicilina"],
  sulfa: ["sulfametoxazol", "sulfadiazina", "sulfassalazina", "bactrim", "cotrimoxazol"],
  nsaid: ["ibuprofeno", "diclofenaco", "naproxeno", "cetoprofeno", "nimesulida", "aas", "ácido acetilsalicílico"],
  dypirone: ["dipirona", "metamizol", "novalgina"],
  macrolide: ["azitromicina", "claritromicina", "eritromicina"],
  quinolone: ["ciprofloxacino", "levofloxacino", "moxifloxacino"],
  iodine: ["contraste iodado", "iodo", "povidine"],
};

const MED_CONTRAINDICATIONS = {
  pregnancy: ["methotrexate", "misoprostol", "isotretinoína", "varfarina", "estatinas", "ieca", "bra"],
  renal: ["acv", "aciclovir", "ganciclovir", "anfotericina", "aminoglicosídeo", "gentamicina", "amicacina", "vancomicina", "tenofovir", "metformina"],
};

function checkMedicationRisks(medicationName: string, context: PatientContextState) {
  const risks = { isAllergic: false, pregnancyRisk: false, renalRisk: false };
  if (!medicationName || !context.isActive) return risks;

  const medLower = medicationName.toLowerCase();

  const allAllergies = [...context.allergies, ...context.otherAllergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)];
  for (const allergy of allAllergies) {
    if (allergy && medLower.includes(allergy)) {
      risks.isAllergic = true;
      break;
    }
    const allergyClass = ALLERGY_CLASSES[allergy as keyof typeof ALLERGY_CLASSES];
    if (allergyClass && allergyClass.some(med => medLower.includes(med))) {
      risks.isAllergic = true;
      break;
    }
  }

  if (context.isPregnant) {
    if (MED_CONTRAINDICATIONS.pregnancy.some(med => medLower.includes(med))) {
      risks.pregnancyRisk = true;
    }
  }

  if (context.keyConditions.includes('renal')) {
    if (MED_CONTRAINDICATIONS.renal.some(med => medLower.includes(med))) {
      risks.renalRisk = true;
    }
  }

  return risks;
}

type SelectionItem = { id: number; type: "medication" | "model"; pathologyName: string; data: PathologyMedication | any; };

function formatPrescriptionToText(items: SelectionItem[]): string {
    return items.map(item => `${item.data.medication} - ${item.data.dose}`).join('\n');
}

function PatientContextBanner() {
    const context = usePatientContextStore();
    const { resetPatientContext } = usePatientContextStore.getState();

    if (!context.isActive) return null;

    const parts = [
        context.ageGroup === 'pediatric' ? `Pediatria (${context.pediatricWeightKg}kg)` : 'Adulto',
        context.isPregnant ? 'GESTANTE' : null,
        context.allergies.length > 0 ? `Alergias: ${context.allergies.join(', ')}` : null,
        context.keyConditions.length > 0 ? `Condições: ${context.keyConditions.join(', ')}` : null,
    ].filter(Boolean);

    return (
        <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4 dark:bg-blue-950/30 dark:border-blue-800">
            <div className="flex items-center gap-3">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">Contexto Ativo:</span> {parts.join(' | ')}
                </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetPatientContext} className="text-blue-600 dark:text-blue-400">
                <X className="h-4 w-4 mr-1" /> Limpar
            </Button>
        </div>
    );
}

export default function Prescriptions() {
  const [mainTab, setMainTab] = useState<"contexto" | "patologias" | "minhas" | "favoritos">("contexto");
  const [ageGroup, setAgeGroup] = useState<"adulto" | "pediatrico">("adulto");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const patientContext = usePatientContextStore();
  const { resetPatientContext } = usePatientContextStore.getState();

  const handleActionWithReset = (action: () => void, message: string) => {
    action();
    toast({ title: message });
    if (patientContext.isActive) {
      resetPatientContext();
      toast({
        title: "Contexto do Paciente foi limpo",
        description: "Para segurança, os dados do paciente foram resetados após a ação.",
        duration: 5000,
      });
    }
  };

  const toggleSelection = (item: SelectionItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) return prev.filter(i => !(i.id === item.id && i.type === item.type));
      return [...prev, item];
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setSelectionMode(false);
  };
  
  const copySelectedItems = () => {
    if (selectedItems.length === 0) return;
    const text = formatPrescriptionToText(selectedItems);
    handleActionWithReset(() => navigator.clipboard.writeText(text), `${selectedItems.length} prescrição(ões) copiada(s).`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Prescrições</h1>
          <p className="text-slate-500">Modelos e contexto do paciente para agilizar seu plantão.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={ageGroup} onValueChange={(v) => setAgeGroup(v as "adulto" | "pediatrico")} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[200px]">
              <TabsTrigger value="adulto" className="gap-1"><User className="h-4 w-4" /> Adulto</TabsTrigger>
              <TabsTrigger value="pediatrico" className="gap-1"><Baby className="h-4 w-4" /> Pediátrico</TabsTrigger>
            </TabsList>
          </Tabs>
          {isAdmin && mainTab === "patologias" && <PathologyDialog ageGroup={ageGroup} isAdmin={true} />}
          {mainTab === "minhas" && <UserPathologyDialog ageGroup={ageGroup} />}
        </div>
      </header>
      
      <PatientContextBanner />

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b">
            <TabsList className="w-auto">
                <TabsTrigger value="contexto" className="gap-1"><UserCheck className="h-4 w-4" /> Paciente Atual</TabsTrigger>
                <TabsTrigger value="patologias" className="gap-1"><FileText className="h-4 w-4" /> Por Patologia</TabsTrigger>
                <TabsTrigger value="minhas" className="gap-1"><Heart className="h-4 w-4" /> Minhas</TabsTrigger>
                <TabsTrigger value="favoritos" className="gap-1"><Star className="h-4 w-4" /> Favoritos</TabsTrigger>
            </TabsList>
            
            {mainTab === "patologias" && (
            <Button
                variant={selectionMode ? "default" : "outline"}
                onClick={() => selectionMode ? clearSelection() : setSelectionMode(true)}
                className="gap-2"
            >
                {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectionMode ? `Selecionados (${selectedItems.length})` : "Selecionar Múltiplos"}
            </Button>
            )}
        </div>
        <TabsContent value="contexto" className="mt-6">
            <PatientContextForm />
        </TabsContent>
        <TabsContent value="patologias" className="mt-6">
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Buscar patologia..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10"/>
            </div>
            <PathologiesView 
                ageGroup={ageGroup} 
                searchQuery={searchQuery} 
                isAdmin={isAdmin} 
                patientContext={patientContext}
                selectionMode={selectionMode}
                selectedItems={selectedItems}
                onToggleSelection={toggleSelection}
                onAction={handleActionWithReset}
            />
        </TabsContent>
         <TabsContent value="minhas" className="mt-6">
             <UserPathologiesView ageGroup={ageGroup} searchQuery={searchQuery} patientContext={patientContext} onAction={handleActionWithReset} />
        </TabsContent>
         <TabsContent value="favoritos" className="mt-6">
             <FavoritesView searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
      
      {selectionMode && selectedItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border shadow-lg rounded-lg p-3 flex items-center gap-3 z-50">
          <span className="text-sm font-medium">{selectedItems.length} selecionado(s)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copySelectedItems} className="gap-1">
              <Copy className="h-3 w-3" /> Copiar
            </Button>
            <SUSPrescriptionPrint
              prescriptions={selectedItems.map(item => item.data)}
              trigger={<Button size="sm" variant="outline" className="gap-1"><Printer className="h-3 w-3" /> Imprimir</Button>}
              onPrintComplete={() => handleActionWithReset(() => {}, 'Prescrições enviadas para impressão.')}
            />
            <Button size="sm" variant="ghost" onClick={clearSelection}><X className="h-3 w-3" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PathologiesView({ ageGroup, searchQuery, isAdmin, patientContext, selectionMode, selectedItems, onToggleSelection, onAction }: { ageGroup: string; searchQuery: string; isAdmin: boolean; patientContext: PatientContextState; selectionMode: boolean; selectedItems: SelectionItem[]; onToggleSelection: (item: SelectionItem) => void; onAction: (action: () => void, message: string) => void; }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const { data: pathologies, isLoading } = useQuery<Pathology[]>({
    queryKey: ["/api/pathologies", ageGroup],
    queryFn: async () => { // Example queryFn
        const res = await fetch(`/api/pathologies?ageGroup=${ageGroup}`);
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    }
  });

  const filtered = useMemo(() => pathologies?.filter(p => (p.isPublic || p.isLocked) && (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))), [pathologies, searchQuery]);

  const toggleExpanded = (id: number) => {
    setExpanded(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <PageLoader text="Carregando patologias..." />;

  return (
    <div className="space-y-3">
      {filtered?.map((pathology) => (
        <PathologyCard 
          key={pathology.id} 
          pathology={pathology} 
          isExpanded={expanded.has(pathology.id)}
          onToggle={() => toggleExpanded(pathology.id)}
          patientContext={patientContext}
          selectionMode={selectionMode}
          selectedItems={selectedItems}
          onToggleSelection={onToggleSelection}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

function UserPathologiesView({ ageGroup, searchQuery, patientContext, onAction }: { ageGroup: string; searchQuery: string; patientContext: PatientContextState; onAction: (action: () => void, message: string) => void; }) {
    // Implementation for user-specific pathologies
    return <div className="text-center py-8 text-slate-400 border rounded-md bg-muted/20"><p>Minhas Prescrições</p></div>
}

function FavoritesView({ searchQuery }: { searchQuery: string }) {
    // Implementation for favorite prescriptions
    return <div className="text-center py-8 text-slate-400 border rounded-md bg-muted/20"><p>Favoritos</p></div>
}

function PathologyCard({ pathology, isExpanded, onToggle, patientContext, selectionMode, selectedItems, onToggleSelection, onAction }: { pathology: Pathology; isExpanded: boolean; onToggle: () => void; patientContext: PatientContextState; selectionMode: boolean; selectedItems: SelectionItem[]; onToggleSelection: (item: SelectionItem) => void; onAction: (action: () => void, message: string) => void; }) {
  const { data: medications, isLoading } = useQuery<PathologyMedication[]>({
    queryKey: ["/api/pathologies", pathology.id, "medications"],
    enabled: isExpanded,
    queryFn: async () => { // Example queryFn
        const res = await fetch(`/api/pathologies/${pathology.id}/medications`);
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    }
  });

  const copySingleMedication = (med: PathologyMedication) => {
    const text = `${med.medication} - ${med.dose}`;
    onAction(() => navigator.clipboard.writeText(text), `${med.medication} copiado!`);
  };

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
            <div className="p-4 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                    <h3 className="font-bold text-slate-900">{pathology.name}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">Oficial</Badge>
            </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t bg-muted/20">
            {isLoading && <div className="py-4 text-center">Carregando...</div>}
            {medications?.map(med => {
              const risks = checkMedicationRisks(med.medication, patientContext);
              const isSelected = selectedItems.some(i => i.id === med.id);
              return (
                <div key={med.id} className={`p-3 mt-2 bg-background rounded-md border flex items-start gap-3 ${isSelected ? 'ring-2 ring-primary' : ''} ${risks.isAllergic ? 'border-red-500 bg-red-50' : ''}`}>
                  {selectionMode && (
                    <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection({ id: med.id, type: 'medication', pathologyName: pathology.name, data: med })} className="mt-1"/>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="h-4 w-4 text-primary" />
                      <span className="font-medium">{med.medication}</span>
                      {risks.isAllergic && <Badge variant="destructive">ALERGIA</Badge>}
                      {risks.pregnancyRisk && <Badge variant="destructive">RISCO GESTAÇÃO</Badge>}
                      {risks.renalRisk && <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">AJUSTE RENAL</Badge>}
                    </div>
                    <div className="text-sm text-slate-600 ml-6">
                      <p>{med.dose}, {med.route}, {med.interval}, {med.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button size="icon" variant="ghost" onClick={() => copySingleMedication(med)} title="Copiar">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function UserPathologyDialog({ ageGroup, pathology }: { ageGroup: string; pathology?: Pathology }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1"><PlusCircle className="h-4 w-4"/>Nova Patologia Pessoal</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Nova Patologia Pessoal</DialogTitle></DialogHeader>
                {/* Form goes here */}
            </DialogContent>
        </Dialog>
    );
}

function PathologyDialog({ ageGroup, isAdmin }: { ageGroup: string; isAdmin: boolean }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><FolderPlus className="h-4 w-4"/>Nova Patologia Oficial</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Nova Patologia Oficial</DialogTitle></DialogHeader>
                {/* Form goes here */}
            </DialogContent>
        </Dialog>
    );
}
