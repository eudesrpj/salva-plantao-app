import { useState } from "react";
import { useChecklists, useCreateChecklist, useDeleteChecklist } from "@/hooks/use-checklists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Using Textarea for JSON input for MVP
import { Search, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/loading-spinner";

export default function Checklists() {
  const { data: checklists, isLoading } = useChecklists();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const create = useCreateChecklist();
  const del = useDeleteChecklist();

  const filtered = checklists?.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const contentText = formData.get("content") as string;
    
    // Simple parsing for MVP: Assume line breaks = items
    const items = contentText.split('\n').filter(Boolean);
    const structuredContent = { items, redFlags: [], exams: [] };

    try {
      await create.mutateAsync({
        title: formData.get("title") as string,
        content: structuredContent,
        category: "Geral",
        isPublic: false
      });
      toast({ title: "Criado", description: "Checklist criado." });
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Excluir?")) await del.mutateAsync(id);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><PageLoader text="Carregando condutas..." /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-display text-slate-900">Condutas & Checklists</h1>
        <Dialog>
          <DialogTrigger asChild>
             <Button className="shadow-lg shadow-indigo-500/25 bg-indigo-600 hover:bg-indigo-700">
               <Plus className="mr-2 h-4 w-4" /> Novo
             </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Conduta</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
               <Input name="title" placeholder="Título (Ex: Manejo da Sepse)" required />
               <Textarea 
                 name="content" 
                 placeholder="Digite os passos (um por linha)..." 
                 className="min-h-[200px]"
                 required
               />
               <Button type="submit" className="w-full bg-indigo-600">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <Input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conduta..." 
          className="pl-10 h-12"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered?.map(item => (
          <Card key={item.id} className="border-slate-100 hover:border-indigo-200 transition-colors">
            <CardHeader className="flex flex-row justify-between items-start pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">{item.title}</CardTitle>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="h-6 w-6 text-slate-300 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
               <ul className="space-y-2">
                 {(item.content as any).items?.slice(0, 5).map((line: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      {line}
                    </li>
                 ))}
                 {(item.content as any).items?.length > 5 && (
                    <p className="text-xs text-slate-400 pl-6">+ mais {(item.content as any).items.length - 5} itens</p>
                 )}
               </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
