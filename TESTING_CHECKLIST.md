# Checklist de Testes Manual

## 1. Navegação e Rotas

### Bottom Navigation (Mobile)
- [ ] Bottom nav aparece no rodapé em dispositivos móveis (viewport < 768px)
- [ ] 4 abas estão visíveis: Atendimento, Ferramentas, Financeiro, Perfil
- [ ] Abas com ícones corretos (Activity, Wrench, DollarSign, User)
- [ ] Click em cada aba navega para a rota correta
- [ ] Aba ativa tem destaque visual (border-top e cor)

### Rotas Antigas Continuam Funcionando
- [ ] `/` → Dashboard carrega normalmente
- [ ] `/prescriptions` → Tela de prescrições carrega
- [ ] `/evolution` → Tela de evolução carrega
- [ ] `/exams` → Tela de exames carrega
- [ ] `/protocols` → Tela de protocolos carrega
- [ ] `/shifts` → Tela de plantões carrega
- [ ] `/finance` → Tela de financeiro carrega (antiga)
- [ ] `/profile` → Tela de perfil antiga carrega

---

## 2. Hub: Atendimento (`/atendimento`)

### Carregamento
- [ ] Rota `/atendimento` carrega com sucesso
- [ ] Layout com gradient azul (gradiente to blue)
- [ ] Header exibe título "Atendimento"
- [ ] Header exibe descrição

### Cards de Atalhos
- [ ] Card "Emergência" em destaque no topo (vermelho)
- [ ] Card "Prescrição" → clica, navega para `/prescriptions`
- [ ] Card "Evolução" → clica, navega para `/evolution`
- [ ] Card "Exames" → clica, navega para `/exams`
- [ ] Card "Atestado" → clica, navega para `/medical-certificate`
- [ ] Card "Encaminhamento" → clica, navega para `/referral`
- [ ] Card "Declaração" → clica, navega para `/attendance-declaration`
- [ ] Card "Protocolos" → clica, navega para `/protocols`
- [ ] Hover em cards mostra shadow (transição suave)

---

## 3. Hub: Ferramentas (`/ferramentas`)

### Carregamento
- [ ] Rota `/ferramentas` carrega com sucesso
- [ ] Layout com gradient âmbar (gradiente to amber)
- [ ] Header exibe título "Ferramentas"

### Cards
- [ ] 6 cards aparecem em grid (3 colunas em desktop)
- [ ] "Calculadoras" → navega para `/calculators` (ou rota existente)
- [ ] "Interações" → navega para `/drug-interactions`
- [ ] "Medicações" → navega para `/library`
- [ ] "Memorização" → navega para `/memorize`
- [ ] "Chat Médico" → navega para `/chat`
- [ ] "Assistente IA" → navega para `/ai-webview`

---

## 4. Hub: Financeiro (`/financeiro`)

### Carregamento
- [ ] Rota `/financeiro` carrega com sucesso
- [ ] Layout com gradient verde-esmeralda
- [ ] Header exibe título "Financeiro"
- [ ] Tabs aparecem: "Ganhos & Metas" e "IRPF 2024"

### Aba "Ganhos & Metas"
- [ ] Carrega componente Finance existente
- [ ] Funcionalidades antigas de financeiro funcionam
- [ ] Dados de ganhos aparecem corretamente

### Aba "IRPF 2024"
- [ ] Carrega componente IRPFCalculator
- [ ] Campos "Renda Mensal Bruta" e "Deduções Mensais" aparecem
- [ ] Botão "Calcular IRPF" está visível
- [ ] Aviso com texto informativo aparece

#### IRPF Calculator - Funcionalidade
- [ ] Digitar renda e clicar "Calcular" mostra resultado
- [ ] Resultado exibe mensal (bruta, deduções, taxável, IRPF, líquida)
- [ ] Resultado exibe anual (bruta, deduções, taxável, IRPF, líquida)
- [ ] Cálculo com renda=5000, deduções=0 é correto (verif. manualmente)
- [ ] Cálculo respeita limite de dedução (R$ 869,36/mês)
- [ ] Valores são formatados em BRL (R$ X.XXX,XX)

---

## 5. Hub: Perfil (`/perfil`)

### Carregamento
- [ ] Rota `/perfil` carrega com sucesso
- [ ] Layout com gradient roxo
- [ ] Header exibe "Dr(a). {displayName}"
- [ ] Abas aparecem: Info, Anotações, Agenda, Tarefas, Config

### Display Name
- [ ] Se `displayName` existe, exibe corretamente
- [ ] Se `displayName` não existe, fallback para firstName+lastName
- [ ] Botão de editar (ícone Edit) está visível
- [ ] Click no botão entra em modo edição
- [ ] Campo input aparece para editar nome
- [ ] Botão Save salva mudanças
- [ ] Após salvar, nome atualiza na tela
- [ ] Toast de sucesso aparece

### Aba "Info"
- [ ] Email do usuário é exibido (disabled)
- [ ] Primeiro nome é exibido (disabled)
- [ ] Último nome é exibido (disabled)
- [ ] Aviso: "Para alterar informações básicas..." aparece

### Aba "Anotações"
- [ ] Botão "Gerenciar Anotações" aparece
- [ ] Texto "Funcionalidade em desenvolvimento" aparece

### Aba "Agenda"
- [ ] Botão "Acessar Plantões" aparece
- [ ] Texto "Seus plantões são exibidos..." aparece

### Aba "Tarefas"
- [ ] Botão "Gerenciar Tarefas" aparece
- [ ] Texto "Funcionalidade em desenvolvimento" aparece

### Aba "Config"
- [ ] 3 botões aparecem: Tema, Preferências de Msg do Dia, Privacidade
- [ ] Texto "Personalize sua experiência..." aparece

---

## 6. API: User Medications (Medicações do Usuário)

### Criar Medicação
```
POST /api/user-medications
{
  "name": "Dipirona Customizada",
  "presentation": "Comprimido",
  "dose": "500mg",
  "interval": "6/6h",
  "route": "VO",
  "observations": "Minha anotação"
}
```
- [ ] Status 201 retornado
- [ ] Medicação criada com userId correto
- [ ] Id gerado corretamente

### Listar Medicações
```
GET /api/user-medications
```
- [ ] Status 200
- [ ] Array de medicações do usuário retornado
- [ ] Medicações ordenadas por createdAt DESC
- [ ] Apenas medicações do usuário aparecem

### Buscar Medicações
```
GET /api/user-medications/search?q=dipirona
```
- [ ] Status 200
- [ ] Resultados filtrados por nome (case-insensitive)
- [ ] Query obrigatório (sem query = 400)

### Atualizar Medicação
```
PUT /api/user-medications/:id
{ "dose": "1000mg" }
```
- [ ] Status 200
- [ ] Campo atualizado corretamente
- [ ] updatedAt sincronizado

### Deletar Medicação
```
DELETE /api/user-medications/:id
```
- [ ] Status 200 se medicação pertence ao usuário
- [ ] Status 403 se medicação pertence a outro usuário
- [ ] Medicação removida do BD

---

## 7. API: User Preferences

### Obter Preferências
```
GET /api/user-preferences
```
- [ ] Status 200
- [ ] Se não existem, cria defaults e retorna
- [ ] Todos os campos aparecem (messageOfDayEnabled, etc.)

### Atualizar Preferências
```
PUT /api/user-preferences
{
  "messageOfDayEnabled": false,
  "theme": "dark"
}
```
- [ ] Status 200
- [ ] Campos atualizados corretamente
- [ ] updatedAt sincronizado

---

## 8. API: Feature Flags (Admin Only)

### Listar Flags
```
GET /api/admin/feature-flags
```
- [ ] Status 200 se admin
- [ ] Status 403 se não é admin
- [ ] Array de flags retornado

### Verificar Feature (Público)
```
GET /api/features/message_of_day_enabled
```
- [ ] Status 200
- [ ] Retorna `{ enabled: true/false }`
- [ ] Default é `true` se flag não existe

### Criar Flag (Admin)
```
POST /api/admin/feature-flags
{
  "key": "test_feature",
  "name": "Test",
  "enabled": true
}
```
- [ ] Status 201 se admin
- [ ] Status 403 se não é admin

### Atualizar Flag (Admin)
```
PUT /api/admin/feature-flags/test_feature
{ "enabled": false }
```
- [ ] Status 200 se admin
- [ ] Flag atualizada no BD

---

## 9. API: Message of the Day

### Obter Mensagem do Dia (Usuário)
```
GET /api/message-of-day
```
- [ ] Status 200
- [ ] Retorna mensagem se:
  - Usuário tem messageOfDayEnabled = true
  - Feature enabled = true
  - Não foi mostrada hoje (verifica lastMessageOfDayDate)
- [ ] Se já mostrada hoje, retorna `{ message: null, reason: "Already shown today" }`
- [ ] após retornar mensagem, updatea lastMessageOfDayDate

### Listar Mensagens (Admin)
```
GET /api/admin/message-of-day?type=verse&source=default
```
- [ ] Status 200 se admin
- [ ] Status 403 se não é admin
- [ ] Array de mensagens filtradas

### Criar Mensagem (Admin)
```
POST /api/admin/message-of-day
{
  "type": "verse",
  "content": "Lorem ipsum",
  "source": "admin_custom",
  "isActive": true
}
```
- [ ] Status 201 se admin
- [ ] createdBy preenchido com userId

### Deletar Mensagem (Admin)
```
DELETE /api/admin/message-of-day/:id
```
- [ ] Status 200 se admin
- [ ] Mensagem removida

---

## 10. Data Integrity (Crítico!)

### Dados Antigos Intactos
- [ ] Table `medications` (admin) NUNCA foi alterada
- [ ] Table `prescriptions` NUNCA foi alterada
- [ ] Prescrições antigas carregam corretamente
- [ ] Medicações do admin aparecem em buscas antigas
- [ ] Evolução antiga continua funcionando
- [ ] Atestados antigos continuam funcionando

### Novas Tabelas
- [ ] `user_medications` existe e vazia inicialmente
- [ ] `user_preferences` existe com defaults
- [ ] `admin_feature_flags` existe com flags padrão
- [ ] `admin_quick_access_config` existe
- [ ] `message_of_day_messages` existe

### Foreign Keys
- [ ] Não há orfãos (todas FKs apontam para linhas válidas)
- [ ] Deletar usuário não quebra (soft delete implementado)

---

## 11. Segurança

### Authorization
- [ ] Usuário não consegue deletar medicação de outro usuário
- [ ] Usuário não consegue editar preferências de outro usuário
- [ ] Apenas admin consegue acessar `/api/admin/*` endpoints
- [ ] Não-autenticado recebe 401

### Data Protection
- [ ] Medicações do admin não aparecem em `user_medications`
- [ ] User não consegue marcar medicação como "deletada" sem permissão

---

## 12. Console & Logs

- [ ] Nenhum erro no console do navegador
- [ ] Nenhum warning no TypeScript check
- [ ] Nenhum erro no servidor (stdout limpo)
- [ ] Logs estruturados para debug

---

## 13. Performance (Básico)

- [ ] Páginas carregam em < 2 segundos
- [ ] Animações são suaves (60fps)
- [ ] Queries não têm N+1 problems
- [ ] Bundle size não aumentou significativamente

---

## Sign-Off

- **Desenvolvedor**: ___________________
- **Data**: ___________________
- **Testes Passaram**: [ ] Sim [ ] Não
- **Observações**:
  ```
  (espaço para anotações)
  ```

---

## Rollback Plan (Se Necessário)

1. `git reset --hard <commit_antes_mudanças>`
2. `npm run db:push` com schema anterior
3. Sem perda de dados (apenas novos campos/tabelas descartados)
