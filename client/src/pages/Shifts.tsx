import { useState } from "react";
import { useShifts, useCreateShift, useDeleteShift, useUpdateShift } from "@/hooks/use-shifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Plus, Trash2, Clock, MapPin, DollarSign, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Shifts() {
  const { data: shifts, isLoading } = useShifts();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedShifts = shifts?.filter(s => 
    date && new Date(s.date).toDateString() === date.toDateString()
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">Plantões</h1>
            <p className="text-muted-foreground">Gerencie sua agenda e financeiro.</p>
          </div>
          <ShiftDialog date={date} />
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4">
            {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
          </h2>
          
          <div className="space-y-4">
            {selectedShifts?.map((shift) => (
              <div key={shift.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-xl border group transition-all" data-testid={`card-shift-${shift.id}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{shift.location}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      shift.type === "Dia" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                      shift.type === "Noite" ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" :
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    )}>
                      {shift.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {shift.startTime} - {shift.endTime}</span>
                    {shift.value && (
                       <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><DollarSign className="h-3 w-3" /> R$ {shift.value}</span>
                    )}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 invisible group-hover:visible flex gap-2">
                  <ShiftDialog shift={shift} />
                  <DeleteShiftButton id={shift.id} />
                </div>
              </div>
            ))}
            {!selectedShifts?.length && (
              <p className="text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                Nenhum plantão neste dia.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card p-4 rounded-2xl shadow-sm border">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={{
              booked: (date) => shifts?.some(s => new Date(s.date).toDateString() === date.toDateString()) || false
            }}
            modifiersStyles={{
              booked: { fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'underline decoration-blue-200' }
            }}
          />
        </div>
        
        <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-xl">
          <h3 className="font-bold text-lg mb-2">Resumo Financeiro</h3>
          <p className="text-primary-foreground/80 text-sm">Baseado nos plantões cadastrados.</p>
          <div className="mt-4 pt-4 border-t border-primary-foreground/20">
             <div className="flex justify-between items-center gap-2">
               <span>Total Previsto</span>
               <span className="text-2xl font-bold" data-testid="text-total-earnings">
                 R$ {shifts?.reduce((acc, curr) => acc + Number(curr.value || 0), 0).toLocaleString('pt-BR')}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShiftDialog({ shift, date }: { shift?: any, date?: Date }) {
  const [open, setOpen] = useState(false);
  const create = useCreateShift();
  const update = useUpdateShift();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date || (shift ? new Date(shift.date) : new Date()));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate) return toast({ title: "Data obrigatória", variant: "destructive" });

    const formData = new FormData(e.currentTarget);
    const typeVal = formData.get("type") as string;
    const startTimeVal = formData.get("startTime") as string;
    const endTimeVal = formData.get("endTime") as string;
    const valueVal = formData.get("value") as string;
    
    const normalizedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0);
    
    const data: Record<string, any> = {
      date: normalizedDate,
      location: formData.get("location") as string,
    };
    
    if (typeVal) data.type = typeVal;
    if (startTimeVal) data.startTime = startTimeVal;
    if (endTimeVal) data.endTime = endTimeVal;
    if (valueVal) data.value = valueVal;

    try {
      if (shift) {
        await update.mutateAsync({ id: shift.id, ...data });
        toast({ title: "Atualizado", description: "Plantão atualizado." });
      } else {
        await create.mutateAsync(data as any);
        toast({ title: "Agendado", description: "Plantão agendado." });
      }
      setOpen(false);
    } catch (error) {
      console.error("Shift save error:", error);
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {shift ? (
           <Button size="icon" variant="ghost">
             <Pencil className="h-4 w-4" />
           </Button>
        ) : (
           <Button data-testid="button-new-shift">
             <Plus className="mr-2 h-4 w-4" /> Novo Plantão
           </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shift ? "Editar" : "Novo"} Plantão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Local</label>
            <Input name="location" defaultValue={shift?.location} required placeholder="Ex: UPA Central" data-testid="input-shift-location" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Selecione</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
               <label className="text-sm font-medium">Tipo</label>
               <Select name="type" defaultValue={shift?.type || "12h Diurno"}>
                 <SelectTrigger data-testid="select-shift-type">
                   <SelectValue placeholder="Selecione" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="12h Diurno">12h Diurno</SelectItem>
                   <SelectItem value="12h Noturno">12h Noturno</SelectItem>
                   <SelectItem value="24h">24h</SelectItem>
                   <SelectItem value="6h">6h</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Início</label>
               <Input name="startTime" type="time" defaultValue={shift?.startTime || "07:00"} required data-testid="input-shift-start" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Fim</label>
               <Input name="endTime" type="time" defaultValue={shift?.endTime || "19:00"} required data-testid="input-shift-end" />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input name="value" type="number" defaultValue={shift?.value} placeholder="0.00" step="0.01" data-testid="input-shift-value" />
          </div>

          <Button type="submit" className="w-full" disabled={create.isPending || update.isPending} data-testid="button-save-shift">
            {create.isPending || update.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteShiftButton({ id }: { id: number }) {
  const del = useDeleteShift();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirm("Remover este plantão?")) {
      await del.mutateAsync(id);
      toast({ title: "Removido", description: "Plantão removido da agenda." });
    }
  };

  return (
    <Button size="icon" variant="ghost" onClick={handleDelete} data-testid={`button-delete-shift-${id}`}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
