/**
 * Hook placeholder para futura integração com API do ChatGPT
 * 
 * TODO: Quando implementar integração via API própria:
 * 1. Substituir a implementação por chamadas à API do backend
 * 2. Adicionar rota no servidor que chama a API do OpenAI
 * 3. Gerenciar chave de API via admin settings ou chave do usuário
 * 4. Implementar streaming de respostas se necessário
 * 
 * Uso atual: Apenas placeholder, não implementado
 * A funcionalidade atual usa webview/link externo para o ChatGPT
 */

export interface AssistenteIAMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UseAssistenteIAResult {
  sendPrompt: (prompt: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook stub para futura integração com IA via API
 * Atualmente retorna erro indicando que a funcionalidade 
 * não está implementada via API direta
 */
export function useAssistenteIA(): UseAssistenteIAResult {
  return {
    sendPrompt: async (_prompt: string): Promise<string> => {
      throw new Error(
        "Integração via API não implementada. Use o ChatGPT diretamente através do link externo."
      );
    },
    isLoading: false,
    error: null,
  };
}

export default useAssistenteIA;
