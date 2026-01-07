import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Brain, ChevronDown, ChevronUp, Loader2, Pill, Search, Sparkles } from "lucide-react";
import type { Prescription } from "@shared/schema";

type PrescriptionSuggestion = Prescription & { relevanceScore: number };

interface PrescriptionSuggestionAssistantProps {
  onSelectSuggestion: (prescription: Prescription) => void;
  currentAgeGroup: "adulto" | "pediatrico";
}

export function PrescriptionSuggestionAssistant({ 
  onSelectSuggestion, 
  currentAgeGroup 
}: PrescriptionSuggestionAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [ageGroup, setAgeGroup] = useState<string>(currentAgeGroup);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: suggestions, isLoading, isFetching } = useQuery<PrescriptionSuggestion[]>({
    queryKey: ["/api/prescriptions/suggestions", diagnosis, ageGroup, searchTrigger],
    queryFn: async () => {
      if (!diagnosis.trim() && searchTrigger === 0) return [];
      const params = new URLSearchParams();
      if (diagnosis) params.append("diagnosis", diagnosis);
      if (ageGroup) params.append("ageGroup", ageGroup);
      const res = await fetch(`/api/prescriptions/suggestions?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao buscar sugestões");
      return res.json();
    },
    enabled: searchTrigger > 0 || diagnosis.length > 2,
    staleTime: 30000,
  });

  const handleSearch = () => {
    setSearchTrigger(prev => prev + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return "default";
    if (score >= 40) return "secondary";
    return "outline";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Alta";
    if (score >= 40) return "Média";
    return "Baixa";
  };

  return (
    <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 to-background dark:from-purple-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Assistente de Sugestão de Prescrição
                    <Badge variant="outline" className="text-xs font-normal">IA do Sistema</Badge>
                  </CardTitle>
                  <CardDescription>
                    Sugestões baseadas nos modelos cadastrados no app. Revise antes de prescrever.
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" data-testid="button-toggle-assistant">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Diagnóstico / Patologia</label>
                <Input
                  placeholder="Ex: pneumonia, ITU, amigdalite..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="input-diagnosis"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Faixa Etária</label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger data-testid="select-age-group">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adulto">Adulto</SelectItem>
                    <SelectItem value="pediatrico">Pediátrico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch} 
              className="w-full md:w-auto"
              disabled={isFetching}
              data-testid="button-search-suggestions"
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar Sugestões
            </Button>

            {(isLoading || isFetching) && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            )}

            {suggestions && suggestions.length > 0 && !isFetching && (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <Card 
                      key={suggestion.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => onSelectSuggestion(suggestion)}
                      data-testid={`card-suggestion-${suggestion.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium truncate">{suggestion.title}</h4>
                              <Badge 
                                variant={getScoreBadgeVariant(suggestion.relevanceScore)}
                                className="text-xs"
                              >
                                Relevância: {getScoreLabel(suggestion.relevanceScore)}
                              </Badge>
                            </div>
                            {suggestion.medication && (
                              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                <Pill className="h-3.5 w-3.5" />
                                <span className="truncate">{suggestion.medication}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {suggestion.pharmaceuticalForm && (
                                <Badge variant="outline" className="text-xs">{suggestion.pharmaceuticalForm}</Badge>
                              )}
                              {suggestion.interval && (
                                <Badge variant="outline" className="text-xs">{suggestion.interval}</Badge>
                              )}
                              {suggestion.duration && (
                                <Badge variant="outline" className="text-xs">{suggestion.duration}</Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSuggestion(suggestion);
                            }}
                            data-testid={`button-use-suggestion-${suggestion.id}`}
                          >
                            Usar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {suggestions && suggestions.length === 0 && searchTrigger > 0 && !isFetching && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma sugestão encontrada para "{diagnosis}"</p>
                <p className="text-sm mt-1">Tente outro termo ou verifique os modelos cadastrados.</p>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                As sugestões são baseadas nos modelos cadastrados no sistema e devem ser revisadas 
                pelo médico antes da prescrição. Este módulo não cria medicamentos ou doses 
                automaticamente.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
