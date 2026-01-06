import { Sidebar, MobileNav } from "@/components/Sidebar";
import { FloatingCalculator } from "@/components/FloatingCalculator";
import { useAuth } from "@/hooks/use-auth";
import { useShifts, usePrescriptions } from "@/hooks/use-resources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, Calendar, Plus, ExternalLink, 
  Stethoscope, Pill, TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: shifts } = useShifts();
  const { data: prescriptions } = usePrescriptions();

  const nextShift = shifts?.find(s => new Date(s.date) > new Date());

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 md:pl-64">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">
                Olá, {user?.firstName || "Doutor"}! 👋
              </h1>
              <p className="text-slate-500">Aqui está o resumo do seu dia.</p>
            </div>
            <Link href="/shifts">
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" />
                Novo Plantão
              </Button>
            </Link>
          </header>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-xl shadow-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Próximo</span>
                </div>
                <h3 className="text-lg font-semibold opacity-90">Próximo Plantão</h3>
                {nextShift ? (
                  <div className="mt-2">
                    <p className="text-2xl font-bold">{format(new Date(nextShift.date), "dd 'de' MMM", { locale: ptBR })}</p>
                    <p className="text-sm opacity-80 mt-1">{nextShift.location} • {nextShift.startTime || "07:00"}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-lg opacity-80">Nenhum agendado</p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-emerald-600" />
                  </div>
                  <Link href="/ai-chat">
                    <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </Link>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Interconsulta IA</h3>
                <p className="text-sm text-slate-500 mt-1">Tire dúvidas clínicas em tempo real com nossa inteligência artificial.</p>
                <Link href="/ai-chat">
                  <Button variant="ghost" className="mt-4 w-full justify-between text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                    Iniciar Chat <TrendingUp className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all cursor-pointer border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Pill className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    {prescriptions?.length || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Prescrições</h3>
                <p className="text-sm text-slate-500 mt-1">Acesse seus modelos de prescrição e receitas salvas.</p>
                <Link href="/prescriptions">
                  <Button variant="ghost" className="mt-4 w-full justify-between text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                    Ver Todas <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Agenda Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Agenda Recente</h2>
                <Link href="/shifts" className="text-sm text-primary font-medium hover:underline">Ver tudo</Link>
              </div>
              <div className="space-y-3">
                {shifts?.slice(0, 3).map((shift) => (
                  <div key={shift.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-blue-600">
                        <span className="text-xs font-bold uppercase">{format(new Date(shift.date), "MMM", { locale: ptBR })}</span>
                        <span className="text-lg font-bold leading-none">{format(new Date(shift.date), "dd")}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{shift.location}</h4>
                        <p className="text-sm text-slate-500">{shift.type || "Plantão"} • {shift.startTime} - {shift.endTime}</p>
                      </div>
                    </div>
                    {shift.isPaid ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Pago</span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Pendente</span>
                    )}
                  </div>
                ))}
                {(!shifts || shifts.length === 0) && (
                  <div className="text-center p-8 border-2 border-dashed rounded-xl text-slate-400">
                    Nenhum plantão agendado.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Acesso Rápido</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={FileText} label="Nova Prescrição" href="/prescriptions" color="text-purple-600 bg-purple-50" />
                <QuickAction icon={Calendar} label="Adicionar Plantão" href="/shifts" color="text-blue-600 bg-blue-50" />
                <QuickAction icon={Bot} label="Consultar IA" href="/ai-chat" color="text-emerald-600 bg-emerald-50" />
                <QuickAction icon={Library} label="Protocolos" href="/library" color="text-amber-600 bg-amber-50" />
              </div>
            </section>
          </div>

        </div>
      </main>
      <FloatingCalculator />
      <MobileNav />
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, color }: any) {
  return (
    <Link href={href}>
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-3 h-32 group">
        <div className={cn("p-3 rounded-full transition-transform group-hover:scale-110", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="font-medium text-slate-700 text-sm">{label}</span>
      </div>
    </Link>
  );
}

import { ChevronRight } from "lucide-react";
