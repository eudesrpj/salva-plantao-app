/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

// IRPF 2024 - Brazilian tax brackets (may change by year)
const IRPF_BRACKETS = [
  { limit: 2112, rate: 0 },
  { limit: 2826.65, rate: 0.075 },
  { limit: 3751.05, rate: 0.15 },
  { limit: 4664.68, rate: 0.225 },
  { limit: Infinity, rate: 0.275 }
];

const DEDUCTION_LIMIT = 869.36; // Deduction limit for 2024

export default function IRPFCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [deductions, setDeductions] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    monthlyGross: number;
    monthlyDeductions: number;
    monthlyTaxable: number;
    monthlyIRPF: number;
    monthlyNet: number;
    annualGross: number;
    annualDeductions: number;
    annualTaxable: number;
    annualIRPF: number;
    annualNet: number;
  } | null>(null);

  const calculateIRPF = (income: number): number => {
    let tax = 0;
    let previousLimit = 0;

    for (const bracket of IRPF_BRACKETS) {
      if (income <= previousLimit) break;

      const taxableInThisBracket = Math.min(income, bracket.limit) - previousLimit;
      tax += taxableInThisBracket * bracket.rate;
      previousLimit = bracket.limit;
    }

    return tax;
  };

  const handleCalculate = () => {
    const monthly = parseFloat(monthlyIncome) || 0;
    const monthlyDed = parseFloat(deductions) || 0;

    if (monthly <= 0) {
      alert("Informe um valor de renda válido");
      return;
    }

    // Use the smaller of deductions or the limit
    const allowedDeductions = Math.min(monthlyDed, DEDUCTION_LIMIT);
    const monthlyTaxable = Math.max(0, monthly - allowedDeductions);
    const monthlyIrpf = calculateIRPF(monthlyTaxable);
    const monthlyNet = monthly - monthlyIrpf;

    const annualGross = monthly * 12;
    const annualDeductions = allowedDeductions * 12;
    const annualTaxable = monthlyTaxable * 12;
    const annualIrpf = monthlyIrpf * 12;
    const annualNet = monthlyNet * 12;

    setResult({
      monthlyGross: monthly,
      monthlyDeductions: allowedDeductions,
      monthlyTaxable,
      monthlyIRPF: monthlyIrpf,
      monthlyNet,
      annualGross,
      annualDeductions,
      annualTaxable,
      annualIRPF: annualIrpf,
      annualNet
    });

    setShowResult(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora IRPF (Imposto de Renda)
          </CardTitle>
          <CardDescription>
            Estimativa mensal e anual de imposto sobre sua renda (modo simplificado)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Renda Mensal Bruta (R$)
              </label>
              <Input
                type="number"
                placeholder="Ex: 5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Deduções Mensais (R$)
              </label>
              <Input
                type="number"
                placeholder="Ex: 500 (máximo R$ 869,36)"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>

          <Button onClick={handleCalculate} size="lg" className="w-full">
            Calcular IRPF
          </Button>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
            <p className="font-semibold text-slate-700 mb-1">Aviso importante:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Esta é uma estimativa simplificada</li>
              <li>Deduções: máximo de R$ 869,36/mês (padrão 2024)</li>
              <li>Não substitui a declaração oficial</li>
              <li>Consulte um contador para valores exatos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {showResult && result && (
        <>
          {/* Monthly Result */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Estimativa Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Renda Bruta</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {result.monthlyGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Deduções</p>
                  <p className="text-lg font-bold text-slate-900">
                    -R$ {result.monthlyDeductions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Base Tributável</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {result.monthlyTaxable.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded">
                  <p className="text-xs text-slate-600">IRPF</p>
                  <p className="text-lg font-bold text-red-700">
                    -R$ {result.monthlyIRPF.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="md:col-span-2 bg-green-100 p-3 rounded">
                  <p className="text-xs text-slate-600">Renda Líquida (após IRPF)</p>
                  <p className="text-lg font-bold text-green-700">
                    R$ {result.monthlyNet.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annual Result */}
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-lg">Estimativa Anual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Renda Bruta</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {result.annualGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Deduções</p>
                  <p className="text-lg font-bold text-slate-900">
                    -R$ {result.annualDeductions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Base Tributável</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {result.annualTaxable.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded">
                  <p className="text-xs text-slate-600">IRPF Anual</p>
                  <p className="text-lg font-bold text-red-700">
                    -R$ {result.annualIRPF.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="md:col-span-2 bg-green-100 p-3 rounded">
                  <p className="text-xs text-slate-600">Renda Líquida Anual</p>
                  <p className="text-lg font-bold text-green-700">
                    R$ {result.annualNet.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
