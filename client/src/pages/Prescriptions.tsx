import { useState } from "react";
import { usePrescriptions, useCreatePrescription, useDeletePrescription, useUpdatePrescription } from "@/hooks/use-prescriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Trash2, Edit, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Prescriptions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filtered = prescriptions?.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Prescrições</h1>
          <p className="text-slate-500">Modelos rápidos para uso no plantão.</p>
        </div>
        <PrescriptionDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Buscar prescrição..." 
          className="pl-10 h-12 text-lg bg-white shadow-sm border-slate-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered?.map((item) => (
          <Card key={item.id} className="group hover:shadow-lg transition-all border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">{item.title}</CardTitle>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500" onClick={() => copyToClipboard(item.content)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <PrescriptionDialog prescription={item} />
                <DeleteButton id={item.id} />
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-slate-600 font-sans whitespace-pre-wrap line-clamp-6 bg-slate-50 p-3 rounded-md border border-slate-100">
                {item.content}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PrescriptionDialog({ prescription }: { prescription?: any }) {
  const [open, setOpen] = useState(false);
  const create = useCreatePrescription();
  const update = useUpdatePrescription();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: "Geral",
      isPublic: false
    };

    try {
      if (prescription) {
        await update.mutateAsync({ id: prescription.id, ...data });
        toast({ title: "Atualizado", description: "Prescrição atualizada com sucesso." });
      } else {
        await create.mutateAsync(data);
        toast({ title: "Criado", description: "Prescrição criada com sucesso." });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {prescription ? (
           <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="shadow-lg shadow-blue-500/25">
            <Plus className="mr-2 h-4 w-4" /> Nova Prescrição
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{prescription ? "Editar" : "Nova"} Prescrição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input name="title" defaultValue={prescription?.title} required placeholder="Ex: Dipirona EV" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Conteúdo</label>
            <Textarea 
              name="content" 
              defaultValue={prescription?.content} 
              required 
              placeholder="Digite o conteúdo da prescrição..." 
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ id }: { id: number }) {
  const del = useDeletePrescription();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir?")) {
      await del.mutateAsync(id);
      toast({ title: "Excluído", description: "Item removido." });
    }
  };

  return (
    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
