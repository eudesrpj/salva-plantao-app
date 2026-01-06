import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { 
  FileText, CheckSquare, CalendarDays, Activity, 
  ArrowRight, Stethoscope, DollarSign, StickyNote 
} from "lucide-react";
import { useShiftStats } from "@/hooks/use-shifts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useShiftStats();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold font-display text-slate-900">
          Olá, Dr. {user?.firstName || "Médico"}
        </h1>
        <p className="text-slate-500 mt-2">
          Resumo do seu plantão e atividades recentes.
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium">Ganhos (Mês)</p>
              <h3 className="text-2xl font-bold">
                {stats ? `R$ ${stats.totalEarnings.toLocaleString('pt-BR')}` : "..."}
              </h3>
            </div>
          </div>
          <div className="text-sm text-blue-100 bg-white/10 inline-block px-3 py-1 rounded-full">
            {stats?.totalHours || 0} horas trabalhadas
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <CalendarDays className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Próximo Plantão</p>
              {stats?.upcomingShifts?.[0] ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900">
                    {format(new Date(stats.upcomingShifts[0].date), "dd/MM", { locale: ptBR })}
                  </h3>
                  <p className="text-sm text-slate-600">{stats.upcomingShifts[0].location}</p>
                </>
              ) : (
                <p className="text-sm text-slate-400">Nenhum agendado</p>
              )}
            </div>
          </div>
        </div>

         <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">IA Médica</p>
              <Link href="/ai-chat" className="text-sm text-purple-600 font-semibold hover:underline flex items-center gap-1">
                Iniciar Interconsulta <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcuts Grid */}
      <h2 className="text-xl font-bold font-display text-slate-900">Acesso Rápido</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ShortcutCard href="/prescriptions" icon={FileText} label="Prescrições" color="text-blue-600" bg="bg-blue-50" />
        <ShortcutCard href="/checklists" icon={CheckSquare} label="Condutas" color="text-indigo-600" bg="bg-indigo-50" />
        <ShortcutCard href="/handovers" icon={Stethoscope} label="Passagem SBAR" color="text-rose-600" bg="bg-rose-50" />
        <ShortcutCard href="/notes" icon={StickyNote} label="Anotações" color="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-sm border-slate-100">
          <CardHeader>
            <CardTitle>Próximos Plantões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.upcomingShifts?.slice(0, 3).map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center text-xs font-bold text-slate-700">
                      <span>{format(new Date(shift.date), "dd")}</span>
                      <span className="text-[10px] text-slate-400 font-normal uppercase">{format(new Date(shift.date), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{shift.location}</p>
                      <p className="text-xs text-slate-500">{shift.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-slate-600">{shift.startTime} - {shift.endTime}</p>
                  </div>
                </div>
              ))}
              {(!stats?.upcomingShifts?.length) && (
                 <p className="text-center text-slate-400 py-4">Nenhum plantão futuro.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for Quick Notes or Recent Activity */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Dica do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 italic">
              "Sempre verifique alergias antes de prescrever. Use a calculadora para doses pediátricas."
            </p>
            <div className="mt-6 flex justify-end">
              <Link href="/library">
                <span className="text-sm text-blue-300 hover:text-white cursor-pointer transition-colors">Acessar Biblioteca →</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShortcutCard({ href, icon: Icon, label, color, bg }: any) {
  return (
    <Link href={href}>
      <div className="group cursor-pointer bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all text-center flex flex-col items-center gap-3">
        <div className={`p-4 rounded-full ${bg} group-hover:scale-110 transition-transform`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <span className="font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
      </div>
    </Link>
  );
}
