import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, X, ChevronRight } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 h-14 w-14 rounded-full shadow-xl z-40 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 transition-all"
          size="icon"
        >
          <Calculator className="h-6 w-6 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Calculadora Médica</DialogTitle>
        </DialogHeader>
        <MedicalCalculators />
      </DialogContent>
    </Dialog>
  );
}

function MedicalCalculators() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  
  const imc = weight && height 
    ? (parseFloat(weight) / ((parseFloat(height)/100) ** 2)).toFixed(1)
    : null;

  return (
    <Tabs defaultValue="imc" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="imc">IMC</TabsTrigger>
        <TabsTrigger value="creatinine">ClCr</TabsTrigger>
        <TabsTrigger value="drops">Gotejamento</TabsTrigger>
      </TabsList>
      
      <TabsContent value="imc" className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input 
            type="number" 
            placeholder="Ex: 70" 
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Altura (cm)</Label>
          <Input 
            type="number" 
            placeholder="Ex: 175" 
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        
        {imc && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center border">
            <p className="text-sm text-slate-500">Seu IMC</p>
            <p className="text-3xl font-bold text-primary">{imc}</p>
            <p className="text-xs text-slate-400 mt-1">
              {parseFloat(imc) < 18.5 ? "Abaixo do peso" : 
               parseFloat(imc) < 24.9 ? "Peso normal" : 
               parseFloat(imc) < 29.9 ? "Sobrepeso" : "Obesidade"}
            </p>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="creatinine" className="py-4 text-center text-slate-500">
        <p>Calculadora de Cockcroft-Gault em desenvolvimento.</p>
      </TabsContent>
      
      <TabsContent value="drops" className="py-4 text-center text-slate-500">
        <p>Calculadora de Gotejamento em desenvolvimento.</p>
      </TabsContent>
    </Tabs>
  );
}
