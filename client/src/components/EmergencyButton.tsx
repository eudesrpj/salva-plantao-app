
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Syringe, Wind, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FC, ReactNode } from 'react';
import { EmergencyFloatingPanel } from "./EmergencyFloatingPanel";

interface DoseCalculation {
  drug: string;
  dose: (weight: number) => string;
  unit: (weight: number) => string;
}

interface EmergencyDoseCardProps {
  title: string;
  icon: ReactNode;
  weight: number;
  onWeightChange: (weight: number) => void;
  doseCalculations: DoseCalculation[];
}

const EmergencyDoseCard: FC<EmergencyDoseCardProps> = ({ title, icon, weight, onWeightChange, doseCalculations }) => (
  <Card className="bg-slate-50 dark:bg-slate-900/50 flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium">Peso Estimado (kg)</label>
            <Select value={String(weight)} onValueChange={(val) => onWeightChange(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="Peso" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(w => (
                  <SelectItem key={w} value={String(w)}>{w} kg</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-3">
          {doseCalculations.map((calc, index) => (
            <div key={index} className="text-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
              <p className="font-semibold text-sm text-foreground">{calc.drug}</p>
              <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
                {calc.dose(weight)}
              </p>
              <p className="text-xs text-muted-foreground">{calc.unit(weight)}</p>
            </div>
          ))}
        </div>
      </div>

      <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="h-4 w-4 !text-amber-600" />
        <AlertTitle className="font-semibold !text-amber-700">Decisão Médica</AlertTitle>
        <AlertDescription className="!text-amber-600">
          A decisão final é de responsabilidade médica. Confirme doses e indicações.
        </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
);

const NoradrenalineCard: FC = () => (
    <Card className="bg-slate-50 dark:bg-slate-900/50 flex flex-col">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Syringe className="text-blue-500" />
        Noradrenalina (Choque)
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
        <div>
            <h4 className="font-semibold mb-2">Preparo da Solução para Infusão</h4>
            <div className="text-center bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    4 ampolas (16mg) + 234ml de SG 5%
                </p>
                <p className="text-xs text-muted-foreground">Volume Total: 250ml (Concentração: 64 mcg/ml)</p>
            </div>
            <p className="text-sm mt-4 text-muted-foreground">
                Inicie a infusão com uma dose baixa (ex: 0.1 mcg/kg/min) e ajuste conforme a resposta do paciente e o alvo de pressão arterial média (PAM).
            </p>
        </div>
         <Alert variant="destructive" className="mt-4 bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 !text-amber-600" />
            <AlertTitle className="font-semibold !text-amber-700">Atenção</AlertTitle>
            <AlertDescription className="!text-amber-600">
             Nunca administrar em bolus. Uso exclusivo em bomba de infusão contínua (BIC).
            </AlertDescription>
      </Alert>
    </CardContent>
  </Card>
)

export function EmergencyButton() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [weight, setWeight] = useState(70);

  const adrenalineDoses: DoseCalculation[] = [
      { 
          drug: "Adrenalina (1mg/ml)", 
          dose: (w) => `${(0.01 * w).toFixed(2)} mg`, 
          unit: (w) => `Volume: ${(0.01 * w).toFixed(2)} ml da ampola pura.`
      },
      { 
          drug: "Para diluição 1:10.000", 
          dose: (w) => `${(0.1 * w).toFixed(1)} ml`,
          unit: () => `Volume da solução diluída (1 amp + 9ml SF).`
      },
  ];

  const sriDoses: DoseCalculation[] = [
      {
          drug: "Etomidato (Sedação)",
          dose: (w) => `${(0.3 * w).toFixed(1)} mg`,
          unit: () => "Dose de indução padrão."
      },
      {
          drug: "Rocurônio (Bloqueador)",
          dose: (w) => `${(1.2 * w).toFixed(1)} mg`,
          unit: () => "Dose para paralisia em SRI."
      }
  ]

  return (
    <>
      <Button
        onClick={() => setIsPanelOpen(true)}
        className="fixed bottom-6 right-24 h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl animate-pulse z-30 md:bottom-8 md:right-28"
        size="icon"
        data-testid="emergency-button"
      >
        <Zap className="h-7 w-7 text-white" />
      </Button>

      <EmergencyFloatingPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
        <div className="grid grid-cols-1 gap-4">
            <EmergencyDoseCard
                title="Adrenalina (PCR)"
                icon={<Zap className="text-yellow-500" />}
                weight={weight}
                onWeightChange={setWeight}
                doseCalculations={adrenalineDoses}
            />
            <NoradrenalineCard />
            <EmergencyDoseCard
                title="Intubação (SRI)"
                icon={<Wind className="text-green-500" />}
                weight={weight}
                onWeightChange={setWeight}
                doseCalculations={sriDoses}
            />
        </div>
      </EmergencyFloatingPanel>
    </>
  );
}
