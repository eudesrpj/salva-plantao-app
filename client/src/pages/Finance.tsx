// Placeholder Finance Page
import { useShiftStats } from "@/hooks/use-shifts";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Finance() {
  const { data: stats } = useShiftStats();

  // Mock chart data - in real app, fetch monthly history
  const chartData = [
    { name: 'Jan', value: 4500 },
    { name: 'Fev', value: 6200 },
    { name: 'Mar', value: 5800 },
    { name: 'Abr', value: stats?.totalEarnings || 0 }, // Current month
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold font-display text-slate-900">Financeiro</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 border-none">
          <CardHeader><CardTitle className="text-emerald-100">Ganhos Totais</CardTitle></CardHeader>
          <CardContent>
             <div className="text-4xl font-bold">R$ {stats?.totalEarnings.toLocaleString('pt-BR')}</div>
             <p className="text-sm text-emerald-100 mt-2">Neste mês</p>
          </CardContent>
        </Card>
      </div>

      <Card>
         <CardHeader><CardTitle>Evolução Mensal</CardTitle></CardHeader>
         <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#2563eb' : '#cbd5e1'} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </CardContent>
      </Card>
    </div>
  );
}
