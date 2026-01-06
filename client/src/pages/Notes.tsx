import { useState } from "react";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, StickyNote } from "lucide-react";

export default function Notes() {
  const { data: notes, isLoading } = useNotes();
  const create = useCreateNote();
  const del = useDeleteNote();
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await create.mutateAsync({
       title: fd.get("title") as string,
       content: fd.get("content") as string,
       type: "text",
       folder: "Geral"
    });
    setOpen(false);
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold font-display text-slate-900">Anotações</h1>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20">
               <Plus className="mr-2 h-4 w-4" /> Nova Nota
             </Button>
           </DialogTrigger>
           <DialogContent>
             <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <Input name="title" placeholder="Título" required />
                <Textarea name="content" placeholder="Escreva aqui..." className="min-h-[200px]" required />
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600">Salvar</Button>
             </form>
           </DialogContent>
         </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
         {notes?.map(note => (
            <Card key={note.id} className="bg-yellow-50 border-yellow-100 shadow-sm hover:shadow-md transition-all group">
               <CardHeader className="pb-2 flex flex-row justify-between items-start">
                  <CardTitle className="text-lg font-bold text-amber-900">{note.title}</CardTitle>
                  <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-amber-900/40 hover:text-red-500" onClick={() => del.mutate(note.id)}>
                     <Trash2 className="h-4 w-4" />
                  </Button>
               </CardHeader>
               <CardContent>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap line-clamp-6 font-medium font-handwriting">
                     {note.content}
                  </p>
               </CardContent>
            </Card>
         ))}
         {!notes?.length && (
            <div className="col-span-full text-center py-12 text-slate-400">
               <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-20" />
               <p>Nenhuma anotação pessoal.</p>
            </div>
         )}
      </div>
    </div>
  );
}
