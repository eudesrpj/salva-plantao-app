
import { usePatientContextStore, AgeGroup, Allergy, KeyCondition, Severity } from "@/stores/usePatientContextStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { User, Baby, PersonStanding, X, Syringe, Shield, HeartPulse, Brain, AlertCircle, TestTube2, Activity, Bone, Pill } from "lucide-react";

interface ChipProps {
  label: string;
  value: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
  className?: string;
  icon?: React.ReactNode;
}

const SelectionChip: React.FC<ChipProps> = ({ label, value, isSelected, onSelect, className, icon }) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    className={cn("h-auto py-2 px-4 text-sm font-normal gap-2 justify-start", isSelected && "font-semibold", className)}
    onClick={() => onSelect(value)}
  >
    {icon}
    {label}
  </Button>
);

interface MultiChipProps {
  label: string;
  value: Allergy | KeyCondition;
  selectedItems: (Allergy | KeyCondition)[];
  onToggle: (value: any) => void;
  className?: string;
  icon?: React.ReactNode;
}

const MultiSelectChip: React.FC<MultiChipProps> = ({ label, value, selectedItems, onToggle, className, icon }) => {
    const isSelected = selectedItems.includes(value);
    return (
        <Button
            variant={isSelected ? "secondary" : "outline"}
            className={cn("h-auto py-1.5 px-3 text-xs gap-2 justify-start border-dashed", isSelected && "font-semibold border-solid bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200", className)}
            onClick={() => onToggle(value)}
        >
            {icon}
            {label}
        </Button>
    );
};

const ALLERGY_OPTIONS: { label: string; value: Allergy, icon: React.ReactNode }[] = [
    { label: "Penicilina / β-lactâmicos", value: "penicillin", icon: <Syringe className="w-3.5 h-3.5" /> },
    { label: "Sulfa (SMX-TMP)", value: "sulfa", icon: <Pill className="w-3.5 h-3.5" /> },
    { label: "Dipirona", value: "dypirone", icon: <Pill className="w-3.5 h-3.5" /> },
    { label: "AINEs", value: "nsaid", icon: <Pill className="w-3.5 h-3.5" /> },
    { label: "Macrolídeos", value: "macrolide", icon: <Pill className="w-3.5 h-3.5" /> },
    { label: "Quinolonas", value: "quinolone", icon: <Pill className="w-3.5 h-3.5" /> },
    { label: "Iodo / Contraste", value: "iodine", icon: <TestTube2 className="w-3.5 h-3.5" /> },
];

const CONDITION_OPTIONS: { label: string; value: KeyCondition, icon: React.ReactNode }[] = [
    { label: "DRC / Insuf. Renal", value: "renal", icon: <Shield className="w-3.5 h-3.5" /> },
    { label: "Hepatopatia", value: "hepatic", icon: <Shield className="w-3.5 h-3.5" /> },
    { label: "Anticoagulado", value: "anticoagulant", icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { label: "Diabetes", value: "diabetes", icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { label: "Imunossuprimido", value: "immunosuppressed", icon: <Shield className="w-3.5 h-3.5" /> },
    { label: "Asma / DPOC", value: "asthma_dpoc", icon: <Activity className="w-3.5 h-3.5" /> },
    { label: "História de Convulsão", value: "seizure_history", icon: <Brain className="w-3.5 h-3.5" /> },
];

export function PatientContextForm() {
  const {
    ageGroup, isPregnant, pediatricWeightKg, allergies, otherAllergies, keyConditions, severity,
    setPatientContext, resetPatientContext, toggleAllergy, toggleKeyCondition
  } = usePatientContextStore();

  const handleApply = () => {
    setPatientContext({ isActive: true });
  };

  const handleReset = () => {
    resetPatientContext();
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">

        <Card>
            <CardHeader><CardTitle className="text-lg">Faixa Etária</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
                <SelectionChip label="Adulto" value="adult" isSelected={ageGroup === 'adult'} onSelect={(v) => setPatientContext({ ageGroup: v as AgeGroup, isPregnant: null })} icon={<User className="w-4 h-4" />} className="flex-1" />
                <SelectionChip label="Pediatria" value="pediatric" isSelected={ageGroup === 'pediatric'} onSelect={(v) => setPatientContext({ ageGroup: v as AgeGroup })} icon={<Baby className="w-4 h-4" />} className="flex-1" />
            </CardContent>
        </Card>

        {ageGroup === 'pediatric' && (
            <Card>
                <CardHeader><CardTitle className="text-lg">Peso Pediátrico</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Label htmlFor="pediatric-weight">Peso (kg)</Label>
                    <Input
                        id="pediatric-weight"
                        type="number"
                        value={pediatricWeightKg || ''}
                        onChange={(e) => setPatientContext({ pediatricWeightKg: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Ex: 15"
                        className="max-w-xs"
                    />
                    <div className="flex gap-2">
                        {[12, 15, 20].map(w => (
                            <Button key={w} variant="outline" size="sm" onClick={() => setPatientContext({ pediatricWeightKg: w })}>{w} kg</Button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}

        {ageGroup === 'adult' && (
            <Card>
                <CardHeader><CardTitle className="text-lg">Gestante</CardTitle></CardHeader>
                <CardContent className="flex gap-2">
                    <SelectionChip label="Sim" value="yes" isSelected={isPregnant === true} onSelect={() => setPatientContext({ isPregnant: true })} icon={<PersonStanding className="w-4 h-4" />} />
                    <SelectionChip label="Não" value="no" isSelected={isPregnant === false} onSelect={() => setPatientContext({ isPregnant: false })} icon={<X className="w-4 h-4" />} />
                </CardContent>
            </Card>
        )}
        
        <Card>
             <CardHeader><CardTitle className="text-lg">Alergias Conhecidas</CardTitle></CardHeader>
             <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {ALLERGY_OPTIONS.map(opt => (
                        <MultiSelectChip key={opt.value} {...opt} selectedItems={allergies} onToggle={toggleAllergy} />
                    ))}
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="other-allergies">Outras alergias (separadas por vírgula)</Label>
                    <Textarea
                        id="other-allergies"
                        value={otherAllergies}
                        onChange={(e) => setPatientContext({ otherAllergies: e.target.value })}
                        placeholder="Ex: Ivermectina, corante amarelo..."
                        rows={2}
                    />
                </div>
             </CardContent>
        </Card>

        <Card>
             <CardHeader><CardTitle className="text-lg">Condições-Chave</CardTitle></CardHeader>
             <CardContent className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map(opt => (
                    <MultiSelectChip key={opt.value} {...opt} selectedItems={keyConditions} onToggle={toggleKeyCondition} />
                ))}
             </CardContent>
        </Card>

        <Card>
             <CardHeader><CardTitle className="text-lg">Gravidade do Caso</CardTitle></CardHeader>
             <CardContent className="flex gap-2">
                <SelectionChip label="Leve" value="mild" isSelected={severity === 'mild'} onSelect={(v) => setPatientContext({ severity: v as Severity })} />
                <SelectionChip label="Moderado" value="moderate" isSelected={severity === 'moderate'} onSelect={(v) => setPatientContext({ severity: v as Severity })} />
                <SelectionChip label="Grave" value="severe" isSelected={severity === 'severe'} onSelect={(v) => setPatientContext({ severity: v as Severity })} />
             </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={handleReset}>Limpar Contexto</Button>
            <Button onClick={handleApply}>Aplicar Contexto</Button>
        </div>
    </div>
  );
}
