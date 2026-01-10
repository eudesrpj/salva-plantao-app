
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Activity, Calendar, FileText, CheckSquare, TrendingUp, ArrowRight, LucideIcon } from "lucide-react";
import { useShifts, useShiftStats } from "@/hooks/use-shifts";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { FC } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, sub, icon: Icon, color, bg }) => (
  <Card className="p-5 rounded-2xl border-slate-100 shadow-md hover:shadow-lg transition-all">
    <div className="flex justify-between items-start mb-3">
      <div className={`h-10 w-10 rounded-xl ${bg} ${color} flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      <span className="text-xs text-slate-400 font-medium">{sub}</span>
    </div>
  </Card>
);

interface ShortcutCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  color: string;
  onClick?: () => void;
}

const ShortcutCard: FC<ShortcutCardProps> = ({ title, icon: Icon, href, color, onClick }) => {
  const content = (
    <div className={`group cursor-pointer rounded-2xl p-4 ${color} text-white shadow-lg ${color.replace('bg-','shadow-')}-500/20 hover:scale-105 transition-all duration-300 relative overflow-hidden h-32 flex flex-col justify-between`}>
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16 transform rotate-12" />
      </div>
      <Icon className="w-8 h-8" />
      <span className="font-bold relative z-10">{title}</span>
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link href={href}>{content}</Link>;
};


export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats } = useShiftStats();
  const { data: shifts } = useShifts();

  const nextShift = shifts?.find(s => new Date(s.date) >= new Date());

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-display text-slate-900">
            Olá, <span className="text-primary">Dr. {user?.lastName || user?.firstName}</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Pronto para salvar o plantão de hoje?</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Sistema Operacional</span>
        </div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Quick Stats */}
        <motion.div variants={item} className="col-span-1 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard 
             title="Próximo Plantão" 
             value={nextShift ? format(new Date(nextShift.date), "dd/MM", { locale: ptBR }) : "--/--"} 
             sub={nextShift?.location || "Sem escala"}
             icon={Calendar}
             color="text-blue-600"
             bg="bg-blue-50"
           />
           <StatCard 
             title="Ganhos do Mês" 
             value={`R$ ${stats?.totalEarnings?.toLocaleString('pt-BR') || '0,00'}`} 
             sub="Estimado"
             icon={TrendingUp}
             color="text-emerald-600"
             bg="bg-emerald-50"
           />
           <StatCard 
             title="Horas Plantadas" 
             value={`${stats?.totalHours || 0}h`} 
             sub="Este mês"
             icon={Activity}
             color="text-violet-600"
             bg="bg-violet-50"
           />
           <StatCard 
             title="Meta Financeira" 
             value={`${stats?.monthlyGoal ? Math.round((stats.totalEarnings / stats.monthlyGoal) * 100) : 0}%`} 
             sub="Concluída"
             icon={CheckSquare}
             color="text-orange-600"
             bg="bg-orange-50"
           />
        </motion.div>

        {/* Main Content Area */}
        <motion.div variants={item} className="md:col-span-2 grid gap-6">
          <section>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-slate-800">Acesso Rápido</h2>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ShortcutCard title="Prescrições" icon={FileText} href="/prescriptions" color="bg-blue-500" />
                <ShortcutCard title="Condutas" icon={CheckSquare} href="/checklists" color="bg-indigo-500" />
                <ShortcutCard title="Calculadora" icon={Activity} href="#" onClick={() => document.querySelector<HTMLElement>('button[data-testid="emergency-button"]')?.click()} color="bg-pink-500" />
                <ShortcutCard title="IA Médica" icon={Activity} href="/ai-chat" color="bg-emerald-500" />
             </div>
           </section>

          <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
             <div className="relative z-10 flex justify-between items-end">
               <div>
                 <h3 className="text-2xl font-bold font-display mb-2">Interconsulta com IA</h3>
                 <p className="text-slate-300 max-w-md mb-6">Discuta casos clínicos complexos, revise doses e interações medicamentosas em segundos.</p>
                 <Link href="/ai-chat">
                   <Button className="bg-white text-slate-900 hover:bg-blue-50 border-0 rounded-xl px-6">
                     Iniciar Chat <ArrowRight className="ml-2 w-4 h-4" />
                   </Button>
                 </Link>
               </div>
               <div className="hidden sm:block">
                 <Activity className="w-32 h-32 text-white/10 absolute bottom-[-20px] right-[-20px]" />
               </div>
             </div>
           </section>
        </motion.div>

        {/* Sidebar Area */}
        <motion.div variants={item} className="md:col-span-1 space-y-6">
           <Card className="p-6 rounded-3xl border-slate-100 shadow-lg h-full bg-white">
             <h3 className="font-bold text-lg mb-4 text-slate-800">Próximos Plantões</h3>
             <div className="space-y-4">
               {shifts?.slice(0, 3).map((shift, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                   <div className="h-12 w-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center text-blue-600 font-bold border border-blue-100">
                     <span className="text-xs uppercase">{format(new Date(shift.date), "MMM", { locale: ptBR })}</span>
                     <span className="text-lg leading-none">{format(new Date(shift.date), "dd")}</span>
                   </div>
                   <div>
                     <p className="font-semibold text-slate-800">{shift.location}</p>
                     <p className="text-xs text-slate-500">{shift.type || "Plantão"} • {shift.startTime || "07:00"} - {shift.endTime || "19:00"}</p>
                   </div>
                 </div>
               ))}
               {!shifts?.length && <p className="text-slate-400 text-sm text-center py-4">Nenhum plantão agendado.</p>}
             </div>
             <Link href="/shifts">
               <Button variant="outline" className="w-full mt-4 rounded-xl border-slate-200">Ver Agenda Completa</Button>
             </Link>
           </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
