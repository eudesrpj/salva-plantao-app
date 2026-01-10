
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useShiftStats } from "@/hooks/use-shifts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Target, TrendingUp, TrendingDown, DollarSign, Edit2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MonthlyExpense, FinancialGoal as FinancialGoalType } from "@shared/schema";
import { EditableFinancialGoal } from "@/components/EditableFinancialGoal"; 
import { ElectrolyteCalculator } from "@/components/ElectrolyteCalculator"; 

const EXPENSE_CATEGORIES = [
  "Moradia", "Alimentação", "Transporte", "Saúde", "Educação", 
  "Lazer", "Vestuário", "Outros"
];

export default function Finance() {
  const { data: stats } = useShiftStats();
  const { toast } = useToast();
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpense | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoalType | null>(null);

  const { data: expenses = [] } = useQuery<MonthlyExpense[]>({
    queryKey: ['/api/monthly-expenses'],
  });

  const { data: goals = [] } = useQuery<FinancialGoalType[]>({
    queryKey: ['/api/financial-goals'],
  });

  const createExpense = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/monthly-expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-expenses'] });
      setExpenseDialogOpen(false);
      toast({ title: "Gasto adicionado com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar gasto", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/monthly-expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-expenses'] });
      setExpenseDialogOpen(false);
      setEditingExpense(null);
      toast({ title: "Gasto atualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar gasto", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const deleteExpense = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/monthly-expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/monthly-expenses'] });
      toast({ title: "Gasto removido" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover gasto", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const createGoal = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/financial-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-goals'] });
      setGoalDialogOpen(false);
      toast({ title: "Meta adicionada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao adicionar meta", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const updateGoal = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/financial-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-goals'] });
      setGoalDialogOpen(false);
      setEditingGoal(null);
      toast({ title: "Meta atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar meta", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const deleteGoal = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/financial-goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/financial-goals'] });
      toast({ title: "Meta removida" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover meta", description: error?.message || "Tente novamente", variant: "destructive" });
    }
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.value || "0"), 0);
  const totalEarnings = stats?.totalEarnings || 0;
  const balance = totalEarnings - totalExpenses;

  const chartData = [
    { name: 'Ganhos', value: totalEarnings, fill: '#22c55e' },
    { name: 'Gastos', value: totalExpenses, fill: '#ef4444' },
  ];

  const monthlyData = [
    { name: 'Jan', ganhos: 4500, gastos: 3200 },
    { name: 'Fev', ganhos: 6200, gastos: 4100 },
    { name: 'Mar', ganhos: 5800, gastos: 3800 },
    { name: 'Atual', ganhos: totalEarnings, gastos: totalExpenses },
  ];

  const handleExpenseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      name: formData.get('name') as string,
      value: formData.get('value') as string,
      category: formData.get('category') as string,
      isRecurring: formData.get('isRecurring') === 'on',
    };
    
    if (editingExpense) {
      updateExpense.mutate({ id: editingExpense.id, data });
    } else {
      createExpense.mutate(data);
    }
  };

  const handleGoalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      title: formData.get('title') as string,
      targetValue: formData.get('targetValue') as string,
      currentValue: formData.get('currentValue') as string || "0",
      deadline: formData.get('deadline') ? new Date(formData.get('deadline') as string) : null,
    };
    
    if (editingGoal) {
      updateGoal.mutate({ id: editingGoal.id, data });
    } else {
      createGoal.mutate(data);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold font-display text-foreground" data-testid="text-finance-title">Financeiro</h1>
      
      {/* Seção da Meta Financeira Mensal */}
      <EditableFinancialGoal totalAccumulated={totalEarnings} />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-none">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-emerald-100 text-sm font-medium">Ganhos Totais</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-earnings">R$ {totalEarnings.toLocaleString('pt-BR')}</div>
            <p className="text-sm text-emerald-100 mt-1">Neste mês</p>
          </CardContent>
        </Card>

        <Card className="bg-red-600 text-white shadow-xl shadow-red-500/20 border-none">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-red-100 text-sm font-medium">Gastos Totais</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-expenses">R$ {totalExpenses.toLocaleString('pt-BR')}</div>
            <p className="text-sm text-red-100 mt-1">Neste mês</p>
          </CardContent>
        </Card>

        <Card className={`${balance >= 0 ? 'bg-blue-600' : 'bg-orange-600'} text-white shadow-xl border-none`}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className={`${balance >= 0 ? 'text-blue-100' : 'text-orange-100'} text-sm font-medium`}>Saldo</CardTitle>
            <DollarSign className={`h-5 w-5 ${balance >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-balance">R$ {balance.toLocaleString('pt-BR')}</div>
            <p className={`text-sm ${balance >= 0 ? 'text-blue-100' : 'text-orange-100'} mt-1`}>
              {balance >= 0 ? 'Positivo' : 'Negativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção da Calculadora de Eletrólitos */}
      <ElectrolyteCalculator />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Legend />
                <Bar dataKey="ganhos" name="Ganhos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumo do Mês</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Gastos Mensais</CardTitle>
            <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
              setExpenseDialogOpen(open);
              if (!open) setEditingExpense(null);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-expense">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Novo Gasto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Gasto</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Ex: Aluguel, Internet..." 
                      defaultValue={editingExpense?.name || ''}
                      required 
                      data-testid="input-expense-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input 
                      id="value" 
                      name="value" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      defaultValue={editingExpense?.value || ''}
                      required 
                      data-testid="input-expense-value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <select 
                      id="category" 
                      name="category" 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      defaultValue={editingExpense?.category || ''}
                      data-testid="select-expense-category"
                    >
                      <option value="">Selecione...</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isRecurring" 
                      name="isRecurring" 
                      defaultChecked={editingExpense?.isRecurring ?? true}
                      className="h-4 w-4"
                      data-testid="checkbox-expense-recurring"
                    />
                    <Label htmlFor="isRecurring">Gasto recorrente (mensal)</Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createExpense.isPending || updateExpense.isPending}
                    data-testid="button-save-expense"
                  >
                    {editingExpense ? 'Atualizar' : 'Salvar'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum gasto cadastrado</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {expenses.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`expense-item-${expense.id}`}
                  >
                    <div>
                      <p className="font-medium">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">{expense.category || 'Sem categoria'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600">
                        R$ {parseFloat(expense.value || "0").toLocaleString('pt-BR')}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => {
                          setEditingExpense(expense);
                          setExpenseDialogOpen(true);
                        }}
                        data-testid={`button-edit-expense-${expense.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => deleteExpense.mutate(expense.id)}
                        data-testid={`button-delete-expense-${expense.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" /> Metas Financeiras
            </CardTitle>
            <Dialog open={goalDialogOpen} onOpenChange={(open) => {
              setGoalDialogOpen(open);
              if (!open) setEditingGoal(null);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-goal">
                  <Plus className="h-4 w-4 mr-1" /> Nova Meta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Nome da Meta</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      placeholder="Ex: Reserva de emergência..." 
                      defaultValue={editingGoal?.title || ''}
                      required 
                      data-testid="input-goal-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetValue">Valor da Meta (R$)</Label>
                    <Input 
                      id="targetValue" 
                      name="targetValue" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      defaultValue={editingGoal?.targetValue || ''}
                      required 
                      data-testid="input-goal-target"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentValue">Valor Atual (R$)</Label>
                    <Input 
                      id="currentValue" 
                      name="currentValue" 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      defaultValue={editingGoal?.currentValue || '0'}
                      data-testid="input-goal-current"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Prazo (opcional)</Label>
                    <Input 
                      id="deadline" 
                      name="deadline" 
                      type="date" 
                      defaultValue={editingGoal?.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ''}
                      data-testid="input-goal-deadline"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createGoal.isPending || updateGoal.isPending}
                    data-testid="button-save-goal"
                  >
                    {editingGoal ? 'Atualizar' : 'Criar Meta'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma meta cadastrada</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {goals.map((goal) => {
                  const current = parseFloat(goal.currentValue || "0");
                  const target = parseFloat(goal.targetValue || "1");
                  const progress = Math.min((current / target) * 100, 100);
                  
                  return (
                    <div 
                      key={goal.id} 
                      className="p-4 bg-muted/50 rounded-lg space-y-2"
                      data-testid={`goal-item-${goal.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{goal.title}</p>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => {
                              setEditingGoal(goal);
                              setGoalDialogOpen(true);
                            }}
                            data-testid={`button-edit-goal-${goal.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => deleteGoal.mutate(goal.id)}
                            data-testid={`button-delete-goal-${goal.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          R$ {current.toLocaleString('pt-BR')} / R$ {target.toLocaleString('pt-BR')}
                        </span>
                        <span className={progress >= 100 ? 'text-green-600 font-bold' : 'text-muted-foreground'}>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
