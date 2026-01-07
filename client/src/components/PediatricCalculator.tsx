import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Calculator, AlertTriangle } from "lucide-react";
import type { CalculatorSetting } from "@shared/schema";

const DEFAULT_MEDS = [
  { medication: "Dipirona", dosePerKg: "15", maxDose: "1000", unit: "mg", interval: "6/6h" },
  { medication: "Paracetamol", dosePerKg: "15", maxDose: "750", unit: "mg", interval: "6/6h" },
  { medication: "Ibuprofeno", dosePerKg: "10", maxDose: "400", unit: "mg", interval: "8/8h" },
  { medication: "Amoxicilina", dosePerKg: "50", maxDose: "1500", unit: "mg/dia", interval: "8/8h" },
  { medication: "Azitromicina", dosePerKg: "10", maxDose: "500", unit: "mg/dia", interval: "1x/dia" },
  { medication: "Cefalexina", dosePerKg: "50", maxDose: "2000", unit: "mg/dia", interval: "6/6h" },
  { medication: "Prednisolona", dosePerKg: "1-2", maxDose: "60", unit: "mg/dia", interval: "1x/dia" },
  { medication: "Metoclopramida", dosePerKg: "0.15", maxDose: "10", unit: "mg", interval: "8/8h" },
  { medication: "Ondansetrona", dosePerKg: "0.15", maxDose: "8", unit: "mg", interval: "8/8h" },
];

interface PediatricCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PediatricCalculator({ isOpen, onClose }: PediatricCalculatorProps) {
  const [weight, setWeight] = useState("");
  const [selectedMed, setSelectedMed] = useState("");
  const [calculatedDose, setCalculatedDose] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const { data: customMeds } = useQuery<CalculatorSetting[]>({
    queryKey: ["/api/calculator-settings"],
  });

  const medications = customMeds?.length ? customMeds : DEFAULT_MEDS;

  const calculate = () => {
    if (!weight || !selectedMed) return;
    
    const med = medications.find(m => m.medication === selectedMed);
    if (!med) return;

    const weightNum = parseFloat(weight);
    const dosePerKg = parseFloat(med.dosePerKg.split("-")[0]);
    const maxDose = parseFloat(med.maxDose || "9999");
    
    let dose = weightNum * dosePerKg;
    
    if (dose > maxDose) {
      setWarning(`Dose calculada (${dose.toFixed(1)}${med.unit}) excede dose máxima. Ajustada para ${maxDose}${med.unit}.`);
      dose = maxDose;
    } else {
      setWarning(null);
    }

    setCalculatedDose(`${dose.toFixed(1)} ${med.unit} ${med.interval || ""}`);
  };

  const copyToClipboard = () => {
    if (calculatedDose && selectedMed) {
      const text = `${selectedMed}: ${calculatedDose} (peso: ${weight}kg)`;
      navigator.clipboard.writeText(text);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="w-80 shadow-xl border-2 border-primary/20">
        <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950 dark:to-purple-950 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-pink-500" />
              Calculadora Pediátrica
            </CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Peso (kg)</label>
            <Input
              type="number"
              placeholder="Ex: 12.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              data-testid="input-weight"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Medicamento</label>
            <Select value={selectedMed} onValueChange={setSelectedMed}>
              <SelectTrigger data-testid="select-medication">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((med) => (
                  <SelectItem key={med.medication} value={med.medication}>
                    {med.medication} ({med.dosePerKg} {med.unit}/kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={calculate} className="w-full" data-testid="button-calculate">
            Calcular Dose
          </Button>

          {calculatedDose && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedMed}</span>
                <Badge variant="secondary" className="cursor-pointer" onClick={copyToClipboard}>
                  Copiar
                </Badge>
              </div>
              <p className="text-lg font-bold text-primary" data-testid="text-result">
                {calculatedDose}
              </p>
              {warning && (
                <div className="flex items-start gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              )}
            </div>
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
