
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { FC } from 'react';

interface FinancialGoalProps {
  monthlyGoal: number;
  totalAccumulated: number;
}

export const FinancialGoal: FC<FinancialGoalProps> = ({ monthlyGoal, totalAccumulated }) => {
  const progress = monthlyGoal > 0 ? (totalAccumulated / monthlyGoal) * 100 : 0;
  const remaining = Math.max(0, monthlyGoal - totalAccumulated);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target />
          Meta Financeira Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-4" />
          <div className="flex justify-between text-sm font-medium">
            <span>R$ {totalAccumulated.toLocaleString('pt-BR')}</span>
            <span className="text-muted-foreground">R$ {monthlyGoal.toLocaleString('pt-BR')}</span>
          </div>
          <p className="text-center text-sm text-muted-foreground pt-2">
            {progress >= 100
              ? "Parabéns! Você atingiu sua meta este mês."
              : `Faltam R$ ${remaining.toLocaleString('pt-BR')} para atingir sua meta.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
