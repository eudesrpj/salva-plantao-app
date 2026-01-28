/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Heart, Activity, Droplets, Scale, Ruler } from "lucide-react";

const CALCULATORS = [
  {
    title: "IMC",
    description: "Índice de Massa Corporal",
    icon: Scale,
    color: "bg-blue-100"
  },
  {
    title: "Clearance de Creatinina",
    description: "Função renal",
    icon: Droplets,
    color: "bg-green-100"
  },
  {
    title: "Dose por Peso",
    description: "Cálculo de dosagem",
    icon: Calculator,
    color: "bg-purple-100"
  },
  {
    title: "Score de Risco",
    description: "Avaliação de risco cardiovascular",
    icon: Heart,
    color: "bg-red-100"
  },
  {
    title: "Superfície Corporal",
    description: "Área de superfície corporal",
    icon: Ruler,
    color: "bg-orange-100"
  },
  {
    title: "Frequência Cardíaca",
    description: "Calculadora de FC alvo",
    icon: Activity,
    color: "bg-pink-100"
  }
];

export default function Calculators() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Calculadoras Médicas
          </h1>
          <p className="text-slate-600 mt-2">
            Ferramentas de cálculo rápido para uso clínico
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CALCULATORS.map((calc) => {
            const Icon = calc.icon;
            return (
              <Card key={calc.title} className={`${calc.color} hover:shadow-lg transition-shadow cursor-pointer border-0`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-slate-700" />
                    {calc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">{calc.description}</p>
                  <p className="text-xs text-slate-500 mt-4">Em breve disponível</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
