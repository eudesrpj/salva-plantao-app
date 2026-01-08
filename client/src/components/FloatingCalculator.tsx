import { useState, useRef, useEffect, useMemo } from "react";
import { Calculator, X, GripVertical, AlertTriangle, Copy, Check, Info, Baby, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { CalculatorSetting } from "@shared/schema";

interface PediatricMed {
  medication: string;
  dosePerKg: string;
  maxDose: string;
  unit: string;
  interval: string;
  pharmaceuticalForm: string;
  concentration: string;
  minAge: number;
  maxWeight: number;
}

const DEFAULT_PEDIATRIC_MEDS: PediatricMed[] = [
  { medication: "Dipirona", dosePerKg: "15", maxDose: "1000", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "500mg/ml", minAge: 3, maxWeight: 50 },
  { medication: "Paracetamol", dosePerKg: "15", maxDose: "750", unit: "mg", interval: "6/6h", pharmaceuticalForm: "Gotas", concentration: "200mg/ml", minAge: 0, maxWeight: 50 },
  { medication: "Ibuprofeno", dosePerKg: "10", maxDose: "400", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "50mg/ml", minAge: 6, maxWeight: 50 },
  { medication: "Amoxicilina", dosePerKg: "50", maxDose: "1500", unit: "mg/dia", interval: "8/8h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", minAge: 0, maxWeight: 40 },
  { medication: "Azitromicina", dosePerKg: "10", maxDose: "500", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Suspensão", concentration: "200mg/5ml", minAge: 6, maxWeight: 45 },
  { medication: "Cefalexina", dosePerKg: "50", maxDose: "2000", unit: "mg/dia", interval: "6/6h", pharmaceuticalForm: "Suspensão", concentration: "250mg/5ml", minAge: 0, maxWeight: 40 },
  { medication: "Prednisolona", dosePerKg: "1", maxDose: "60", unit: "mg/dia", interval: "1x/dia", pharmaceuticalForm: "Solução", concentration: "3mg/ml", minAge: 0, maxWeight: 50 },
  { medication: "Metoclopramida", dosePerKg: "0.15", maxDose: "10", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Gotas", concentration: "4mg/ml", minAge: 12, maxWeight: 50 },
  { medication: "Ondansetrona", dosePerKg: "0.15", maxDose: "8", unit: "mg", interval: "8/8h", pharmaceuticalForm: "Ampola", concentration: "2mg/ml", minAge: 6, maxWeight: 50 },
];

const EMERGENCY_MEDS = [
  { label: "Adrenalina (PCR)", dose: 0.01, concentration: 1, unit: "mg/ml", color: "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" },
  { label: "Midazolam", dose: 0.1, concentration: 5, unit: "mg/ml", color: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900" },
  { label: "Fentanil", dose: 0.001, concentration: 0.05, unit: "mcg/ml", color: "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900" },
  { label: "Ketamina", dose: 1.5, concentration: 50, unit: "mg/ml", color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900" },
  { label: "Rocurônio", dose: 1, concentration: 10, unit: "mg/ml", color: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
  { label: "Atropina", dose: 0.02, concentration: 0.5, unit: "mg/ml", color: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900" },
  { label: "Diazepam", dose: 0.3, concentration: 5, unit: "mg/ml", color: "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900" },
  { label: "Dexametasona", dose: 0.6, concentration: 4, unit: "mg/ml", color: "bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900" },
];

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

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [selectedMed, setSelectedMed] = useState("");
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const { data: customMeds } = useQuery<CalculatorSetting[]>({
    queryKey: ["/api/calculator-settings"],
    enabled: open,
  });

  const medications = useMemo((): PediatricMed[] => {
    if (customMeds?.length) {
      return customMeds.map(m => ({
        medication: m.medication,
        dosePerKg: m.dosePerKg || "0",
        maxDose: m.maxDose || "9999",
        unit: m.unit || "mg",
        interval: m.interval || "",
        pharmaceuticalForm: m.pharmaceuticalForm || "",
        concentration: m.concentration || "",
        minAge: typeof m.minAge === 'string' ? parseInt(m.minAge) : (m.minAge ?? 0),
        maxWeight: typeof m.maxWeight === 'string' ? parseFloat(m.maxWeight) : (m.maxWeight ?? 100),
      }));
    }
    return DEFAULT_PEDIATRIC_MEDS;
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
        ageWarning = `Idade mínima: ${selectedMedData.minAge} meses`;
      }
    }
    if (selectedMedData.maxWeight && weightNum > selectedMedData.maxWeight) {
      weightWarning = `Peso máximo pediátrico: ${selectedMedData.maxWeight}kg`;
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 450,
        y: window.innerHeight - 600
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!dragRef.current) return;
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 420, e.clientX - offsetRef.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 500, e.clientY - offsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 420, touch.clientX - offsetRef.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 500, touch.clientY - offsetRef.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const calculateDose = (mgPerKg: number, concentration?: number) => {
    const w = parseFloat(weight);
    if (isNaN(w) || !w) return "---";
    const doseMg = w * mgPerKg;
    if (concentration) {
      const ml = doseMg / concentration;
      return `${doseMg.toFixed(1)}mg (${ml.toFixed(1)}ml)`;
    }
    return `${doseMg.toFixed(1)} mg`;
  };

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

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8 print:hidden">
        <Button 
          size="icon" 
          onClick={() => setOpen(!open)}
          className="h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-all duration-300 border-4 border-white/20"
          data-testid="button-floating-calculator"
        >
          <Calculator className="h-8 w-8 text-white" />
        </Button>
      </div>

      {open && (
        <div 
          ref={dragRef}
          className="fixed z-50 print:hidden"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            touchAction: 'none'
          }}
        >
          <div className="w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden">
            <div 
              className="bg-primary/10 dark:bg-primary/20 p-4 border-b border-primary/10 cursor-move select-none flex items-center justify-between"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-primary/50" />
                <span className="font-display text-lg text-primary font-semibold">Calculadora Rápida</span>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="h-8 w-8"
                data-testid="button-close-calculator"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="calc-weight" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Peso (kg)
                  </Label>
                  <Input
                    id="calc-weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-10 text-center font-bold border-primary/20 focus-visible:ring-primary/30"
                    placeholder="Ex: 12.5"
                    data-testid="input-calculator-weight"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="calc-age" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Idade (meses)
                  </Label>
                  <Input
                    id="calc-age"
                    type="number"
                    value={ageMonths}
                    onChange={(e) => setAgeMonths(e.target.value)}
                    className="h-10 text-center font-bold border-primary/20 focus-visible:ring-primary/30"
                    placeholder="Ex: 24"
                    data-testid="input-calculator-age"
                  />
                </div>
              </div>
              {ageMonths && parseInt(ageMonths) > 0 && (
                <div className="mt-2 text-center text-xs text-slate-500">
                  {formatAge(parseInt(ageMonths))}
                </div>
              )}
            </div>

            <Tabs defaultValue="pediatria" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-none border-b border-slate-200 dark:border-slate-700">
                <TabsTrigger value="pediatria" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1.5">
                  <Baby className="h-4 w-4" />
                  Pediatria
                </TabsTrigger>
                <TabsTrigger value="emergencia" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1.5">
                  <Syringe className="h-4 w-4" />
                  Emergência
                </TabsTrigger>
              </TabsList>
              
              <div className="p-3 bg-white dark:bg-slate-900 h-[320px] overflow-y-auto">
                <TabsContent value="pediatria" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Selecione a medicação
                    </Label>
                    <Select value={selectedMed} onValueChange={setSelectedMed}>
                      <SelectTrigger className="w-full" data-testid="select-medication">
                        <SelectValue placeholder="Escolha uma medicação..." />
                      </SelectTrigger>
                      <SelectContent>
                        {medications.map((med) => (
                          <SelectItem key={med.medication} value={med.medication || ""}>
                            {med.medication} ({med.dosePerKg}mg/kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {calculation && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      {(calculation.ageWarning || calculation.weightWarning) && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
                          {calculation.ageWarning && (
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <span>{calculation.ageWarning}</span>
                            </div>
                          )}
                          {calculation.weightWarning && (
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <span>{calculation.weightWarning}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{selectedMed}</span>
                          <Badge variant="outline" className="text-xs">
                            {calculation.pharmaceuticalForm}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-primary">
                              {calculation.doseInMg.toFixed(1)}
                            </div>
                            <div className="text-xs text-slate-500">{calculation.unit}</div>
                          </div>
                          {calculation.doseInMl && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
                              <div className="text-2xl font-bold text-emerald-600">
                                {calculation.doseInMl.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500">ml</div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            <span>Intervalo: {calculation.interval}</span>
                          </div>
                          {calculation.concentration && (
                            <span className="text-xs">{calculation.concentration}</span>
                          )}
                        </div>

                        {calculation.maxDoseExceeded && (
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Dose máxima atingida: {calculation.maxDose}{calculation.unit}</span>
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={copyToClipboard}
                          data-testid="button-copy-dose"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar prescrição
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!selectedMed && (
                    <div className="text-center text-sm text-slate-400 py-8">
                      Selecione uma medicação para calcular a dose
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="emergencia" className="space-y-2 mt-0">
                  {EMERGENCY_MEDS.map((med) => (
                    <DoseCard 
                      key={med.label}
                      label={med.label} 
                      dose={`${med.dose}mg/kg`} 
                      result={calculateDose(med.dose, med.concentration)} 
                      concentration={`${med.concentration}${med.unit}`} 
                      color={med.color} 
                    />
                  ))}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
}

function DoseCard({ label, dose, result, concentration, color }: { label: string, dose: string, result: string, concentration?: string, color: string }) {
  return (
    <div className={cn("p-3 rounded-lg border flex items-center justify-between transition-all", color)}>
      <div>
        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{label}</h4>
        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          <span className="bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10">{dose}</span>
          {concentration && <span>{concentration}</span>}
        </div>
      </div>
      <div className="text-right">
        <span className="text-base font-bold text-slate-800 dark:text-slate-100">{result}</span>
      </div>
    </div>
  );
}
