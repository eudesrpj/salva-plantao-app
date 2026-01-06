import { useState } from "react";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { usePrescriptions, usePrescriptionMutations } from "@/hooks/use-resources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, FileText, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Prescriptions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const [search, setSearch] = useState("");
  const { deleteItem } = usePrescriptionMutations();
  const { toast } = useToast();

  const filtered = prescriptions?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto da prescrição copiado." });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-display font-bold text-slate-900">Prescrições</h1>
            <CreatePrescriptionDialog />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              placeholder="Buscar por título ou medicamento..." 
              className="pl-10 bg-white shadow-sm border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered?.map(p => (
              <Card key={p.id} className="group hover:shadow-lg transition-all cursor-pointer border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">{p.title}</CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => deleteItem.mutate(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 font-mono line-clamp-4 border border-slate-100 mb-3">
                    {p.content}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-purple-600 hover:bg-purple-50 border-purple-100"
                    onClick={() => copyToClipboard(p.content)}
                  >
                    <Copy className="h-3 w-3 mr-2" /> Copiar Texto
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}

function CreatePrescriptionDialog() {
  const [open, setOpen] = useState(false);
  const { create } = usePrescriptionMutations();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ title, content, userId: "temp" }, {
      onSuccess: () => {
        setOpen(false);
        setTitle("");
        setContent("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Nova Prescrição
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Modelo de Prescrição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pneumonia Adquirida na Comunidade" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo</label>
            <Textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="1. Amoxicilina 500mg..." 
              className="h-64 font-mono text-sm"
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Salvar Modelo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
