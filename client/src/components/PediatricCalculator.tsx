import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Calculator, AlertTriangle, Copy, Check, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CalculatorSetting } from "@shared/schema";

const DEFAULT_MEDS: Partial<CalculatorSetting>[] = [
  { medication: "Dipirona", dosePerKg: "15", maxDose: "1000", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "500mg/ml", minAge: 3, maxWeight: 50 },
  { medication: "Paracetamol", dosePerKg: "15", maxDose: "750", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "200mg/ml", minAge: 0, maxWeight: 50 },
  { medication: "Ibuprofeno", dosePerKg: "10", maxDose: "400", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "50mg/ml", minAge: 6, maxWeight: 50 },
  { medication: "Amoxicilina", dosePerKg: "50", maxDose: "1500", unit: "mg/dia", interval: "8/8h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", minAge: 0, maxWeight: 40 },
  { medication: "Azitromicina", dosePerKg: "10", maxDose: "500", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Suspensão", concentration: "200mg/5ml", minAge: 6, maxWeight: 45 },
  { medication: "Cefalexina", dosePerKg: "50", maxDose: "2000", unit: "mg/dia", interval: "6/6h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", minAge: 0, maxWeight: 40 },
  { medication: "Prednisolona", dosePerKg: "1-2", maxDose: "60", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Solução", concentration: "3mg/ml", minAge: 0, maxWeight: 50 },
  { medication: "Metoclopramida", dosePerKg: "0.15", maxDose: "10", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "4mg/ml", minAge: 12, maxWeight: 50 },
  { medication: "Ondansetrona", dosePerKg: "0.15", maxDose: "8", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Ampola", concentration: "2mg/ml", minAge: 6, maxWeight: 50 },
];

interface PediatricCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculationResult {
  doseInMg: number;
  doseInMl: number | null;
  dosePerKg: number;
  maxDoseExceeded: boolean;
  maxDose: number;
  unit: string;
  interval: string;
  pharmaceuticalForm: string;
  concentration: string | null;
  ageWarning: string | null;
  weightWarning: string | null;
}

export function PediatricCalculator({ isOpen, onClose }: PediatricCalculatorProps) {
  const [weight, setWeight] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [selectedMed, setSelectedMed] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: customMeds } = useQuery<CalculatorSetting[]>({
    queryKey: ["/api/calculator-settings"],
  });

  const medications = useMemo(() => {
    return customMeds?.length ? customMeds : DEFAULT_MEDS;
  }, [customMeds]);

  const selectedMedData = useMemo(() => {
    return medications.find(m => m.medication === selectedMed);
  }, [medications, selectedMed]);

  const calculation = useMemo((): CalculationResult | null => {
    if (!weight || !selectedMedData) return null;

    const weightNum = parseFloat(weight);
    const ageNum = ageMonths ? parseInt(ageMonths) : null;
    const dosePerKg = parseFloat(selectedMedData.dosePerKg?.split("-")[0] || "0");
    const maxDose = parseFloat(selectedMedData.maxDose || "9999");
    
    let dose = weightNum * dosePerKg;
    const maxDoseExceeded = dose > maxDose;
    if (maxDoseExceeded) {
      dose = maxDose;
    }

    let doseInMl: number | null = null;
    const concentration = selectedMedData.concentration;
    if (concentration) {
      const match = concentration.match(/(\d+(?:\.\d+)?)\s*(?:mg)\s*[/\\]\s*(\d+(?:\.\d+)?)\s*(?:ml)?/i);
      if (match) {
        const mgPer = parseFloat(match[1]);
        const mlPer = parseFloat(match[2]);
        if (mgPer && mlPer) {
          doseInMl = (dose * mlPer) / mgPer;
        }
      } else {
        const simpleMatch = concentration.match(/(\d+(?:\.\d+)?)\s*(?:mg)\s*[/\\]\s*ml/i);
        if (simpleMatch) {
          const mgPerMl = parseFloat(simpleMatch[1]);
          if (mgPerMl) {
            doseInMl = dose / mgPerMl;
          }
        }
      }
    }

    let ageWarning: string | null = null;
    let weightWarning: string | null = null;

    if (ageNum !== null && selectedMedData.minAge !== undefined && selectedMedData.minAge !== null) {
      if (ageNum < selectedMedData.minAge) {
        ageWarning = `Idade mínima recomendada: ${selectedMedData.minAge} meses`;
      }
    }
    if (selectedMedData.maxWeight && weightNum > selectedMedData.maxWeight) {
      weightWarning = `Peso máximo para dose pediátrica: ${selectedMedData.maxWeight}kg`;
    }

    return {
      doseInMg: dose,
      doseInMl,
      dosePerKg,
      maxDoseExceeded,
      maxDose,
      unit: selectedMedData.unit || "mg",
      interval: selectedMedData.interval || "",
      pharmaceuticalForm: selectedMedData.pharmaceuticalForm || "",
      concentration: selectedMedData.concentration || null,
      ageWarning,
      weightWarning
    };
  }, [weight, ageMonths, selectedMedData]);

  const copyToClipboard = () => {
    if (calculation && selectedMed) {
      let text = `${selectedMed}: ${calculation.doseInMg.toFixed(1)} ${calculation.unit}`;
      if (calculation.doseInMl) {
        text += ` (${calculation.doseInMl.toFixed(1)} ml)`;
      }
      text += ` ${calculation.interval} (peso: ${weight}kg)`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAge = (months: number): string => {
    if (months < 12) return `${months} meses`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} ano${years > 1 ? 's' : ''}`;
    return `${years} ano${years > 1 ? 's' : ''} e ${remainingMonths} meses`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-96 shadow-xl border-2 border-primary/20 max-h-[80vh] overflow-auto">
        <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-t-lg sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-pink-500" />
              Calculadora Pediátrica
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm font-medium">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 12.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                data-testid="input-weight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium flex items-center gap-1">
                Idade (meses)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Opcional - usado para verificar idade mínima</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Ex: 24"
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                data-testid="input-age"
              />
              {ageMonths && (
                <p className="text-xs text-muted-foreground">{formatAge(parseInt(ageMonths))}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medication" className="text-sm font-medium">Medicamento</Label>
            <Select value={selectedMed} onValueChange={setSelectedMed}>
              <SelectTrigger data-testid="select-medication">
                <SelectValue placeholder="Selecione o medicamento" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.medication} value={med.medication || ""}>
                    <div className="flex flex-col items-start">
                      <span>{med.medication}</span>
                      <span className="text-xs text-muted-foreground">
                        {med.dosePerKg} {med.unit}/kg {med.pharmaceuticalForm && `- ${med.pharmaceuticalForm}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMedData && (
            <div className="text-xs space-y-1 p-2 bg-muted/50 rounded-md">
              <div className="flex flex-wrap gap-1">
                {selectedMedData.pharmaceuticalForm && (
                  <Badge variant="outline" className="text-xs">{selectedMedData.pharmaceuticalForm}</Badge>
                )}
                {selectedMedData.concentration && (
                  <Badge variant="outline" className="text-xs">{selectedMedData.concentration}</Badge>
                )}
                {selectedMedData.interval && (
                  <Badge variant="outline" className="text-xs">{selectedMedData.interval}</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Dose: {selectedMedData.dosePerKg} {selectedMedData.unit}/kg 
                {selectedMedData.maxDose && ` (máx: ${selectedMedData.maxDose}${selectedMedData.unit})`}
              </p>
            </div>
          )}

          {calculation && (
            <>
              <Separator />
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-md space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-lg">{selectedMed}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={copyToClipboard}
                    className="gap-1"
                    data-testid="button-copy"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-primary" data-testid="text-result">
                    {calculation.doseInMg.toFixed(1)} {calculation.unit}
                  </p>
                  {calculation.doseInMl && (
                    <p className="text-lg font-medium text-muted-foreground" data-testid="text-result-ml">
                      = {calculation.doseInMl.toFixed(1)} ml ({calculation.concentration})
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{calculation.interval}</p>
                </div>

                {calculation.maxDoseExceeded && (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm p-2 bg-amber-50 dark:bg-amber-950 rounded">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Dose ajustada para máxima ({calculation.maxDose}{calculation.unit})</span>
                  </div>
                )}

                {calculation.ageWarning && (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm p-2 bg-amber-50 dark:bg-amber-950 rounded">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{calculation.ageWarning}</span>
                  </div>
                )}

                {calculation.weightWarning && (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm p-2 bg-amber-50 dark:bg-amber-950 rounded">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{calculation.weightWarning}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PediatricCalculatorButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      size="icon"
      data-testid="button-pediatric-calculator"
    >
      <Calculator className="h-6 w-6 text-white" />
    </Button>
  );
}
