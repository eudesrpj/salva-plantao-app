import { useState } from "react";
import { useNotes, useCreateNote, useDeleteNote } from "@/hooks/use-notes";
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, StickyNote, ClipboardList, Clock, Bell } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Notes() {
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const createNote = useCreateNote();
  const delNote = useDeleteNote();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const delTask = useDeleteTask();
  
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const handleNoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createNote.mutateAsync({
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      type: "text",
      folder: "Geral"
    });
    setNoteOpen(false);
  };

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dueDate = fd.get("dueDate") as string;
    await createTask.mutateAsync({
      title: fd.get("title") as string,
      description: fd.get("description") as string || undefined,
      dueTime: fd.get("dueTime") as string || undefined,
      dueDate: dueDate ? new Date(dueDate) : null,
      frequency: fd.get("frequency") as string || "once",
      reminder: fd.get("reminder") === "on",
      reminderMinutes: parseInt(fd.get("reminderMinutes") as string) || 15,
    });
    setTaskOpen(false);
  };

  const formatDueDate = (date: Date | string | null | undefined) => {
    if (!date) return null;
    const d = typeof date === "string" ? parseISO(date) : date;
    if (isToday(d)) return "Hoje";
    if (isTomorrow(d)) return "Amanhã";
    return format(d, "dd/MM", { locale: ptBR });
  };

  const isLoading = notesLoading || tasksLoading;
  if (isLoading) return <div className="p-8">Carregando...</div>;

  const pendingTasks = tasks?.filter(t => !t.isCompleted) || [];
  const completedTasks = tasks?.filter(t => t.isCompleted) || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <Tabs defaultValue="tasks" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="tasks" className="gap-2" data-testid="tab-tasks">
              <ClipboardList className="h-4 w-4" />
              Tarefas do Dia
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2" data-testid="tab-notes">
              <StickyNote className="h-4 w-4" />
              Anotações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Tarefas do Dia</h2>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-task">
                  <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Tarefa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTaskSubmit} className="space-y-4 pt-2">
                  <Input name="title" placeholder="Título da tarefa" required data-testid="input-task-title" />
                  <Textarea name="description" placeholder="Descrição (opcional)" data-testid="input-task-description" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data</label>
                      <Input type="date" name="dueDate" data-testid="input-task-date" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Horário</label>
                      <Input type="time" name="dueTime" data-testid="input-task-time" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequência</label>
                    <Select name="frequency" defaultValue="once">
                      <SelectTrigger data-testid="select-task-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Única vez</SelectItem>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="reminder" name="reminder" className="h-4 w-4" data-testid="checkbox-task-reminder" />
                      <label htmlFor="reminder" className="text-sm flex items-center gap-1">
                        <Bell className="h-4 w-4" /> Lembrete
                      </label>
                    </div>
                    <Input type="number" name="reminderMinutes" defaultValue="15" className="w-20" placeholder="min" data-testid="input-reminder-minutes" />
                    <span className="text-sm text-muted-foreground">min antes</span>
                  </div>

                  <Button type="submit" className="w-full" disabled={createTask.isPending} data-testid="button-save-task">
                    {createTask.isPending ? "Salvando..." : "Salvar Tarefa"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {pendingTasks.map(task => (
              <Card key={task.id} className="p-4" data-testid={`card-task-${task.id}`}>
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={task.isCompleted}
                    onCheckedChange={() => toggleTask.mutate(task.id)}
                    data-testid={`checkbox-task-complete-${task.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" data-testid={`text-task-title-${task.id}`}>{task.title}</span>
                      {task.frequency && task.frequency !== "once" && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {task.frequency === "daily" ? "Diária" : task.frequency === "weekly" ? "Semanal" : "Mensal"}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDueDate(task.dueDate)}
                          {task.dueTime && ` às ${task.dueTime}`}
                        </span>
                      )}
                      {task.reminder && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          {task.reminderMinutes}min antes
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => delTask.mutate(task.id)}
                    data-testid={`button-delete-task-${task.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            
            {pendingTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma tarefa pendente.</p>
              </div>
            )}
          </div>

          {completedTasks.length > 0 && (
            <div className="space-y-2 mt-6">
              <h3 className="text-lg font-medium text-muted-foreground">Concluídas</h3>
              {completedTasks.map(task => (
                <Card key={task.id} className="p-4 opacity-60" data-testid={`card-task-completed-${task.id}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={task.isCompleted}
                      onCheckedChange={() => toggleTask.mutate(task.id)}
                      data-testid={`checkbox-task-uncomplete-${task.id}`}
                    />
                    <span className="flex-1 line-through text-muted-foreground">{task.title}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => delTask.mutate(task.id)}
                      data-testid={`button-delete-completed-task-${task.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">Anotações</h2>
            <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-note">
                  <Plus className="mr-2 h-4 w-4" /> Nova Nota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Nota</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNoteSubmit} className="space-y-4 pt-2">
                  <Input name="title" placeholder="Título" required data-testid="input-note-title" />
                  <Textarea name="content" placeholder="Escreva aqui..." className="min-h-[200px]" required data-testid="input-note-content" />
                  <Button type="submit" className="w-full" disabled={createNote.isPending} data-testid="button-save-note">
                    {createNote.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {notes?.map(note => (
              <Card key={note.id} className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800/30 shadow-sm group" data-testid={`card-note-${note.id}`}>
                <CardHeader className="pb-2 flex flex-row justify-between gap-2 items-start">
                  <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-200" data-testid={`text-note-title-${note.id}`}>{note.title}</CardTitle>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 invisible group-hover:visible text-amber-900/40 dark:text-amber-200/40" 
                    onClick={() => delNote.mutate(note.id)}
                    data-testid={`button-delete-note-${note.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap line-clamp-6 font-medium">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            ))}
            {!notes?.length && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma anotação pessoal.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
