/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com
*/

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function CreatorFooter() {
  return (
    <footer className="py-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="flex flex-col items-center gap-1">
        <p>© Salva Plantão</p>
        <p className="text-slate-500 hidden sm:block">
          Suporte: <a href="mailto:suporte@appsalvaplantao.com" className="hover:text-primary transition-colors">suporte@appsalvaplantao.com</a>
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="hidden sm:block cursor-default">
              Criado por <span className="font-medium text-slate-500 dark:text-slate-400">ERPJ</span>
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>ERPJ — criador do Salva Plantão</p>
          </TooltipContent>
        </Tooltip>
        <p className="sm:hidden">
          Criado por <span className="font-medium text-slate-500 dark:text-slate-400">ERPJ</span>
        </p>
      </div>
    </footer>
  );
}
