export type GuardResult = 
  | { level: 'ok' }
  | { level: 'warning'; message: string }
  | { level: 'blocked'; message: string; reason: string };

const CPF_REGEX = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}\b/g;
const CNS_REGEX = /\b\d{15}\b/g;
const PHONE_REGEX = /(?:\+55\s?)?\(?\d{2}\)?[\s.-]?\d{4,5}[-.\s]?\d{4}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const CEP_NUMERO_REGEX = /\b\d{5}[-.\s]?\d{3}\s*(?:,?\s*n[ºo°]?\s*\d+|\s+\d+)/gi;
const PRONTUARIO_REGEX = /(?:prontu[aá]rio|n[ºo°]?\s*prontu[aá]rio|registro)\s*[:\s#]?\s*\d{5,}/gi;

const SOFT_WARNING_PATTERNS = [
  { pattern: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b.*paciente/gi, label: 'data completa com paciente' },
  { pattern: /paciente.*\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/gi, label: 'data completa com paciente' },
  { pattern: /\b\d{8,}\b/g, label: 'sequência numérica longa' },
  { pattern: /\b(prontu[aá]rio|leito|endere[çc]o|telefone|cpf|cns)\b/gi, label: 'palavra-chave sensível' },
  { pattern: /\b[A-Z][a-záàãâéêíóôõúç]+\s+[A-Z][a-záàãâéêíóôõúç]+\b.*\d{1,3}\s*anos?.*\b[A-Z][a-záàãâéêíóôõúç]+\b/gi, label: 'nome + idade + cidade' },
];

export function checkContent(text: string): GuardResult {
  if (CPF_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (CPF detectado).', reason: 'CPF detected' };
  }
  
  if (CNS_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (CNS detectado).', reason: 'CNS detected' };
  }
  
  if (PHONE_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (telefone detectado).', reason: 'Phone detected' };
  }
  
  if (EMAIL_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (e-mail detectado).', reason: 'Email detected' };
  }
  
  if (CEP_NUMERO_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (CEP + número detectado).', reason: 'Address detected' };
  }
  
  if (PRONTUARIO_REGEX.test(text)) {
    return { level: 'blocked', message: 'Remova identificadores (nº prontuário detectado).', reason: 'Medical record detected' };
  }

  for (const { pattern, label } of SOFT_WARNING_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return { 
        level: 'warning', 
        message: `Atenção: isso pode identificar paciente (${label}). Revise antes de enviar.` 
      };
    }
  }

  return { level: 'ok' };
}

export const CHAT_DISCLAIMER = "Discuta o caso por idade/sexo/sintomas/exames. Não use nome, CPF/CNS, telefone, endereço, e-mail, prontuário.";

export const TERMS_TEXT = `TERMO DE COMPROMISSO DE SIGILO MÉDICO

Ao utilizar o chat interno do Salva Plantão, eu me comprometo a:

1. Manter o sigilo médico conforme o Código de Ética Médica
2. Não compartilhar dados que identifiquem pacientes (nome, CPF, CNS, telefone, endereço, e-mail, prontuário)
3. Descrever casos clínicos de forma anonimizada (idade, sexo, sintomas, exames)
4. Entender que as mensagens são criptografadas e expiram em 24 horas
5. Usar este canal apenas para discussões clínicas e profissionais

Declaro estar ciente de que o descumprimento deste termo pode resultar em bloqueio do acesso ao chat e responsabilização nos termos da lei.`;
