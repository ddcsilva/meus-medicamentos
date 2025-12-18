# Documentação Técnica: AuthService

## Visão Geral
O `AuthService` é um serviço central da camada `Core` responsável por gerenciar todo o ciclo de vida da autenticação do usuário. Ele utiliza a integração oficial do **AngularFire** (Firebase Auth) e expõe o estado de forma reativa utilizando **Angular Signals**.

## Implementação Atual
- **Localização:** `src/app/core/auth/auth.service.ts`
- **Tecnologias:** Angular 20+, AngularFire, Signals.
- **Estado:** Utiliza `toSignal` para converter o `authState` do Firebase em um Signal reativo (`currentUser`).

### Principais Funcionalidades
1.  **Monitoramento de Estado:** Expõe `currentUser` e um computed `isAuthenticated`.
2.  **Login (E-mail/Senha):** Autenticação padrão com redirecionamento para o dashboard.
3.  **Registro:** Fluxo de criação de conta com atualização imediata do `displayName`.
4.  **Recuperação de Senha:** Envio de e-mail de reset via Firebase.
5.  **Social Login:** Integração com Google via Pop-up.
6.  **Logout:** Encerramento de sessão e limpeza de estado.

---

## Pontos de Melhoria (Visão Sênior)

Como desenvolvedor sênior, identifiquei oportunidades para tornar este serviço mais robusto, seguro e fácil de testar:

### 1. Desacoplamento do Provedor (Abstração)
**Problema:** O serviço está fortemente acoplado ao Firebase. Se amanhã o projeto migrar para AWS Cognito ou Supabase, a refatoração será massiva.
**Sugestão:** Criar uma interface `AuthGateway` ou um tipo abstrato. O `AuthService` deve consumir essa abstração, e o Firebase seria apenas uma implementação dela.

### 2. Centralização do Redirecionamento
**Problema:** Os métodos `login`, `register` e `logout` possuem rotas "hardcoded" (`this.router.navigate(['...'])`).
**Sugestão:** O serviço não deve decidir para onde o usuário vai. Os componentes ou um `AuthGuard` devem orquestrar a navegação, ou o serviço deve aceitar uma rota opcional por parâmetro. Isso melhora o reuso e a testabilidade.

### 3. Gerenciamento Global de Erros e Loading
**Problema:** Atualmente, cada componente lida com seu próprio estado de "loading" e mensagens de erro.
**Sugestão:** Implementar sinais globais no `AuthService`:
```typescript
private _isLoading = signal(false);
public readonly isLoading = this._isLoading.asReadonly();
```
Isso permite que um Spinner global no `AppComponent` ou no `Layout` reaja automaticamente a qualquer ação de autenticação.

### 4. Tipagem Estrita e DTOs
**Problema:** Estamos usando o tipo `User` diretamente do Firebase em toda a aplicação.
**Sugestão:** Mapear o usuário do Firebase para uma interface interna da aplicação (`AppUser`). Isso protege o restante do sistema contra mudanças na SDK do Firebase.

### 5. Melhoria no Fluxo de Recuperação (UX)
**Problema:** O método `recoverPassword` apenas dispara o e-mail.
**Sugestão:** Implementar um fluxo que valide se o e-mail existe (dentro do possível por segurança) e forneça feedbacks mais granulares.

### 6. Segurança: Persistence e MFA
**Sugestão:** Configurar explicitamente a persistência da sessão (Local vs Session) e preparar o serviço para suporte a MFA (Multi-Factor Authentication), que é um requisito comum em aplicações escaláveis.

---

## Status de Implementação

### ✅ Implementados (Production-Ready)
1.  **Centralização do Redirecionamento** - Router removido do service
2.  **Gerenciamento Global de Loading** - Signal `isLoading` implementado
3.  **Tipagem Estrita e DTOs** - Modelo `AppUser` criado e utilizado
4.  **Tratamento Centralizado de Erros** - Classe `AuthError` e mapeamento de mensagens
5.  **Abstração Completa (AuthGateway)** - Interface + Implementação Firebase
6.  **Melhorias de UX na Recuperação de Senha** - Validação visual + Cooldown de reenvio
7.  **Configurações de Segurança Avançadas** - Persistência explícita + Config por ambiente

### 🔄 Preparado para Implementação Futura
1.  **Multi-Factor Authentication (MFA)** - Estrutura criada, aguardando implementação UI
2.  **Timeout de Sessão** - Configurável, mas desabilitado por padrão
3.  **Verificação de E-mail Obrigatória** - Pronto para habilitar em produção

---

## Arquitetura Final Implementada

### 1. Abstração Completa via AuthGateway ✨

**Arquivos criados:**
- `auth-gateway.interface.ts` - Contrato abstrato de autenticação
- `firebase-auth-gateway.ts` - Implementação concreta do Firebase
- `auth.service.ts` - Consome apenas a interface (Inversão de Dependência)

**Benefícios:**
- ✅ **Testabilidade:** Fácil criar mocks da interface
- ✅ **Flexibilidade:** Trocar provedor = criar nova implementação
- ✅ **SOLID:** Princípio da Inversão de Dependência aplicado
- ✅ **Manutenibilidade:** Mudanças no Firebase não afetam o service

**Como trocar de provedor:**
```typescript
// Criar SupabaseAuthGateway implements AuthGateway
// Alterar no provider:
{ provide: AuthGateway, useClass: SupabaseAuthGateway }
```

### 2. Melhorias de UX na Recuperação de Senha 🎨

**Implementações:**
- ✅ Validação visual em tempo real (verde/vermelho)
- ✅ Feedback imediato de formato de e-mail
- ✅ Cooldown de 60s para reenvio (evita spam)
- ✅ Contador visual do cooldown
- ✅ Mensagens contextuais e informativas
- ✅ Ícones e animações suaves

**Impacto:**
- Reduz tentativas de envio desnecessárias
- Melhora percepção de segurança
- Diminui suporte ao usuário

### 3. Configurações de Segurança Avançadas 🔒

**Arquivo:** `auth-config.ts`

**Configurações disponíveis:**
```typescript
interface AuthConfig {
  persistence: 'local' | 'session' | 'none';
  sessionTimeoutMinutes: number | null;
  requireEmailVerification: boolean;
  enableMFA: boolean;
  maxLoginAttempts: number | null;
  lockoutDurationMinutes: number;
  allowedRedirectUrls: string[];
}
```

**Aplicação no app.config.ts:**
- Desenvolvimento: `DEFAULT_AUTH_CONFIG` (persistência local, sem timeout)
- Produção: `PRODUCTION_AUTH_CONFIG` (persistência de sessão, timeout de 30min)

**Como habilitar MFA no futuro:**
1. Atualizar `enableMFA: true` no config
2. Criar componente de verificação de código
3. Integrar com `gateway.verifyMFACode()`

---

## Melhorias Implementadas - Resumo Técnico

### Tratamento Centralizado de Erros
- **Arquivo:** `auth-error.ts`
- **Padrão:** Custom Error Class + Error Mapper Function
- **Códigos mapeados:** 15+ códigos Firebase → Mensagens em PT-BR

### Validação de E-mail (Frontend)
- Regex RFC 5322 simplificado
- Previne chamadas desnecessárias ao backend
- Melhora performance e UX

### Rate Limiting (Frontend)
- Cooldown de 60s no reset de senha
- Previne abuso e sobrecarga do servidor
- Firebase já possui rate limiting no backend
