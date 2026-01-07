import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Search, Plus, Trash2, BookOpen, Lightbulb, Brain, CheckCircle, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import type { Flashcard } from "@shared/schema";

const TYPES = [
  { value: "resumo", label: "Resumo", icon: BookOpen },
  { value: "mnemonico", label: "Mnemônico", icon: Brain },
  { value: "dica", label: "Dica Rápida", icon: Lightbulb },
  { value: "checkpoint", label: "Checkpoint", icon: CheckCircle },
];

const SPECIALTIES = ["Cardiologia", "Pneumologia", "Neurologia", "Gastroenterologia", "Infectologia", "Pediatria", "Emergência", "Clínica Geral", "Farmacologia", "Outros"];

export default function Flashcards() {
  const [searchQuery, setSearchQuery] = useState("");
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: flashcards, isLoading } = useQuery<Flashcard[]>({
    queryKey: ["/api/flashcards"],
    queryFn: async () => {
      const res = await fetch("/api/flashcards", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = flashcards?.filter(f => {
    const matchesSearch = !searchQuery || 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || f.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const startStudyMode = () => {
    setStudyMode(true);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const nextCard = () => {
    if (filtered && currentIndex < filtered.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  if (studyMode && filtered && filtered.length > 0) {
    const currentCard = filtered[currentIndex];
    const TypeIcon = TYPES.find(t => t.value === currentCard.type)?.icon || BookOpen;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => setStudyMode(false)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Sair
            </Button>
            <span className="text-sm text-slate-500">{currentIndex + 1} / {filtered.length}</span>
          </div>

          <Card 
            className="p-8 min-h-[400px] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-xl"
            onClick={() => setShowAnswer(!showAnswer)}
          >
            <div className="mb-4">
              <Badge variant="outline" className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {TYPES.find(t => t.value === currentCard.type)?.label}
              </Badge>
            </div>

            {!showAnswer ? (
              <>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{currentCard.title}</h2>
                <p className="text-lg text-slate-600">{currentCard.front}</p>
                <p className="text-sm text-slate-400 mt-8">Clique para ver a resposta</p>
              </>
            ) : (
              <>
                <p className="text-lg text-slate-800 whitespace-pre-line">{currentCard.back}</p>
                <p className="text-sm text-slate-400 mt-8">Clique para voltar à pergunta</p>
              </>
            )}
          </Card>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={prevCard} disabled={currentIndex === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <Button variant="ghost" onClick={() => { setCurrentIndex(0); setShowAnswer(false); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
            <Button onClick={nextCard} disabled={currentIndex === filtered.length - 1}>
              Próximo <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Memorização</h1>
          <p className="text-slate-500">Resumos, mnemônicos e dicas para revisão rápida.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {filtered && filtered.length > 0 && (
            <Button variant="outline" onClick={startStudyMode} data-testid="button-study-mode">
              <Brain className="mr-2 h-4 w-4" /> Modo Estudo
            </Button>
          )}
          <FlashcardDialog isAdmin={isAdmin} />
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-flashcards"
          />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {TYPES.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1">
                <t.icon className="h-3 w-3" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map((flashcard) => (
            <FlashcardCard key={flashcard.id} flashcard={flashcard} isAdmin={isAdmin} userId={user?.id} />
          ))}

          {(!filtered || filtered.length === 0) && (
            <div className="col-span-full text-center py-12 text-slate-400">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum card encontrado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlashcardCard({ flashcard, isAdmin, userId }: { flashcard: Flashcard; isAdmin: boolean; userId?: string }) {
  const [showBack, setShowBack] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const TypeIcon = TYPES.find(t => t.value === flashcard.type)?.icon || BookOpen;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/flashcards/${flashcard.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({ title: "Removido!" });
    },
  });

  const canDelete = isAdmin || flashcard.userId === userId;

  return (
    <Card 
      className="p-4 cursor-pointer transition-all hover:shadow-md group min-h-[200px] flex flex-col"
      onClick={() => setShowBack(!showBack)}
      data-testid={`card-flashcard-${flashcard.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <Badge variant="outline" className="gap-1">
          <TypeIcon className="h-3 w-3" />
          {TYPES.find(t => t.value === flashcard.type)?.label}
        </Badge>
        {canDelete && (
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(); }} 
            className="h-7 w-7 text-red-400 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      
      <h3 className="font-bold text-slate-900 mb-2">{flashcard.title}</h3>
      
      <div className="flex-1">
        {!showBack ? (
          <p className="text-sm text-slate-600">{flashcard.front}</p>
        ) : (
          <p className="text-sm text-slate-800 bg-green-50 p-3 rounded-lg border border-green-100 whitespace-pre-line">{flashcard.back}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {flashcard.specialty && <Badge variant="secondary" className="text-xs">{flashcard.specialty}</Badge>}
        {flashcard.isPublic && <Badge variant="outline" className="text-xs">Oficial</Badge>}
      </div>
    </Card>
  );
}

function FlashcardDialog({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flashcards"] });
      toast({ title: "Criado!", description: "Card salvo com sucesso." });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      front: formData.get("front") as string,
      back: formData.get("back") as string,
      specialty: formData.get("specialty") as string,
      category: formData.get("category") as string,
      isPublic: isAdmin && formData.get("isPublic") === "on",
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25" data-testid="button-new-flashcard">
          <Plus className="mr-2 h-4 w-4" /> Novo Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Card de Memorização</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input name="title" required placeholder="Ex: Critérios de Framingham" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select name="type" defaultValue="resumo">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidade</label>
              <Select name="specialty" defaultValue="Clínica Geral">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pergunta / Conceito</label>
            <Textarea name="front" required placeholder="Digite a pergunta ou conceito..." rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resposta / Explicação</label>
            <Textarea name="back" required placeholder="Digite a resposta ou explicação..." rows={4} />
          </div>

          {isAdmin && (
            <div className="pt-2 border-t">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isPublic" className="rounded" />
                <span>Card Oficial (público para todos)</span>
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Salvando..." : "Salvar Card"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
