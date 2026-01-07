import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");

  const calculateDose = (mgPerKg: number, concentration?: number) => {
    const w = parseFloat(weight);
    if (isNaN(w) || !w) return "---";
    const doseMg = w * mgPerKg;
    if (concentration) {
      const ml = doseMg / concentration;
      return `${doseMg.toFixed(0)}mg (${ml.toFixed(1)}ml)`;
    }
    return `${doseMg.toFixed(1)} mg`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 md:bottom-8 md:left-8 print:hidden">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-all duration-300 border-4 border-white/20"
          >
            <Calculator className="h-8 w-8 text-white" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-slate-100 shadow-2xl rounded-3xl p-0 gap-0 overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="font-display text-xl text-primary">Calculadora Rápida</DialogTitle>
              <DialogClose className="opacity-70 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5 text-primary" />
              </DialogClose>
            </DialogHeader>
            <div className="mt-6">
               <div className="relative">
                 <Label htmlFor="weight" className="absolute -top-2.5 left-3 bg-white px-2 text-xs font-semibold text-primary rounded-full">Peso do Paciente (kg)</Label>
                 <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-14 text-2xl font-bold text-center border-primary/20 focus-visible:ring-primary/30 rounded-xl bg-white shadow-sm"
                    placeholder="0.0"
                    autoFocus
                  />
               </div>
            </div>
          </div>

          <Tabs defaultValue="pediatria" className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/50 rounded-none border-b border-slate-200">
              <TabsTrigger value="pediatria" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3">Pediatria</TabsTrigger>
              <TabsTrigger value="emergencia" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3">Emergência</TabsTrigger>
            </TabsList>
            
            <div className="p-4 bg-white h-[400px] overflow-y-auto custom-scrollbar">
              <TabsContent value="pediatria" className="space-y-3 mt-0">
                <DoseCard label="Dipirona" dose="20mg/kg" result={calculateDose(20, 500)} concentration="Gotas 500mg/ml" color="bg-blue-50 border-blue-100" />
                <DoseCard label="Paracetamol" dose="15mg/kg" result={calculateDose(15, 200)} concentration="Gotas 200mg/ml" color="bg-green-50 border-green-100" />
                <DoseCard label="Ibuprofeno" dose="10mg/kg" result={calculateDose(10, 50)} concentration="Gotas 50mg/ml" color="bg-orange-50 border-orange-100" />
                <DoseCard label="Amoxicilina" dose="50mg/kg" result={calculateDose(50, 50)} concentration="Susp 250mg/5ml (50mg/ml)" color="bg-purple-50 border-purple-100" />
                <DoseCard label="Azitromicina" dose="10mg/kg" result={calculateDose(10, 40)} concentration="Susp 200mg/5ml (40mg/ml)" color="bg-pink-50 border-pink-100" />
              </TabsContent>

              <TabsContent value="emergencia" className="space-y-3 mt-0">
                 <DoseCard label="Adrenalina (PCR)" dose="0.01mg/kg" result={calculateDose(0.01)} concentration="1mg/ml (Pura)" color="bg-red-50 border-red-100" />
                 <DoseCard label="Midazolam (Sedação)" dose="0.1mg/kg" result={calculateDose(0.1, 5)} concentration="5mg/ml" color="bg-indigo-50 border-indigo-100" />
                 <DoseCard label="Fentanil (Analgesia)" dose="1mcg/kg" result={calculateDose(0.001, 0.05)} concentration="50mcg/ml (0.05mg/ml)" color="bg-cyan-50 border-cyan-100" />
                 <DoseCard label="Ketamina (Sedação)" dose="1.5mg/kg" result={calculateDose(1.5, 50)} concentration="50mg/ml" color="bg-emerald-50 border-emerald-100" />
                 <DoseCard label="Rocurônio" dose="1mg/kg" result={calculateDose(1, 10)} concentration="10mg/ml" color="bg-slate-50 border-slate-200" />
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DoseCard({ label, dose, result, concentration, color }: { label: string, dose: string, result: string, concentration?: string, color: string }) {
  return (
    <div className={cn("p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.02]", color)}>
      <div>
        <h4 className="font-bold text-slate-700">{label}</h4>
        <div className="flex gap-2 text-xs text-slate-500 mt-1">
          <span className="bg-white/50 px-1.5 py-0.5 rounded border border-black/5">{dose}</span>
          {concentration && <span>{concentration}</span>}
        </div>
      </div>
      <div className="text-right">
        <span className="text-lg font-bold text-slate-800 block">{result}</span>
      </div>
    </div>
  );
}
