import { useState, useRef, useEffect, useMemo } from "react";
import { Calculator, X, GripVertical, AlertTriangle, Copy, Check, Info, Baby, Syringe, User, Equal, Delete, Droplets } from "lucide-react";
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
  doseInDrops: number | null;
  doseInTablets: number | null;
  dosePerKg: number;
  maxDoseExceeded: boolean;
  maxDose: number;
  unit: string;
  interval: string;
  pharmaceuticalForm: string;
  concentration: string | null;
  ageWarning: string | null;
  weightWarning: string | null;
  dilutionInfo?: string | null;
  dropsPerMl: number;
}

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [ageMonths, setAgeMonths] = useState("");
  const [selectedMed, setSelectedMed] = useState("");
  const [selectedAdultMed, setSelectedAdultMed] = useState("");
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);
  const [calcWaitingForOperand, setCalcWaitingForOperand] = useState(false);
  
  const [dropsPerMl, setDropsPerMl] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('calcDropsPerMl');
      return saved ? parseInt(saved) : 20;
    }
    return 20;
  });
  const [lastTab, setLastTab] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('calcLastTab') || 'pediatria';
    }
    return 'pediatria';
  });
  const [weightError, setWeightError] = useState<string | null>(null);

  const { data: customMeds } = useQuery<CalculatorSetting[]>({
    queryKey: ["/api/calculator-settings"],
    enabled: open,
  });

  const medications = useMemo((): PediatricMed[] => {
    const pediatricMeds = customMeds?.filter(m => m.calculatorMode === "pediatrico" || !m.calculatorMode);
    if (pediatricMeds?.length) {
      return pediatricMeds.map(m => ({
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

  const adultMedications = useMemo((): PediatricMed[] => {
    const adultMeds = customMeds?.filter(m => m.calculatorMode === "adulto");
    if (adultMeds?.length) {
      return adultMeds.map(m => ({
        medication: m.medication,
        dosePerKg: m.dosePerKg || "0",
        maxDose: m.maxDose || "9999",
        unit: m.unit || "mg",
        interval: m.interval || "",
        pharmaceuticalForm: m.pharmaceuticalForm || "",
        concentration: m.concentration || "",
        minAge: 0,
        maxWeight: 200,
      }));
    }
    return [];
  }, [customMeds]);

  const selectedMedData = useMemo(() => {
    return medications.find(m => m.medication === selectedMed);
  }, [medications, selectedMed]);

  const selectedAdultMedData = useMemo(() => {
    return adultMedications.find(m => m.medication === selectedAdultMed);
  }, [adultMedications, selectedAdultMed]);

  const adultCalculation = useMemo((): CalculationResult | null => {
    if (!weight || !selectedAdultMedData) return null;

    const weightNum = parseFloat(weight);
    const dosePerKgVal = parseFloat(selectedAdultMedData.dosePerKg?.split("-")[0] || "0");
    const maxDoseVal = parseFloat(selectedAdultMedData.maxDose || "9999");
    
    let dose = weightNum * dosePerKgVal;
    const maxDoseExceeded = dose > maxDoseVal;
    if (maxDoseExceeded) {
      dose = maxDoseVal;
    }

    let doseInMl: number | null = null;
    let doseInDrops: number | null = null;
    let doseInTablets: number | null = null;
    const concentration = selectedAdultMedData.concentration;
    const form = selectedAdultMedData.pharmaceuticalForm?.toLowerCase() || "";
    
    if (concentration) {
      const match = concentration.match(/(\d+(?:\.\d+)?)\s*(?:mg)\s*[/\\]\s*(\d+(?:\.\d+)?)\s*(?:ml)?/i);
      if (match) {
        const mgPer = parseFloat(match[1]);
        const mlPer = parseFloat(match[2]);
        if (mgPer && mlPer) {
          doseInMl = (dose * mlPer) / mgPer;
          if (form.includes("gota")) {
            doseInDrops = doseInMl * dropsPerMl;
          }
        }
      }
      if (form.includes("comprimido") || form.includes("cp")) {
        const cpMatch = concentration.match(/(\d+(?:\.\d+)?)\s*mg/i);
        if (cpMatch) {
          const mgPerCp = parseFloat(cpMatch[1]);
          if (mgPerCp) {
            doseInTablets = dose / mgPerCp;
          }
        }
      }
    }

    return {
      doseInMg: dose,
      doseInMl,
      doseInDrops,
      doseInTablets,
      dosePerKg: dosePerKgVal,
      maxDoseExceeded,
      maxDose: maxDoseVal,
      unit: selectedAdultMedData.unit || "mg",
      interval: selectedAdultMedData.interval || "",
      pharmaceuticalForm: selectedAdultMedData.pharmaceuticalForm || "",
      concentration: selectedAdultMedData.concentration || null,
      ageWarning: null,
      weightWarning: null,
      dropsPerMl
    };
  }, [weight, selectedAdultMedData, dropsPerMl]);

  const handleCalcDigit = (digit: string) => {
    if (calcWaitingForOperand) {
      setCalcDisplay(digit);
      setCalcWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === "0" ? digit : calcDisplay + digit);
    }
  };

  const handleCalcDecimal = () => {
    if (calcWaitingForOperand) {
      setCalcDisplay("0.");
      setCalcWaitingForOperand(false);
    } else if (!calcDisplay.includes(".")) {
      setCalcDisplay(calcDisplay + ".");
    }
  };

  const handleCalcOperator = (op: string) => {
    const current = parseFloat(calcDisplay);
    
    if (calcPrevValue !== null && calcOperator && !calcWaitingForOperand) {
      const result = performCalculation(calcPrevValue, current, calcOperator);
      setCalcDisplay(String(result));
      setCalcPrevValue(result);
    } else {
      setCalcPrevValue(current);
    }
    
    setCalcOperator(op);
    setCalcWaitingForOperand(true);
  };

  const performCalculation = (prev: number, current: number, op: string): number => {
    switch (op) {
      case "+": return prev + current;
      case "-": return prev - current;
      case "*": return prev * current;
      case "/": return current !== 0 ? prev / current : NaN;
      case "%": return prev * (current / 100);
      default: return current;
    }
  };

  const handleCalcEquals = () => {
    if (calcPrevValue === null || calcOperator === null) return;
    
    const current = parseFloat(calcDisplay);
    const result = performCalculation(calcPrevValue, current, calcOperator);
    if (isNaN(result) || !isFinite(result)) {
      setCalcDisplay("Erro");
    } else {
      setCalcDisplay(String(parseFloat(result.toFixed(10))));
    }
    setCalcPrevValue(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(true);
  };

  const handleCalcClear = () => {
    setCalcDisplay("0");
    setCalcPrevValue(null);
    setCalcOperator(null);
    setCalcWaitingForOperand(false);
  };

  const handleCalcBackspace = () => {
    if (calcDisplay.length === 1) {
      setCalcDisplay("0");
    } else {
      setCalcDisplay(calcDisplay.slice(0, -1));
    }
  };

  const calculation = useMemo((): CalculationResult | null => {
    if (!weight || !selectedMedData) return null;

    const weightNum = parseFloat(weight);
    const ageNum = ageMonths ? parseInt(ageMonths) : null;
    const dosePerKgVal = parseFloat(selectedMedData.dosePerKg?.split("-")[0] || "0");
    const maxDoseVal = parseFloat(selectedMedData.maxDose || "9999");
    
    let dose = weightNum * dosePerKgVal;
    const maxDoseExceeded = dose > maxDoseVal;
    if (maxDoseExceeded) {
      dose = maxDoseVal;
    }

    let doseInMl: number | null = null;
    let doseInDrops: number | null = null;
    let doseInTablets: number | null = null;
    const concentration = selectedMedData.concentration;
    const form = selectedMedData.pharmaceuticalForm?.toLowerCase() || "";
    
    if (concentration) {
      const match = concentration.match(/(\d+(?:\.\d+)?)\s*(?:mg)\s*[/\\]\s*(\d+(?:\.\d+)?)\s*(?:ml)?/i);
      if (match) {
        const mgPer = parseFloat(match[1]);
        const mlPer = parseFloat(match[2]);
        if (mgPer && mlPer) {
          doseInMl = (dose * mlPer) / mgPer;
          if (form.includes("gota") || form.includes("gotas")) {
            doseInDrops = doseInMl * dropsPerMl;
          }
        }
      } else {
        const simpleMatch = concentration.match(/(\d+(?:\.\d+)?)\s*(?:mg)\s*[/\\]\s*ml/i);
        if (simpleMatch) {
          const mgPerMl = parseFloat(simpleMatch[1]);
          if (mgPerMl) {
            doseInMl = dose / mgPerMl;
            if (form.includes("gota") || form.includes("gotas")) {
              doseInDrops = doseInMl * dropsPerMl;
            }
          }
        }
      }
      if (form.includes("comprimido") || form.includes("cp")) {
        const cpMatch = concentration.match(/(\d+(?:\.\d+)?)\s*mg/i);
        if (cpMatch) {
          const mgPerCp = parseFloat(cpMatch[1]);
          if (mgPerCp) {
            doseInTablets = dose / mgPerCp;
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
      doseInDrops,
      doseInTablets,
      dosePerKg: dosePerKgVal,
      maxDoseExceeded,
      maxDose: maxDoseVal,
      unit: selectedMedData.unit || "mg",
      interval: selectedMedData.interval || "",
      pharmaceuticalForm: selectedMedData.pharmaceuticalForm || "",
      concentration: selectedMedData.concentration || null,
      ageWarning,
      weightWarning,
      dropsPerMl
    };
  }, [weight, ageMonths, selectedMedData, dropsPerMl]);

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
        text += ` (${calculation.doseInMl.toFixed(1)} ml`;
        if (calculation.doseInDrops) {
          text += ` = ${Math.round(calculation.doseInDrops)} gotas`;
        }
        text += `)`;
      }
      if (calculation.doseInTablets) {
        text += ` (${calculation.doseInTablets.toFixed(1)} cp)`;
      }
      text += ` ${calculation.interval} (peso: ${weight}kg)`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTabChange = (value: string) => {
    setLastTab(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calcLastTab', value);
    }
  };

  const handleDropsPerMlChange = (value: number) => {
    setDropsPerMl(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('calcDropsPerMl', value.toString());
    }
  };

  const validateWeight = () => {
    if (!weight || parseFloat(weight) <= 0) {
      setWeightError("Informe um peso válido");
      return false;
    }
    setWeightError(null);
    return true;
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
      <div className="fixed bottom-6 right-4 z-50 md:bottom-8 md:right-8 print:hidden">
        <Button 
          size="icon" 
          onClick={() => setOpen(!open)}
          className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-all duration-300 border-4 border-white/20"
          data-testid="button-floating-calculator"
        >
          <Calculator className="h-7 w-7 text-white" />
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
                    Peso (kg) *
                  </Label>
                  <Input
                    id="calc-weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (e.target.value && parseFloat(e.target.value) > 0) {
                        setWeightError(null);
                      }
                    }}
                    onBlur={validateWeight}
                    className={cn(
                      "h-10 text-center font-bold border-primary/20 focus-visible:ring-primary/30",
                      weightError && "border-red-500 focus-visible:ring-red-300"
                    )}
                    placeholder="Ex: 12.5"
                    data-testid="input-calculator-weight"
                  />
                  {weightError && (
                    <p className="text-xs text-red-500 mt-1">{weightError}</p>
                  )}
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

            <Tabs defaultValue={lastTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-5 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-none border-b border-slate-200 dark:border-slate-700">
                <TabsTrigger value="pediatria" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1 text-xs">
                  <Baby className="h-3 w-3" />
                  Pedi
                </TabsTrigger>
                <TabsTrigger value="adulto" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1 text-xs">
                  <User className="h-3 w-3" />
                  Adulto
                </TabsTrigger>
                <TabsTrigger value="emergencia" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1 text-xs">
                  <Syringe className="h-3 w-3" />
                  Emerg
                </TabsTrigger>
                <TabsTrigger value="hidratacao" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1 text-xs" data-testid="tab-hydration">
                  <Droplets className="h-3 w-3" />
                  Hidra
                </TabsTrigger>
                <TabsTrigger value="comum" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2 gap-1 text-xs">
                  <Calculator className="h-3 w-3" />
                  Calc
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

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                            <div className="text-xl font-bold text-primary">
                              {calculation.doseInMg.toFixed(1)}
                            </div>
                            <div className="text-xs text-slate-500">{calculation.unit}</div>
                          </div>
                          {calculation.doseInMl && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-emerald-600">
                                {calculation.doseInMl.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500">ml</div>
                            </div>
                          )}
                          {calculation.doseInDrops && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-amber-600">
                                {Math.round(calculation.doseInDrops)}
                              </div>
                              <div className="text-xs text-slate-500">gotas</div>
                            </div>
                          )}
                          {calculation.doseInTablets && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-violet-600">
                                {calculation.doseInTablets.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500">comp</div>
                            </div>
                          )}
                        </div>
                        
                        {calculation.doseInDrops && (
                          <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800/50 rounded p-2">
                            <span className="text-slate-500">Gotejador:</span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={dropsPerMl === 20 ? "default" : "outline"}
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDropsPerMlChange(20)}
                              >
                                20 gts/ml
                              </Button>
                              <Button
                                size="sm"
                                variant={dropsPerMl === 60 ? "default" : "outline"}
                                className="h-6 px-2 text-xs"
                                onClick={() => handleDropsPerMlChange(60)}
                              >
                                60 mcgts/ml
                              </Button>
                            </div>
                          </div>
                        )}

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

                <TabsContent value="adulto" className="space-y-3 mt-0">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Selecione a medicação adulta
                    </Label>
                    <Select value={selectedAdultMed} onValueChange={setSelectedAdultMed}>
                      <SelectTrigger className="w-full" data-testid="select-adult-medication">
                        <SelectValue placeholder="Escolha uma medicação..." />
                      </SelectTrigger>
                      <SelectContent>
                        {adultMedications.map((med) => (
                          <SelectItem key={med.medication} value={med.medication || ""}>
                            {med.medication} ({med.dosePerKg}mg/kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {adultCalculation && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-700 dark:text-blue-400">{selectedAdultMed}</span>
                          {adultCalculation.pharmaceuticalForm && (
                            <Badge variant="outline" className="text-xs">
                              {adultCalculation.pharmaceuticalForm}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                            <div className="text-xl font-bold text-blue-600">
                              {adultCalculation.doseInMg.toFixed(1)}
                            </div>
                            <div className="text-xs text-slate-500">{adultCalculation.unit}</div>
                          </div>
                          {adultCalculation.doseInMl && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-emerald-600">
                                {adultCalculation.doseInMl.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500">ml</div>
                            </div>
                          )}
                          {adultCalculation.doseInDrops && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-amber-600">
                                {Math.round(adultCalculation.doseInDrops)}
                              </div>
                              <div className="text-xs text-slate-500">gotas</div>
                            </div>
                          )}
                          {adultCalculation.doseInTablets && (
                            <div className="bg-white dark:bg-slate-800 rounded-lg p-2 text-center">
                              <div className="text-xl font-bold text-violet-600">
                                {adultCalculation.doseInTablets.toFixed(1)}
                              </div>
                              <div className="text-xs text-slate-500">comp</div>
                            </div>
                          )}
                        </div>

                        {adultCalculation.interval && (
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Info className="h-3 w-3" />
                            <span>Intervalo: {adultCalculation.interval}</span>
                          </div>
                        )}

                        {adultCalculation.maxDoseExceeded && (
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Dose máxima: {adultCalculation.maxDose}{adultCalculation.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {adultMedications.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-8">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum medicamento adulto cadastrado.</p>
                      <p className="text-xs mt-1">O administrador pode adicionar medicamentos adultos no painel admin.</p>
                    </div>
                  )}

                  {adultMedications.length > 0 && !selectedAdultMed && (
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

                <TabsContent value="hidratacao" className="space-y-3 mt-0">
                  <HydrationCalculator weight={weight} />
                </TabsContent>

                <TabsContent value="comum" className="mt-0">
                  <div className="space-y-3">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-right">
                      <div className="text-xs text-slate-500 h-4">
                        {calcPrevValue !== null && calcOperator && (
                          <span>{calcPrevValue} {calcOperator}</span>
                        )}
                      </div>
                      <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100 truncate" data-testid="calc-display">
                        {calcDisplay}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <Button variant="outline" size="sm" className="h-11 text-lg" onClick={handleCalcClear} data-testid="calc-clear">C</Button>
                      <Button variant="outline" size="sm" className="h-11" onClick={handleCalcBackspace} data-testid="calc-backspace">
                        <Delete className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-11 text-lg" onClick={() => handleCalcOperator("%")} data-testid="calc-percent">%</Button>
                      <Button variant="secondary" size="sm" className="h-11 text-lg font-bold" onClick={() => handleCalcOperator("/")} data-testid="calc-divide">/</Button>

                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("7")} data-testid="calc-7">7</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("8")} data-testid="calc-8">8</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("9")} data-testid="calc-9">9</Button>
                      <Button variant="secondary" size="sm" className="h-11 text-lg font-bold" onClick={() => handleCalcOperator("*")} data-testid="calc-multiply">x</Button>

                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("4")} data-testid="calc-4">4</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("5")} data-testid="calc-5">5</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("6")} data-testid="calc-6">6</Button>
                      <Button variant="secondary" size="sm" className="h-11 text-lg font-bold" onClick={() => handleCalcOperator("-")} data-testid="calc-subtract">-</Button>

                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("1")} data-testid="calc-1">1</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("2")} data-testid="calc-2">2</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={() => handleCalcDigit("3")} data-testid="calc-3">3</Button>
                      <Button variant="secondary" size="sm" className="h-11 text-lg font-bold" onClick={() => handleCalcOperator("+")} data-testid="calc-add">+</Button>

                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium col-span-2" onClick={() => handleCalcDigit("0")} data-testid="calc-0">0</Button>
                      <Button variant="ghost" size="sm" className="h-11 text-lg font-medium" onClick={handleCalcDecimal} data-testid="calc-decimal">,</Button>
                      <Button size="sm" className="h-11 text-lg font-bold" onClick={handleCalcEquals} data-testid="calc-equals">
                        <Equal className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </>
  );
}

function HydrationCalculator({ weight }: { weight: string }) {
  const [hydrationMethod, setHydrationMethod] = useState("holliday");
  const [dehydrationLevel, setDehydrationLevel] = useState("leve");
  
  const weightNum = parseFloat(weight) || 0;
  
  const maintenanceFluid = useMemo(() => {
    if (weightNum <= 0) return { totalMl24h: 0, mlPerHour: 0, mlPerKg24h: 0 };
    
    let totalMl24h: number;
    
    if (hydrationMethod === "holliday") {
      if (weightNum <= 10) {
        totalMl24h = weightNum * 100;
      } else if (weightNum <= 20) {
        totalMl24h = 1000 + (weightNum - 10) * 50;
      } else {
        totalMl24h = 1500 + (weightNum - 20) * 20;
      }
    } else {
      totalMl24h = weightNum * 30;
    }
    
    return {
      totalMl24h: Math.round(totalMl24h),
      mlPerHour: Math.round(totalMl24h / 24),
      mlPerKg24h: Math.round(totalMl24h / weightNum)
    };
  }, [weightNum, hydrationMethod]);
  
  const dehydrationRepair = useMemo(() => {
    if (weightNum <= 0) return { repairMl: 0, totalMl: 0, mlPerHour4h: 0, mlPerHour8h: 0 };
    
    const percentDeficit = dehydrationLevel === "leve" ? 5 : dehydrationLevel === "moderada" ? 7.5 : 10;
    const repairMl = weightNum * 10 * percentDeficit;
    const totalMl = maintenanceFluid.totalMl24h + repairMl;
    
    return {
      repairMl: Math.round(repairMl),
      totalMl: Math.round(totalMl),
      mlPerHour4h: Math.round(repairMl / 4),
      mlPerHour8h: Math.round(repairMl / 8),
      percentDeficit
    };
  }, [weightNum, dehydrationLevel, maintenanceFluid.totalMl24h]);

  if (!weight || weightNum <= 0) {
    return (
      <div className="text-center text-sm text-slate-400 py-8">
        <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Insira o peso acima para calcular a hidratação.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs">Método</Label>
          <Select value={hydrationMethod} onValueChange={setHydrationMethod}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="holliday">Holliday-Segar</SelectItem>
              <SelectItem value="30ml">30 ml/kg/dia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-xs">Desidratação</Label>
          <Select value={dehydrationLevel} onValueChange={setDehydrationLevel}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leve">Leve (5%)</SelectItem>
              <SelectItem value="moderada">Moderada (7.5%)</SelectItem>
              <SelectItem value="grave">Grave (10%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
        <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          Manutenção (24h)
        </h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-lg font-bold text-blue-600">{maintenanceFluid.totalMl24h}</p>
            <p className="text-xs text-slate-500">ml/24h</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-lg font-bold text-blue-600">{maintenanceFluid.mlPerHour}</p>
            <p className="text-xs text-slate-500">ml/h</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-lg font-bold text-blue-600">{maintenanceFluid.mlPerKg24h}</p>
            <p className="text-xs text-slate-500">ml/kg/24h</p>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg p-3">
        <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-300 mb-2">
          Reposição + Manutenção ({dehydrationRepair.percentDeficit}%)
        </h4>
        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-base font-bold text-amber-600">{dehydrationRepair.repairMl}</p>
            <p className="text-xs text-slate-500">ml (déficit)</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded p-2">
            <p className="text-base font-bold text-amber-600">{dehydrationRepair.totalMl}</p>
            <p className="text-xs text-slate-500">ml total/24h</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          Reposição: {dehydrationRepair.mlPerHour4h} ml/h (4h) ou {dehydrationRepair.mlPerHour8h} ml/h (8h)
        </div>
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded p-2">
        <p className="font-medium mb-1">Soluções comuns:</p>
        <p>SF 0.9% + SG 5% (1:1) ou SF + SG + KCl 10% (40mEq/L)</p>
      </div>
    </div>
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
