# Requisitos do Produto - Meus Medicamentos (Versão Resumida)

> **Sistema de Gerenciamento de Medicamentos Domésticos**  
> PWA para controle de estoque familiar de medicamentos

---

## 📋 Visão Geral

**Propósito:** Aplicação web para famílias gerenciarem medicamentos domésticos, controlarem validades, rastrearem quantidades e receberem alertas.

**Valor:** Segurança familiar + Economia + Organização + Compartilhamento

**Público-alvo:** Famílias, idosos com múltiplas medicações, cuidadores

---

## 🎯 Funcionalidades Principais

### 1. Autenticação e Usuários

**Métodos de Login:**
- Email/Senha (mínimo 6 caracteres)
- Google OAuth

**Fluxo de Aprovação:**
```
Cadastro → Status "pending" → Admin aprova manualmente → Status "approved"
```

**Modelo de Usuário:**
```typescript
{
  uid: string;
  email: string;
  nome: string;
  status: 'pending' | 'approved';
  familyId: string | null;
  photoURL?: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

**Estados e Acessos:**
- `pending` sem família → Aguardando Aprovação
- `approved` sem família → Criar/Entrar em Família
- `approved` com família → Dashboard (acesso completo)

### 2. Sistema de Famílias

**Funcionalidades:**
- Criar nova família (gera código de convite único)
- Entrar em família existente (via código)
- Compartilhar medicamentos entre membros

**Código de Convite:**
- Formato: `FAM-XXXXXX` (6 caracteres)
- Caracteres: A-Z, 2-9 (sem confusão visual)
- Único por família

**Modelo de Família:**
```typescript
{
  id: string;
  familyName: string;
  createdBy: string;
  members: string[];
  inviteCode: string;
  createdAt: Date;
}
```

### 3. Gerenciamento de Medicamentos

#### 3.1 Dados do Medicamento

**Campos Obrigatórios:**
- Nome comercial (3-100 caracteres)
- Princípio ativo / Droga (2-100 caracteres)
- Genérico (sim/não)
- Tipo (comprimido, cápsula, líquido, etc.)
- Data de validade (≥ hoje)
- Quantidade total (≥ 1)
- Quantidade atual (0 ≤ atual ≤ total)

**Campos Opcionais:**
- Marca/Laboratório
- Dosagem (ex: 500mg)
- Lote
- Categoria (analgésico, antibiótico, etc.)
- Foto (upload via Storage)
- Observações (até 500 caracteres)

**Status de Validade (Calculado Automaticamente):**
- `VALIDO`: Mais de 30 dias para vencer
- `PRESTES_VENCER`: 30 dias ou menos
- `VENCIDO`: Data já passou

#### 3.2 Operações CRUD

**Criar:** Formulário completo → Salva no Firestore → Redireciona para lista

**Listar:** 
- Tempo real (Firestore onSnapshot)
- Filtrado por usuário logado
- Busca por nome/droga/marca
- Cards com status visual

**Visualizar:** Detalhes completos + foto + estatísticas

**Editar:** Mesmos campos da criação, permite atualizar tudo

**Excluir:** Confirmação obrigatória → Exclusão permanente

#### 3.3 Firestore Collection

```
/medicamentos/{id}
{
  nome: string;
  droga: string;
  generico: boolean;
  marca?: string;
  dosagem?: string;
  lote?: string;
  tipo: string;
  categoria?: string;
  validade: Timestamp;
  quantidadeTotal: number;
  quantidadeAtual: number;
  fotoUrl?: string;
  observacoes?: string;
  criadoPor: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
```

### 4. Dashboard

**Estatísticas (4 cards):**
1. Total de Medicamentos
2. Vencendo em 30 Dias (status `PRESTES_VENCER`)
3. Vencidos (status `VENCIDO`)
4. Em Uso (alertas ativos - futuro)

**Seções:**
- Alertas Urgentes (preparado, não implementado)
- Medicamentos Vencendo (até 6 cards, ordenados por data)
- Estado Vazio (quando sem medicamentos)

**FAB:** Botão flutuante (+) para adicionar medicamento

---

## 🔐 Segurança (Firestore Rules)

### Usuários (`/users/{uid}`)
- **Leitura:** Apenas o próprio usuário
- **Criação:** Usuário autenticado, campos obrigatórios, status='pending'
- **Atualização:** Apenas o próprio usuário (não pode alterar status)
- **Exclusão:** Bloqueada

### Famílias (`/families/{id}`)
- **Leitura:** Membros da família OU queries por inviteCode
- **Criação:** Usuário autenticado, createdBy=uid, members=[uid]
- **Atualização:** Membros podem atualizar OU não-membros podem se adicionar (com código)
- **Exclusão:** Bloqueada

### Medicamentos (`/medicamentos/{id}`)
- **Leitura:** Apenas criador (criadoPor)
- **Criação:** Usuário autenticado, criadoPor=uid
- **Atualização:** Apenas criador
- **Exclusão:** Apenas criador

---

## 🗺️ Rotas e Navegação

### Rotas Públicas (Auth Layout)
```
/              → Redirect baseado em auth
/login         → Login/Cadastro (guestGuard)
/aguardando-aprovacao → Aguardando aprovação (pendingGuard)
/criar-familia → Criar/Entrar em família (createFamilyGuard)
```

### Rotas Protegidas (App Shell)
```
/dashboard     → Dashboard principal (dashboardGuard)
/medicamentos  → Lista de medicamentos (dashboardGuard)
/medicamentos/novo → Criar medicamento
/medicamentos/:id → Detalhes
/medicamentos/:id/editar → Editar
```

### Guards de Proteção

**guestGuard:** Apenas não-autenticados (login)  
**pendingGuard:** Apenas status='pending'  
**createFamilyGuard:** Apenas approved sem família  
**dashboardGuard:** Apenas approved com família

---

## 🎨 Interface e UX

### Layouts

**Auth Layout:**
- Card centralizado
- Sem header/sidebar

**App Shell:**
- Header fixo (menu, logo, tema, usuário)
- Sidebar colapsável (desktop) / drawer (mobile)
- Conteúdo principal com scroll

### Componentes Reutilizáveis

**StatCard:** Card de estatística (ícone + valor + título)  
**MedicationCard:** Card de medicamento (foto, nome, status, quantidade)  
**StatusBadge:** Badge colorido (válido/vencendo/vencido)  
**AlertCard:** Card de alerta (futuro)  
**EmptyState:** Estado vazio (ícone + mensagem + ação)

## 🔄 Fluxos Principais

### Primeiro Acesso (Novo Usuário)

```
1. Acessa / → Redireciona para /login
2. Clica "Criar conta"
3. Preenche: Nome, Email, Senha
4. Conta criada (status='pending')
5. Redireciona para /aguardando-aprovacao
6. [Admin aprova em uma seção definida pra ele]
7. Status muda para 'approved' → Detecta mudança
8. Redireciona para /criar-familia
9. Escolhe "Criar Nova Família"
10. Preenche nome da família
11. Família criada, código gerado
12. Dialog mostra código de convite
13. Redireciona para /dashboard
14. Dashboard vazio → "Adicionar Medicamento"
15. Preenche formulário
16. Medicamento criado → Lista
```

Criar um usuario administrador na aplicacao com poderes administrativos e uma area para ele aprovar os usuarios novos.

### Login Existente

```
1. Acessa / → /login
2. Preenche email/senha
3. Clica "Entrar"
4. Sistema verifica: approved + familyId
5. Redireciona para /dashboard
6. Dashboard carrega em tempo real
```


---

## 🧪 Validações Principais

### Formulário de Medicamento

- Nome: 3-100 caracteres
- Droga: 2-100 caracteres
- Tipo: Obrigatório
- Validade: Data ≥ hoje
- Quantidade Total: 1-9999
- Quantidade Atual: 0 ≤ atual ≤ total (validação cruzada)
- Foto: JPG/PNG/WEBP, upload via Storage
- Observações: Máximo 500 caracteres

### Formulário de Família

- Nome: 3-50 caracteres
- Código de convite: Formato FAM-XXXXXX

### Formulário de Login/Cadastro

- Email: Formato válido
- Senha: Mínimo 6 caracteres
- Nome (cadastro): Mínimo 3 caracteres

---

## 📊 Dados em Tempo Real

**Firestore onSnapshot:**
- Lista de medicamentos atualiza automaticamente
- Status do usuário atualiza automaticamente
- Dados da família atualizam automaticamente

**Benefício:** Múltiplos dispositivos/usuários sincronizados instantaneamente

---

## 🚀 Stack Tecnológica (Implementação Atual)

**Frontend:**
- Angular 20+ (Standalone Components + Signals)
- Tailwind
- TypeScript 5.9+

**Backend:**
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting


---

## 🔮 Roadmap (Futuras Fases)

### Fase 2: Alertas Inteligentes
- Alertas de estoque baixo
- Notificações de vencimento
- Lembretes de reposição

### Fase 3: Histórico de Consumo
- Registrar baixas no estoque
- Estatísticas de uso
- Padrões de consumo

### Fase 4: Compartilhamento Familiar Avançado
- Visualização compartilhada de todos medicamentos
- Permissões por membro (admin/editor/visualizador)

### Fase 5: Relatórios
- Gastos com medicamentos
- Gráficos de consumo
- Exportação (PDF/CSV)

### Fase 6: IA
- OCR para ler caixa/bula
- Categorização automática
- Alertas preditivos

---

## 📝 Requisitos Não-Funcionais

**Performance:**
- First Load: < 3s em 3G
- Lighthouse Score: > 90

**Segurança:**
- HTTPS obrigatório
- Firestore Rules rigorosas
- Autenticação obrigatória


---

## ✅ Resumo Executivo para Desenvolvedor

**O que o sistema faz:**
1. Gerencia cadastro e autenticação de usuários (Firebase Auth)
2. Organiza usuários em famílias com códigos de convite
3. Permite CRUD completo de medicamentos
4. Calcula status de validade automaticamente
5. Exibe dashboard com estatísticas e alertas
6. Funciona offline (PWA)
7. Tempo real (Firestore)

**Tecnologia-chave:**
- Firebase para backend completo (Auth + Firestore + Storage)
- Signals para estado reativo
- Firestore Rules para segurança

**Aprovação Manual:**
- Usuários novos começam com status='pending'
- Admin deve aprovar manualmente no Firebase Console
- Após aprovação, usuário pode acessar sistema completo

---
