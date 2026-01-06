import { useLibraryCategories, useLibraryItems } from "@/hooks/use-library";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, PlayCircle, ExternalLink, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Library() {
  const { data: categories } = useLibraryCategories();
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  // Default to first category if available and none selected
  if (!selectedCat && categories?.length) setSelectedCat(categories[0].id);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
       <div className="mb-6">
          <h1 className="text-3xl font-bold font-display text-slate-900">Biblioteca</h1>
          <p className="text-slate-500">Protocolos, aulas e referências.</p>
       </div>

       <div className="flex-1 grid md:grid-cols-4 gap-6 min-h-0">
          {/* Categories Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4 overflow-y-auto">
             <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 px-2">Categorias</h3>
             <div className="space-y-1">
                {categories?.map(cat => (
                   <button
                     key={cat.id}
                     onClick={() => setSelectedCat(cat.id)}
                     className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group",
                        selectedCat === cat.id 
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                          : "text-slate-600 hover:bg-slate-50"
                     )}
                   >
                      {cat.title}
                      {selectedCat === cat.id && <ChevronRight className="h-4 w-4" />}
                   </button>
                ))}
             </div>
          </div>

          {/* Items Content */}
          <div className="md:col-span-3 overflow-y-auto pr-2">
             {selectedCat ? <CategoryItems categoryId={selectedCat} /> : <div className="text-slate-400 p-8">Selecione uma categoria</div>}
          </div>
       </div>
    </div>
  );
}

function CategoryItems({ categoryId }: { categoryId: number }) {
  const { data: items, isLoading } = useLibraryItems(categoryId);

  if (isLoading) return <div>Carregando...</div>;

  return (
     <div className="space-y-4">
        {items?.map(item => (
           <a 
             key={item.id} 
             href={item.url} 
             target="_blank" 
             rel="noopener noreferrer"
             className="block group"
           >
              <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg transition-all flex items-start gap-4">
                 <div className={cn(
                    "p-3 rounded-xl",
                    item.type === 'video' ? "bg-red-50 text-red-500" :
                    item.type === 'pdf' ? "bg-orange-50 text-orange-500" :
                    "bg-blue-50 text-blue-500"
                 )}>
                    {item.type === 'video' ? <PlayCircle className="h-6 w-6" /> : 
                     item.type === 'pdf' ? <FileText className="h-6 w-6" /> : 
                     <ExternalLink className="h-6 w-6" />}
                 </div>
                 <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{item.description}</p>
                 </div>
              </div>
           </a>
        ))}
        {!items?.length && <p className="text-slate-400">Nenhum item nesta categoria.</p>}
     </div>
  );
}
