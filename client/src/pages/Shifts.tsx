import { useState } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { useShifts, useShiftMutations } from "@/hooks/use-resources";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShiftSchema, type CreateShiftRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar as CalendarIcon, MapPin, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Shifts() {
  const { data: shifts, isLoading } = useShifts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

  const sortedShifts = shifts?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];
  const upcomingShifts = sortedShifts.filter(s => new Date(s.date) >= new Date());
  const pastShifts = sortedShifts.filter(s => new Date(s.date) < new Date());

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-slate-900">Meus Plantões</h1>
              <p className="text-slate-500">Gerencie sua escala e pagamentos.</p>
            </div>
            <CreateShiftDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Próximos</Badge>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
                {upcomingShifts.length === 0 && <p className="text-slate-400 text-sm">Nenhum plantão futuro.</p>}
              </div>
            </section>

            <section className="opacity-75">
              <h2 className="text-lg font-semibold mb-4 text-slate-500">Histórico</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastShifts.map(shift => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}

function ShiftCard({ shift }: { shift: any }) {
  return (
    <Card className="hover:shadow-lg transition-all border-slate-200">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
            {format(new Date(shift.date), "MMM", { locale: ptBR })}
          </div>
          {shift.isPaid ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none">Pago</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none">Pendente</Badge>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-3xl font-bold text-slate-900 leading-none">
            {format(new Date(shift.date), "dd")}
          </h3>
          <p className="text-sm font-medium text-slate-500 uppercase mt-1">
            {format(new Date(shift.date), "EEEE", { locale: ptBR })}
          </p>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>{shift.startTime} - {shift.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="truncate">{shift.location}</span>
          </div>
          {Number(shift.value) > 0 && (
            <div className="flex items-center gap-2 font-medium text-slate-900 pt-2 border-t mt-3">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span>R$ {Number(shift.value).toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateShiftDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { create } = useShiftMutations();
  const form = useForm<CreateShiftRequest>({
    resolver: zodResolver(insertShiftSchema),
    defaultValues: {
      userId: "temp", // Backend overrides this
      location: "",
      startTime: "07:00",
      endTime: "19:00",
      value: 0, // Changed to number
      isPaid: false
    }
  });

  const onSubmit = (data: CreateShiftRequest) => {
    create.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Plantão</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label>Local</Label>
            <Input {...form.register("location")} placeholder="Hospital X" />
            {form.formState.errors.location && <span className="text-xs text-red-500">{form.formState.errors.location.message}</span>}
          </div>
          
          <div className="grid gap-2">
            <Label>Data</Label>
            <Input type="date" {...form.register("date", { valueAsDate: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Início</Label>
              <Input type="time" {...form.register("startTime")} />
            </div>
            <div className="grid gap-2">
              <Label>Fim</Label>
              <Input type="time" {...form.register("endTime")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" {...form.register("value", { valueAsNumber: true })} />
          </div>

          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Confirmar Agendamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
