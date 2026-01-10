import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Users, Search, ArrowLeft, AlertTriangle, X, Plus, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { checkContent, type GuardResult } from "@/chat/utils/contentGuard";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

interface ChatRoom {
  id: number;
  type: "group" | "dm";
  stateUf?: string;
  name?: string;
  otherUser?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface ChatMessage {
  id: number;
  roomId: number;
  senderId: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  senderName: string;
  senderImage?: string;
}

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  uf?: string;
  chatTermsAcceptedAt?: string;
}

export default function Chat() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [showTerms, setShowTerms] = useState(false);
  const [selectedUf, setSelectedUf] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [contentWarning, setContentWarning] = useState<GuardResult | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingMessageConfirmed, setPendingMessageConfirmed] = useState(false);

  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
  });

  const { data: rooms = [], refetch: refetchRooms } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: !!user?.chatTermsAcceptedAt,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"],
    enabled: !!selectedRoom,
  });

  const { data: contacts = [] } = useQuery<any[]>({
    queryKey: ["/api/chat/contacts"],
    enabled: !!user?.chatTermsAcceptedAt,
  });

  const { data: searchResults = [] } = useQuery<any[]>({
    queryKey: ["/api/chat/search-users", { q: searchQuery }],
    enabled: showSearch && searchQuery.length >= 2,
  });

  useEffect(() => {
    if (user && !user.chatTermsAcceptedAt) {
      setShowTerms(true);
      if (user.uf) setSelectedUf(user.uf);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user?.chatTermsAcceptedAt || !user?.id || !selectedRoom) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
      ws.send(JSON.stringify({ type: "chat_subscribe", roomId: selectedRoom.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat_message" && data.roomId === selectedRoom.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", selectedRoom.id, "messages"] });
        }
      } catch {}
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "chat_unsubscribe", roomId: selectedRoom.id }));
      }
      ws.close();
    };
  }, [user?.chatTermsAcceptedAt, user?.id, selectedRoom, queryClient]);

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/chat/accept-terms", { uf: selectedUf });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setShowTerms(false);
      toast({ title: "Termos aceitos", description: "Você agora pode usar o chat." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível aceitar os termos.", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      return await apiRequest("POST", `/api/chat/rooms/${selectedRoom!.id}/messages`, { body });
    },
    onSuccess: () => {
      setMessageInput("");
      setContentWarning(null);
      setPendingMessageConfirmed(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/rooms", selectedRoom?.id, "messages"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message || "Não foi possível enviar a mensagem.", variant: "destructive" });
    },
  });

  const startDmMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return await apiRequest("POST", "/api/chat/start-dm", { contactId });
    },
    onSuccess: (data: any) => {
      setShowSearch(false);
      setSearchQuery("");
      refetchRooms();
      setSelectedRoom(data);
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível iniciar conversa.", variant: "destructive" });
    },
  });

  const handleSendMessage = useCallback(() => {
    const trimmed = messageInput.trim();
    if (!trimmed || !selectedRoom) return;

    const check = checkContent(trimmed);
    
    if (check.level === "blocked") {
      toast({
        title: "Mensagem bloqueada",
        description: check.message,
        variant: "destructive",
      });
      return;
    }

    if (check.level === "warning" && !pendingMessageConfirmed) {
      setContentWarning(check);
      return;
    }

    sendMessageMutation.mutate(trimmed);
  }, [messageInput, selectedRoom, pendingMessageConfirmed, sendMessageMutation, toast]);

  const confirmWarningAndSend = () => {
    setPendingMessageConfirmed(true);
    sendMessageMutation.mutate(messageInput.trim());
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="chat-loading">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-testid="chat-page">
      <Dialog open={showTerms} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" data-testid="dialog-terms">
          <DialogHeader>
            <DialogTitle>Termos do Chat Médico</DialogTitle>
            <DialogDescription className="text-left">
              Para usar o chat entre médicos, você precisa aceitar os seguintes termos:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm space-y-2 text-muted-foreground">
              <p>1. <strong>Não compartilhe dados de pacientes</strong> (CPF, CNS, telefone, endereço, nomes completos)</p>
              <p>2. <strong>Todas as mensagens expiram em 24 horas</strong></p>
              <p>3. <strong>Use apenas para discussões profissionais</strong></p>
              <p>4. <strong>Mensagens com dados sensíveis serão bloqueadas automaticamente</strong></p>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione seu estado (UF):</label>
              <Select value={selectedUf} onValueChange={setSelectedUf}>
                <SelectTrigger data-testid="select-uf">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map(uf => (
                    <SelectItem key={uf} value={uf} data-testid={`option-uf-${uf}`}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Você será adicionado automaticamente ao grupo de médicos do seu estado.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => acceptTermsMutation.mutate()}
              disabled={!selectedUf || acceptTermsMutation.isPending}
              data-testid="button-accept-terms"
            >
              {acceptTermsMutation.isPending ? "Aceitando..." : "Aceitar e continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contentWarning} onOpenChange={() => setContentWarning(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-content-warning">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Conteúdo Suspeito Detectado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Sua mensagem pode conter informações sensíveis:
            </p>
            {contentWarning && contentWarning.level === "warning" && (
              <p className="text-yellow-600 text-sm">{contentWarning.message}</p>
            )}
            <p className="text-sm mt-4">
              Deseja enviar mesmo assim?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setContentWarning(null)} data-testid="button-cancel-warning">
              Cancelar
            </Button>
            <Button onClick={confirmWarningAndSend} data-testid="button-confirm-warning">
              Enviar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 min-h-0">
        <div className={`w-full md:w-80 border-r flex flex-col ${selectedRoom ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b flex items-center justify-between gap-2">
            <h2 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat Médico
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} data-testid="button-new-chat">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma conversa ainda
                </p>
              ) : (
                rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-3 rounded-lg text-left hover-elevate flex items-center gap-3 ${
                      selectedRoom?.id === room.id ? "bg-accent" : ""
                    }`}
                    data-testid={`room-${room.id}`}
                  >
                    {room.type === "group" ? (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={room.otherUser?.profileImageUrl} />
                        <AvatarFallback>{getInitials(room.name || "U")}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{room.name || (room.type === "group" ? `Médicos ${room.stateUf}` : "Conversa")}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.type === "group" ? "Grupo do estado" : "Conversa privada"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className={`flex-1 flex flex-col ${!selectedRoom ? "hidden md:flex" : "flex"}`}>
          {selectedRoom ? (
            <>
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedRoom(null)}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedRoom.type === "group" ? (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedRoom.otherUser?.profileImageUrl} />
                    <AvatarFallback>{getInitials(selectedRoom.name || "U")}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="font-medium">{selectedRoom.name || `Médicos ${selectedRoom.stateUf}`}</p>
                  <p className="text-xs text-muted-foreground">
                    Mensagens expiram em 24h
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma mensagem ainda. Seja o primeiro a enviar!
                    </p>
                  ) : (
                    messages.map(msg => {
                      const isOwn = msg.senderId === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                          data-testid={`message-${msg.id}`}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={msg.senderImage} />
                              <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                            {!isOwn && selectedRoom.type === "group" && (
                              <p className="text-xs text-muted-foreground mb-1">{msg.senderName}</p>
                            )}
                            <div className={`rounded-lg p-3 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-md" data-testid="dialog-search-users">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Busque um médico para iniciar uma conversa privada
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>

            {contacts.length > 0 && !searchQuery && (
              <div>
                <p className="text-sm font-medium mb-2">Contatos recentes</p>
                <div className="space-y-1">
                  {contacts.slice(0, 5).map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => startDmMutation.mutate(contact.id)}
                      className="w-full p-2 rounded-lg text-left hover-elevate flex items-center gap-3"
                      data-testid={`contact-${contact.id}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={contact.profileImageUrl} />
                        <AvatarFallback>
                          {getInitials(`${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {`${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Usuário"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery.length >= 2 && (
              <div>
                <p className="text-sm font-medium mb-2">Resultados da busca</p>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum usuário encontrado
                  </p>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => startDmMutation.mutate(result.id)}
                        className="w-full p-2 rounded-lg text-left hover-elevate flex items-center gap-3"
                        data-testid={`search-result-${result.id}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={result.profileImageUrl} />
                          <AvatarFallback>
                            {getInitials(`${result.firstName || ""} ${result.lastName || ""}`.trim() || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {`${result.firstName || ""} ${result.lastName || ""}`.trim() || "Usuário"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
