import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Edit2, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FinancialGoal } from "@shared/schema";

interface EditableFinancialGoalProps {
  totalAccumulated: number;
}

export function EditableFinancialGoal({ totalAccumulated }: EditableFinancialGoalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [targetValue, setTargetValue] = useState("");

  const { data: goals = [] } = useQuery<FinancialGoal[]>({
    queryKey: ["/api/goals"],
  });

  const monthlyGoal = goals.find(g => g.title === "Meta Mensal") || goals[0];

  const createGoal = useMutation({
    mutationFn: async (data: { title: string; targetValue: string }) => {
      return apiRequest("/api/goals", { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsEditing(false);
      toast({ title: "Meta criada com sucesso!" });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { targetValue: string } }) => {
      return apiRequest(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsEditing(false);
      toast({ title: "Meta atualizada!" });
    },
  });

  const handleSave = () => {
    if (!targetValue || parseFloat(targetValue) <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }

    if (monthlyGoal) {
      updateGoal.mutate({ id: monthlyGoal.id, data: { targetValue } });
    } else {
      createGoal.mutate({ title: "Meta Mensal", targetValue });
    }
  };

  const handleEdit = () => {
    setTargetValue(monthlyGoal?.targetValue?.toString() || "");
    setIsEditing(true);
  };

  const goalValue = parseFloat(monthlyGoal?.targetValue?.toString() || "0");
  const progress = goalValue > 0 ? Math.min((totalAccumulated / goalValue) * 100, 100) : 0;
  const remaining = Math.max(goalValue - totalAccumulated, 0);

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Meta Financeira Mensal
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="icon" onClick={handleEdit} data-testid="button-edit-goal">
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">R$</span>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Valor da meta"
              className="max-w-[200px]"
              data-testid="input-goal-value"
            />
            <Button size="icon" variant="ghost" onClick={handleSave} data-testid="button-save-goal">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} data-testid="button-cancel-goal">
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
