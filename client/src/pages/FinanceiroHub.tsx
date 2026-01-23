/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";
import Finance from "./Finance";
import IRPFCalculator from "./IRPFCalculator";

export default function FinanceiroHub() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-display">
            Financeiro
          </h1>
          <p className="text-slate-600 mt-2">
            Gerencie sua vida financeira e ganhos
          </p>
        </header>

        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="finance">Ganhos & Metas</TabsTrigger>
            <TabsTrigger value="irpf">IRPF 2024</TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="mt-6">
            <Finance />
          </TabsContent>

          <TabsContent value="irpf" className="mt-6">
            <IRPFCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
