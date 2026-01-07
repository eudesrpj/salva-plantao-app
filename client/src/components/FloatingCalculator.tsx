import { useState, useRef, useEffect } from "react";
import { Calculator, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 450,
        y: window.innerHeight - 550
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
      return `${doseMg.toFixed(0)}mg (${ml.toFixed(1)}ml)`;
    }
    return `${doseMg.toFixed(1)} mg`;
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8 print:hidden">
        <Button 
          size="icon" 
          onClick={() => setOpen(!open)}
          className="h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-all duration-300 border-4 border-white/20"
          data-testid="button-floating-calculator"
        >
          <Calculator className="h-8 w-8 text-white" />
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
              <div className="relative">
                <Label htmlFor="calc-weight" className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-2 text-xs font-semibold text-primary rounded-full">
                  Peso do Paciente (kg)
                </Label>
                <Input
                  id="calc-weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-12 text-xl font-bold text-center border-primary/20 focus-visible:ring-primary/30 rounded-xl"
                  placeholder="0.0"
                  data-testid="input-calculator-weight"
                />
              </div>
            </div>

            <Tabs defaultValue="pediatria" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-none border-b border-slate-200 dark:border-slate-700">
                <TabsTrigger value="pediatria" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2">
                  Pediatria
                </TabsTrigger>
                <TabsTrigger value="emergencia" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm rounded-lg py-2">
                  Emergência
                </TabsTrigger>
              </TabsList>
              
              <div className="p-3 bg-white dark:bg-slate-900 h-[280px] overflow-y-auto">
                <TabsContent value="pediatria" className="space-y-2 mt-0">
                  <DoseCard label="Dipirona" dose="20mg/kg" result={calculateDose(20, 500)} concentration="Gotas 500mg/ml" color="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900" />
                  <DoseCard label="Paracetamol" dose="15mg/kg" result={calculateDose(15, 200)} concentration="Gotas 200mg/ml" color="bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900" />
                  <DoseCard label="Ibuprofeno" dose="10mg/kg" result={calculateDose(10, 50)} concentration="Gotas 50mg/ml" color="bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900" />
                  <DoseCard label="Amoxicilina" dose="50mg/kg" result={calculateDose(50, 50)} concentration="Susp 250mg/5ml" color="bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900" />
                  <DoseCard label="Azitromicina" dose="10mg/kg" result={calculateDose(10, 40)} concentration="Susp 200mg/5ml" color="bg-pink-50 dark:bg-pink-950/30 border-pink-100 dark:border-pink-900" />
                </TabsContent>

                <TabsContent value="emergencia" className="space-y-2 mt-0">
                  <DoseCard label="Adrenalina (PCR)" dose="0.01mg/kg" result={calculateDose(0.01)} concentration="1mg/ml (Pura)" color="bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" />
                  <DoseCard label="Midazolam" dose="0.1mg/kg" result={calculateDose(0.1, 5)} concentration="5mg/ml" color="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900" />
                  <DoseCard label="Fentanil" dose="1mcg/kg" result={calculateDose(0.001, 0.05)} concentration="50mcg/ml" color="bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900" />
                  <DoseCard label="Ketamina" dose="1.5mg/kg" result={calculateDose(1.5, 50)} concentration="50mg/ml" color="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900" />
                  <DoseCard label="Rocurônio" dose="1mg/kg" result={calculateDose(1, 10)} concentration="10mg/ml" color="bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </>
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
