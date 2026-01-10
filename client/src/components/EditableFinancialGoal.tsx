import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Target, Edit2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialGoal } from "@shared/schema";

interface EditableFinancialGoalProps {
  totalAccumulated: number;
}

export function EditableFinancialGoal({ totalAccumulated }: EditableFinancialGoalProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [targetValue, setTargetValue] = useState("");
  const [inputError, setInputError] = useState("");

  const { data: goalsData } = useQuery<FinancialGoal[]>({
    queryKey: ["/api/goals"],
  });

  const goals = goalsData ?? [];
  const monthlyGoal = goals.find(g => g.title === "Meta Mensal") || goals[0];

  const createGoal = useMutation({
    mutationFn: async (data: { title: string; targetValue: string }) => {
      return apiRequest("POST", "/api/goals", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsEditDialogOpen(false);
      toast({ title: "Meta criada com sucesso!" });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { targetValue: string } }) => {
      return apiRequest("PATCH", `/api/goals/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsEditDialogOpen(false);
      toast({ title: "Meta atualizada!" });
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({ title: "Meta removida!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover meta", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const value = parseFloat(targetValue);
    if (!targetValue || isNaN(value) || value <= 0) {
      setInputError("Informe um valor maior que zero");
      return;
    }
    setInputError("");

    if (monthlyGoal) {
      updateGoal.mutate({ id: monthlyGoal.id, data: { targetValue } });
    } else {
      createGoal.mutate({ title: "Meta Mensal", targetValue });
    }
  };

  const handleOpenEdit = () => {
    setTargetValue(monthlyGoal?.targetValue?.toString() || "");
    setInputError("");
    setIsEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (monthlyGoal) {
      deleteGoal.mutate(monthlyGoal.id);
    }
  };

  const goalValue = parseFloat(monthlyGoal?.targetValue?.toString() || "0");
  const progress = goalValue > 0 ? Math.min((totalAccumulated / goalValue) * 100, 100) : 0;
  const remaining = Math.max(goalValue - totalAccumulated, 0);

  return (
    <>
      <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Meta Financeira Mensal
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleOpenEdit} data-testid="button-edit-goal">
              <Edit2 className="h-4 w-4" />
            </Button>
            {monthlyGoal && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" data-testid="button-delete-goal">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir sua meta financeira mensal? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {goalValue > 0 ? (
            <>
              <div className="flex justify-between text-sm">
                <span>Acumulado: <strong className="text-green-600">R$ {totalAccumulated.toLocaleString('pt-BR')}</strong></span>
                <span>Meta: <strong>R$ {goalValue.toLocaleString('pt-BR')}</strong></span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progress.toFixed(1)}% atingido</span>
                <span>Faltam R$ {remaining.toLocaleString('pt-BR')}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Defina uma meta mensal clicando no ícone de edição acima.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{monthlyGoal ? "Editar Meta" : "Definir Meta"}</DialogTitle>
            <DialogDescription>
              Informe o valor da sua meta financeira mensal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da meta mensal (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={targetValue}
                onChange={(e) => {
                  setTargetValue(e.target.value);
                  setInputError("");
                }}
                placeholder="Ex: 5000"
                data-testid="input-goal-value"
              />
              {inputError && (
                <p className="text-sm text-destructive">{inputError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createGoal.isPending || updateGoal.isPending} data-testid="button-save-goal">
              {(createGoal.isPending || updateGoal.isPending) ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
