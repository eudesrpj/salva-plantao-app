import { useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const calculateDose = (mgPerKg: number) => {
    const w = parseFloat(weight);
    if (isNaN(w)) return "Peso inválido";
    return `${(w * mgPerKg).toFixed(1)} mg`;
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-110">
            <Calculator className="h-6 w-6 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Calculadora Médica Rápida</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="col-span-3"
                placeholder="Ex: 70"
              />
            </div>

            <Tabs defaultValue="pediatria" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pediatria">Pediatria</TabsTrigger>
                <TabsTrigger value="emergencia">Emergência</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pediatria" className="space-y-2 mt-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Dipirona (20mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(20)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Paracetamol (15mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(15)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Ibuprofeno (10mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Amoxicilina (50mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(50)}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="emergencia" className="space-y-2 mt-4">
                 <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Adrenalina (0.01mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(0.01)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Midazolam (0.1mg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(0.1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Fentanil (1mcg/kg)</span>
                    <span className="text-sm font-bold text-primary">{calculateDose(0.001)}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
