import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Search, Pill, ShieldAlert, ShieldCheck, Info, Plus, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DrugInteraction, Medication } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const severityColors: Record<string, string> = {
  leve: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  moderada: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  grave: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  contraindicada: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100",
};

const severityIcons: Record<string, typeof ShieldAlert> = {
  leve: Info,
  moderada: AlertTriangle,
  grave: ShieldAlert,
  contraindicada: ShieldAlert,
};

interface InteractionCheckResult {
  hasInteraction: boolean;
  interaction: DrugInteraction | null;
}

export default function DrugInteractions() {
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [searchResult, setSearchResult] = useState<InteractionCheckResult | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [newDrugInput, setNewDrugInput] = useState("");
  const { toast } = useToast();

  const { data: allInteractions = [], isLoading: loadingInteractions } = useQuery<DrugInteraction[]>({
    queryKey: ["/api/drug-interactions"],
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const checkInteractionMutation = useMutation({
    mutationFn: async ({ d1, d2 }: { d1: string; d2: string }) => {
      const res = await fetch(`/api/drug-interactions/check?drug1=${encodeURIComponent(d1)}&drug2=${encodeURIComponent(d2)}`);
      if (!res.ok) throw new Error("Erro ao verificar interação");
      return res.json() as Promise<InteractionCheckResult>;
    },
    onSuccess: (data) => {
      setSearchResult(data);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível verificar a interação",
        variant: "destructive",
      });
    },
  });

  const handleCheck = () => {
    if (!drug1.trim() || !drug2.trim()) {
      toast({
        title: "Atenção",
        description: "Informe os dois medicamentos para verificar",
        variant: "destructive",
      });
      return;
    }
    checkInteractionMutation.mutate({ d1: drug1.trim(), d2: drug2.trim() });
  };

  const addDrugToList = () => {
    if (!newDrugInput.trim()) return;
    if (!selectedDrugs.includes(newDrugInput.trim())) {
      setSelectedDrugs([...selectedDrugs, newDrugInput.trim()]);
    }
    setNewDrugInput("");
  };

  const removeDrugFromList = (drug: string) => {
    setSelectedDrugs(selectedDrugs.filter(d => d !== drug));
  };

  const checkAllInteractions = () => {
    const foundInteractions: DrugInteraction[] = [];
    for (let i = 0; i < selectedDrugs.length; i++) {
      for (let j = i + 1; j < selectedDrugs.length; j++) {
        const d1 = selectedDrugs[i].toLowerCase();
        const d2 = selectedDrugs[j].toLowerCase();
        const found = allInteractions.find(
          int => 
            (int.drug1?.toLowerCase() === d1 && int.drug2?.toLowerCase() === d2) ||
            (int.drug1?.toLowerCase() === d2 && int.drug2?.toLowerCase() === d1)
        );
        if (found) {
          foundInteractions.push(found);
        }
      }
    }
    return foundInteractions;
  };

  const multipleInteractions = selectedDrugs.length >= 2 ? checkAllInteractions() : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
          <Pill className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Interação Medicamentosa</h1>
          <p className="text-muted-foreground">Verifique interações entre medicamentos</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Verificação Rápida
            </CardTitle>
            <CardDescription>Compare dois medicamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drug1">Medicamento 1</Label>
              <Input
                id="drug1"
                placeholder="Ex: Varfarina"
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                list="medications-list"
                data-testid="input-drug1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drug2">Medicamento 2</Label>
              <Input
                id="drug2"
                placeholder="Ex: AAS"
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                list="medications-list"
                data-testid="input-drug2"
              />
            </div>
            <datalist id="medications-list">
              {medications.map((med) => (
                <option key={med.id} value={med.name || ""} />
              ))}
            </datalist>
            <Button 
              onClick={handleCheck} 
              className="w-full"
              disabled={checkInteractionMutation.isPending}
              data-testid="button-check-interaction"
            >
              {checkInteractionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Verificar Interação
            </Button>

            {searchResult && (
              <div className="mt-4">
                {searchResult.hasInteraction && searchResult.interaction ? (
                  <div className={`p-4 rounded-lg ${severityColors[searchResult.interaction.severity || "moderada"]}`}>
                    <div className="flex items-start gap-3">
                      {(() => {
                        const Icon = severityIcons[searchResult.interaction.severity || "moderada"];
                        return <Icon className="h-5 w-5 mt-0.5" />;
                      })()}
                      <div className="space-y-1">
                        <p className="font-semibold">
                          Interação detectada: {searchResult.interaction.severity?.toUpperCase()}
                        </p>
                        {searchResult.interaction.description && (
                          <p className="text-sm">{searchResult.interaction.description}</p>
                        )}
                        {searchResult.interaction.recommendation && (
                          <p className="text-sm mt-2">
                            <strong>Recomendação:</strong> {searchResult.interaction.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5" />
                      <p className="font-medium">Nenhuma interação conhecida encontrada</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Lista de Medicamentos
            </CardTitle>
            <CardDescription>Verifique interações entre múltiplos medicamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar medicamento"
                value={newDrugInput}
                onChange={(e) => setNewDrugInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDrugToList()}
                list="medications-list"
                data-testid="input-add-drug"
              />
              <Button size="icon" onClick={addDrugToList} data-testid="button-add-drug">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {selectedDrugs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDrugs.map((drug) => (
                  <Badge
                    key={drug}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {drug}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeDrugFromList(drug)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {multipleInteractions.length > 0 ? (
              <div className="space-y-3">
                <Separator />
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {multipleInteractions.length} interação(ões) encontrada(s)
                </p>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {multipleInteractions.map((int) => (
                      <div
                        key={int.id}
                        className={`p-3 rounded-lg text-sm ${severityColors[int.severity || "moderada"]}`}
                      >
                        <p className="font-medium">
                          {int.drug1} + {int.drug2}
                        </p>
                        <p className="text-xs mt-1">
                          {int.severity?.toUpperCase()} - {int.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : selectedDrugs.length >= 2 ? (
              <div className="p-3 rounded-lg bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <p>Nenhuma interação conhecida entre os medicamentos listados</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interações Cadastradas</CardTitle>
          <CardDescription>Lista de interações medicamentosas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInteractions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : allInteractions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma interação cadastrada</p>
              <p className="text-sm">Interações são cadastradas pelo administrador</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {allInteractions.map((int) => (
                  <div
                    key={int.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    data-testid={`interaction-${int.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={severityColors[int.severity || "moderada"]}>
                        {int.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{int.drug1} + {int.drug2}</p>
                        <p className="text-sm text-muted-foreground">{int.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
