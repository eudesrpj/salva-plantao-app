import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, Play, RotateCcw, Lightbulb, ChevronLeft, ChevronRight, Check, X, Eye, EyeOff, BookOpen, Layers, Clock, Trash2, Edit2, Upload } from "lucide-react";
import type { MemorizeDeck, MemorizeCard } from "@shared/schema";

export default function Memorize() {
  const { toast } = useToast();
  const [selectedDeck, setSelectedDeck] = useState<MemorizeDeck | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [createDeckOpen, setCreateDeckOpen] = useState(false);
  const [createCardOpen, setCreateCardOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editDeckOpen, setEditDeckOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState<MemorizeCard | null>(null);

  const [newDeck, setNewDeck] = useState({ name: "", description: "" });
  const [newCard, setNewCard] = useState({ front: "", back: "", hint: "" });
  const [bulkData, setBulkData] = useState("");

  const { data: decks = [], isLoading: loadingDecks } = useQuery<MemorizeDeck[]>({
    queryKey: ["/api/memorize/decks"],
  });

  const { data: cards = [], isLoading: loadingCards } = useQuery<MemorizeCard[]>({
    queryKey: ["/api/memorize/decks", selectedDeck?.id, "cards"],
    enabled: !!selectedDeck,
  });

  const { data: studyCards = [], refetch: refetchStudy } = useQuery<MemorizeCard[]>({
    queryKey: ["/api/memorize/decks", selectedDeck?.id, "study"],
    enabled: !!selectedDeck && studyMode,
  });

  const createDeckMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest("POST", "/api/memorize/decks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks"] });
      setCreateDeckOpen(false);
      setNewDeck({ name: "", description: "" });
      toast({ title: "Deck criado com sucesso!" });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description?: string }) =>
      apiRequest("PUT", `/api/memorize/decks/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks"] });
      setEditDeckOpen(false);
      toast({ title: "Deck atualizado!" });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/memorize/decks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks"] });
      setSelectedDeck(null);
      toast({ title: "Deck excluído!" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: { front: string; back: string; hint?: string }) =>
      apiRequest("POST", `/api/memorize/decks/${selectedDeck?.id}/cards`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks", selectedDeck?.id, "cards"] });
      setCreateCardOpen(false);
      setNewCard({ front: "", back: "", hint: "" });
      toast({ title: "Card criado!" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: (data: { id: number; front: string; back: string; hint?: string }) =>
      apiRequest("PUT", `/api/memorize/cards/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks", selectedDeck?.id, "cards"] });
      setEditCardOpen(null);
      toast({ title: "Card atualizado!" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/memorize/cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks", selectedDeck?.id, "cards"] });
      toast({ title: "Card excluído!" });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiRequest("POST", `/api/memorize/decks/${selectedDeck?.id}/cards/bulk`, { data });
      return res.json();
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/memorize/decks", selectedDeck?.id, "cards"] });
      setBulkImportOpen(false);
      setBulkData("");
      toast({ title: `${result.imported} cards importados!` });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao importar", description: error.message, variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: number }) =>
      apiRequest("POST", `/api/memorize/cards/${cardId}/review`, { quality }),
    onSuccess: () => {
      refetchStudy();
    },
  });

  const handleReview = (quality: number) => {
    const currentCard = studyCards[currentCardIndex];
    if (!currentCard) return;

    reviewMutation.mutate({ cardId: currentCard.id, quality });
    setShowAnswer(false);

    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      toast({ title: "Sessão concluída!", description: "Você revisou todos os cards disponíveis." });
      setStudyMode(false);
      setCurrentCardIndex(0);
    }
  };

  const startStudy = () => {
    setStudyMode(true);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    refetchStudy();
  };

  if (loadingDecks) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (studyMode && selectedDeck) {
    const currentCard = studyCards[currentCardIndex];
    const progress = studyCards.length > 0 ? ((currentCardIndex + 1) / studyCards.length) * 100 : 0;

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setStudyMode(false)} data-testid="button-exit-study">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold" data-testid="text-study-title">{selectedDeck.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentCardIndex + 1} / {studyCards.length}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {studyCards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum card para revisar!</h3>
              <p className="text-muted-foreground">Volte mais tarde ou adicione novos cards.</p>
              <Button onClick={() => setStudyMode(false)} className="mt-4" data-testid="button-back-decks">
                Voltar aos Decks
              </Button>
            </CardContent>
          </Card>
        ) : currentCard ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="min-h-[300px] relative">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="text-center w-full">
                    <p className="text-sm text-muted-foreground mb-4">Frente</p>
                    <p className="text-xl font-medium mb-6" data-testid="text-card-front">{currentCard.front}</p>

                    {!showAnswer && currentCard.hint && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                        <Lightbulb className="h-4 w-4" />
                        <span>Dica: {currentCard.hint}</span>
                      </div>
                    )}

                    {showAnswer ? (
                      <>
                        <div className="border-t pt-6 mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Verso</p>
                          <p className="text-xl font-medium" data-testid="text-card-back">{currentCard.back}</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 mt-8">
                          <Button 
                            variant="outline" 
                            className="text-red-600 border-red-200"
                            onClick={() => handleReview(1)}
                            data-testid="button-review-again"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            De novo
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-orange-600 border-orange-200"
                            onClick={() => handleReview(3)}
                            data-testid="button-review-hard"
                          >
                            Difícil
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-green-600 border-green-200"
                            onClick={() => handleReview(4)}
                            data-testid="button-review-good"
                          >
                            Bom
                          </Button>
                          <Button 
                            variant="outline" 
                            className="text-blue-600 border-blue-200"
                            onClick={() => handleReview(5)}
                            data-testid="button-review-easy"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Fácil
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => setShowAnswer(true)} className="mt-4" data-testid="button-show-answer">
                        <Eye className="h-4 w-4 mr-2" />
                        Mostrar Resposta
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    );
  }

  if (selectedDeck) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDeck(null)} data-testid="button-back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold truncate" data-testid="text-deck-title">{selectedDeck.name}</h2>
            {selectedDeck.description && (
              <p className="text-sm text-muted-foreground truncate">{selectedDeck.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={startStudy} data-testid="button-start-study">
              <Play className="h-4 w-4 mr-2" />
              Estudar
            </Button>
            {!selectedDeck.isLocked && (
              <>
                <Button variant="outline" size="icon" onClick={() => setEditDeckOpen(true)} data-testid="button-edit-deck">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    if (confirm("Excluir este deck e todos os cards?")) {
                      deleteDeckMutation.mutate(selectedDeck.id);
                    }
                  }}
                  data-testid="button-delete-deck"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={createCardOpen} onOpenChange={setCreateCardOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-card">
                <Plus className="h-4 w-4 mr-2" />
                Novo Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Frente (pergunta)</Label>
                  <Textarea
                    value={newCard.front}
                    onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                    placeholder="Ex: O que é a Síndrome de Cushing?"
                    data-testid="input-card-front"
                  />
                </div>
                <div>
                  <Label>Verso (resposta)</Label>
                  <Textarea
                    value={newCard.back}
                    onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                    placeholder="Ex: Condição causada por excesso de cortisol..."
                    data-testid="input-card-back"
                  />
                </div>
                <div>
                  <Label>Dica (opcional)</Label>
                  <Input
                    value={newCard.hint}
                    onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                    placeholder="Ex: Pense em hipercortisolismo"
                    data-testid="input-card-hint"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createCardMutation.mutate(newCard)}
                  disabled={!newCard.front || !newCard.back || createCardMutation.isPending}
                  data-testid="button-save-card"
                >
                  Salvar Card
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-bulk-import">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Cards em Massa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Formato: frente;verso;dica (uma linha por card). Dica é opcional.
                </p>
                <Textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder="O que é hipertensão?;Pressão arterial elevada;Pense em PA&#10;Qual a causa mais comum de ICC?;DAC;Doença arterial coronariana"
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="input-bulk-data"
                />
                <Button
                  className="w-full"
                  onClick={() => bulkImportMutation.mutate(bulkData)}
                  disabled={!bulkData || bulkImportMutation.isPending}
                  data-testid="button-import-cards"
                >
                  Importar Cards
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Badge variant="secondary">
            <Layers className="h-3 w-3 mr-1" />
            {cards.length} cards
          </Badge>
        </div>

        {loadingCards ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum card ainda</h3>
              <p className="text-muted-foreground">Adicione cards para começar a estudar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <Card key={card.id} className="hover-elevate" data-testid={`card-item-${card.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" data-testid={`text-card-front-${card.id}`}>{card.front}</p>
                      <p className="text-sm text-muted-foreground truncate">{card.back}</p>
                      {card.hint && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Lightbulb className="h-3 w-3" />
                          {card.hint}
                        </p>
                      )}
                    </div>
                    {!selectedDeck.isLocked && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditCardOpen(card)}
                          data-testid={`button-edit-card-${card.id}`}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Excluir este card?")) {
                              deleteCardMutation.mutate(card.id);
                            }
                          }}
                          data-testid={`button-delete-card-${card.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editCardOpen} onOpenChange={() => setEditCardOpen(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Card</DialogTitle>
            </DialogHeader>
            {editCardOpen && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Frente</Label>
                  <Textarea
                    value={editCardOpen.front}
                    onChange={(e) => setEditCardOpen({ ...editCardOpen, front: e.target.value })}
                    data-testid="input-edit-card-front"
                  />
                </div>
                <div>
                  <Label>Verso</Label>
                  <Textarea
                    value={editCardOpen.back}
                    onChange={(e) => setEditCardOpen({ ...editCardOpen, back: e.target.value })}
                    data-testid="input-edit-card-back"
                  />
                </div>
                <div>
                  <Label>Dica</Label>
                  <Input
                    value={editCardOpen.hint || ""}
                    onChange={(e) => setEditCardOpen({ ...editCardOpen, hint: e.target.value })}
                    data-testid="input-edit-card-hint"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => updateCardMutation.mutate({
                    id: editCardOpen.id,
                    front: editCardOpen.front,
                    back: editCardOpen.back,
                    hint: editCardOpen.hint || undefined,
                  })}
                  disabled={updateCardMutation.isPending}
                  data-testid="button-update-card"
                >
                  Salvar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editDeckOpen} onOpenChange={setEditDeckOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Deck</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={selectedDeck.name}
                  onChange={(e) => setSelectedDeck({ ...selectedDeck, name: e.target.value })}
                  data-testid="input-edit-deck-title"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={selectedDeck.description || ""}
                  onChange={(e) => setSelectedDeck({ ...selectedDeck, description: e.target.value })}
                  data-testid="input-edit-deck-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => updateDeckMutation.mutate({
                  id: selectedDeck.id,
                  name: selectedDeck.name,
                  description: selectedDeck.description || undefined,
                })}
                disabled={updateDeckMutation.isPending}
                data-testid="button-update-deck"
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Brain className="h-6 w-6" />
            Memorização
          </h1>
          <p className="text-muted-foreground">Estude com flashcards e repetição espaçada</p>
        </div>
        <Dialog open={createDeckOpen} onOpenChange={setCreateDeckOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-deck">
              <Plus className="h-4 w-4 mr-2" />
              Novo Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Deck</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newDeck.name}
                  onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                  placeholder="Ex: Cardiologia"
                  data-testid="input-deck-title"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newDeck.description}
                  onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
                  placeholder="Ex: Flashcards sobre doenças cardiovasculares"
                  data-testid="input-deck-description"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createDeckMutation.mutate(newDeck)}
                disabled={!newDeck.name || createDeckMutation.isPending}
                data-testid="button-create-deck"
              >
                Criar Deck
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum deck ainda</h3>
            <p className="text-muted-foreground">Crie seu primeiro deck para começar a estudar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedDeck(deck)}
              data-testid={`deck-card-${deck.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg truncate" data-testid={`text-deck-name-${deck.id}`}>
                    {deck.name}
                  </CardTitle>
                  {deck.isLocked && (
                    <Badge variant="secondary" className="shrink-0">Oficial</Badge>
                  )}
                </div>
                {deck.description && (
                  <CardDescription className="line-clamp-2">{deck.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {deck.cardCount || 0} cards
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
