import { useState } from "react";
import { useHandovers, useCreateHandover, useDeleteHandover } from "@/hooks/use-handovers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, User, Activity, AlertTriangle, FileCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Handovers() {
  const { data: handovers, isLoading } = useHandovers();
  const [open, setOpen] = useState(false);
  const create = useCreateHandover();
  const del = useDeleteHandover();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await create.mutateAsync({
        patientName: formData.get("patientName") as string,
        age: formData.get("age") as string,
        diagnosis: formData.get("diagnosis") as string,
        ward: formData.get("ward") as string,
        bed: formData.get("bed") as string,
        sbarSituation: formData.get("sbarSituation") as string,
        sbarBackground: formData.get("sbarBackground") as string,
        sbarAssessment: formData.get("sbarAssessment") as string,
        sbarRecommendation: formData.get("sbarRecommendation") as string,
        status: "active"
      });
      toast({ title: "Adicionado", description: "Paciente adicionado à passagem." });
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Arquivar este paciente?")) {
      await del.mutateAsync(id);
      toast({ title: "Arquivado", description: "Paciente removido da lista ativa." });
    }
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold font-display text-slate-900">Passagem de Plantão</h1>
           <p className="text-slate-500">M\u00e9todo SBAR para transfer\u00eancia de cuidado.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-rose-500/25 bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" /> Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Paciente (SBAR)</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 col-span-2 md:col-span-1">
                   <label className="text-sm font-medium">Nome do Paciente</label>
                   <Input name="patientName" required placeholder="Nome completo" />
                 </div>
                 <div className="grid grid-cols-3 gap-2 col-span-2 md:col-span-1">
                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-medium">Idade</label>
                      <Input name="age" placeholder="Ex: 45a" />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-medium">Leito</label>
                      <Input name="bed" placeholder="01" />
                    </div>
                    <div className="space-y-2 col-span-1">
                      <label className="text-sm font-medium">Setor</label>
                      <Input name="ward" placeholder="UTI" />
                    </div>
                 </div>
                 <div className="space-y-2 col-span-2">
                   <label className="text-sm font-medium">Diagnóstico Principal</label>
                   <Input name="diagnosis" placeholder="Ex: Sepse foco pulmonar" />
                 </div>
              </div>

              <div className="space-y-4 border-t pt-4 border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-rose-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Situation (Situação Atual)
                  </label>
                  <Textarea name="sbarSituation" placeholder="O que está acontecendo agora? Intercorrências?" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-blue-600 flex items-center gap-2">
                     <Activity className="h-4 w-4" /> Background (Histórico/Contexto)
                  </label>
                  <Textarea name="sbarBackground" placeholder="História breve, comorbidades, alergias..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-amber-600 flex items-center gap-2">
                     <User className="h-4 w-4" /> Assessment (Avaliação)
                  </label>
                  <Textarea name="sbarAssessment" placeholder="Sinais vitais recentes, exames pendentes..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                     <FileCheck className="h-4 w-4" /> Recommendation (Recomendação/Conduta)
                  </label>
                  <Textarea name="sbarRecommendation" placeholder="O que precisa ser feito? Pendências para o plantão?" />
                </div>
              </div>

              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {handovers?.map((item) => (
          <Card key={item.id} className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
               <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      {item.patientName} 
                      <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        {item.age} • Leito {item.bed}
                      </span>
                    </CardTitle>
                    <p className="text-rose-600 font-medium mt-1">{item.diagnosis}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-1">
                 <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Situação</span>
                 <p className="text-sm text-slate-700 bg-rose-50 p-3 rounded-lg border border-rose-100">{item.sbarSituation || "-"}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Recomendação</span>
                 <p className="text-sm text-slate-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{item.sbarRecommendation || "-"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                 <details className="group">
                    <summary className="text-sm text-blue-600 cursor-pointer font-medium hover:underline flex items-center gap-2">
                       Ver detalhes completos (Background & Assessment)
                    </summary>
                    <div className="mt-4 grid md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl">
                       <div>
                          <span className="text-xs font-bold uppercase text-slate-400">Background</span>
                          <p className="text-sm mt-1">{item.sbarBackground || "-"}</p>
                       </div>
                       <div>
                          <span className="text-xs font-bold uppercase text-slate-400">Assessment</span>
                          <p className="text-sm mt-1">{item.sbarAssessment || "-"}</p>
                       </div>
                    </div>
                 </details>
              </div>
            </CardContent>
          </Card>
        ))}
        {!handovers?.length && (
           <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400">Nenhum paciente na lista de passagem.</p>
           </div>
        )}
      </div>
    </div>
  );
}
