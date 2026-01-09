
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Droplets, CheckCircle2 } from "lucide-react";

const SodiumCalculator = () => {
  const [weight, setWeight] = useState(70);
  const [currentNa, setCurrentNa] = useState(125);
  const [desiredNa, setDesiredNa] = useState(135);
  const [gender, setGender] = useState("male");
  const [result, setResult] = useState("");

  const calculateSodiumDeficit = () => {
    if (!weight || !currentNa || !desiredNa) {
        setResult("Por favor, preencha todos os campos para calcular.");
        return;
    }
    
    const waterRatio = gender === "male" ? 0.6 : 0.5;
    const totalBodyWater = weight * waterRatio;
    const sodiumDeficit = totalBodyWater * (desiredNa - currentNa);

    if (sodiumDeficit <= 0) {
      setResult("O sódio atual já é maior ou igual ao desejado. Não é necessário repor.");
      return;
    }

    // NaCl 20% ampoule (10ml) = 17.1 mEq
    const naclAmpoules = sodiumDeficit / 17.1;
    const sfVolume = 500; 

    setResult(`Doutor, para corrigir o déficit de ${sodiumDeficit.toFixed(0)} mEq, adicione ${naclAmpoules.toFixed(1)} ampolas de NaCl 20% (10ml) em ${sfVolume} ml de SF 0.9% ou SG 5%. Infundir em 24h com controle de sódio a cada 6-12h. Velocidade de correção não deve exceder 10-12 mEq/L em 24h.`);
  };

  return (
    <div className="space-y-4">
        <h3 className="font-semibold">Déficit de Sódio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} placeholder="Peso (kg)" />
            <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="male">Homem</SelectItem>
                    <SelectItem value="female">Mulher</SelectItem>
                </SelectContent>
            </Select>
            <Input type="number" value={currentNa} onChange={(e) => setCurrentNa(Number(e.target.value))} placeholder="Na+ Atual (mEq/L)" />
            <Input type="number" value={desiredNa} onChange={(e) => setDesiredNa(Number(e.target.value))} placeholder="Na+ Desejado (mEq/L)" />
        </div>
        <Button onClick={calculateSodiumDeficit}>Calcular Déficit de Sódio</Button>
        {result && <p className="text-blue-600 dark:text-blue-400 font-medium p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">{result}</p>}
    </div>
  )
}

const PotassiumCalculator = () => {
    const [kclAmpoules, setKclAmpoules] = useState(2); // KCl 10% 10ml ampoules
    const [volume, setVolume] = useState(500);

    const KCL_MEQ_PER_AMPOULE = 13.5; // KCl 10% 10ml ampoule has ~13.5 mEq
    const MAX_CONCENTRATION_PERIPHERAL = 40; // mEq/L

    const { concentration, isSafe, requiredVolume } = useMemo(() => {
        const totalMeq = kclAmpoules * KCL_MEQ_PER_AMPOULE;
        const totalVolumeL = volume / 1000;
        const concentration = totalVolumeL > 0 ? totalMeq / totalVolumeL : 0;
        const isSafe = concentration <= MAX_CONCENTRATION_PERIPHERAL;
        const requiredVolume = Math.ceil((totalMeq / MAX_CONCENTRATION_PERIPHERAL) * 1000);

        return { concentration, isSafe, requiredVolume };
    }, [kclAmpoules, volume]);

    const resultText = useMemo(() => {
        if (!isSafe) {
            return `A concentração (${concentration.toFixed(1)} mEq/L) excede o limite de segurança para veia periférica. Aumente o volume para pelo menos ${requiredVolume} ml.`;
        }
        const totalMeq = kclAmpoules * KCL_MEQ_PER_AMPOULE;
        const infusionHours = Math.max(1, totalMeq / 20); // Not faster than 20 mEq/hour

        return `Doutor, adicione ${kclAmpoules} ampolas de KCl 10% em ${volume} ml de soro (SF 0.9% ou SG 5%) para correr em ${infusionHours.toFixed(1)} horas. A concentração final é de ${concentration.toFixed(1)} mEq/L.`
    }, [isSafe, concentration, requiredVolume, kclAmpoules, volume]);

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Reposição de Potássio (K+) para Veia Periférica</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Nº de Ampolas de KCl 10% (10ml)</label>
                    <Input type="number" value={kclAmpoules} onChange={e => setKclAmpoules(Number(e.target.value))} />
                </div>
                <div>
                    <label className="text-sm font-medium">Volume de Soro (ml)</label>
                    <Input type="number" value={volume} onChange={e => setVolume(Number(e.target.value))} />
                </div>
            </div>

            {isSafe ? (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle2 className="h-4 w-4 !text-green-600" />
                    <AlertTitle className="font-semibold !text-green-700">Concentração Segura</AlertTitle>
                    <AlertDescription className="!text-green-600 font-mono text-sm">
                        {resultText}
                    </AlertDescription>
                </Alert>
            ) : (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Risco: Concentração Elevada</AlertTitle>
                    <AlertDescription className="font-mono text-sm">
                        {resultText}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}

export function ElectrolyteCalculator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets />
          Calculadora de Eletrólitos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SodiumCalculator />
        <div className="border-t pt-6">
            <PotassiumCalculator />
        </div>
         <Alert variant="default" className="bg-slate-100 dark:bg-slate-800 mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Aviso Legal Obrigatório</AlertTitle>
            <AlertDescription>
            As calculadoras são ferramentas de apoio. A decisão final sobre diagnóstico, dosagens e tratamentos é de exclusiva responsabilidade do profissional de saúde. Verifique as informações.
            </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
