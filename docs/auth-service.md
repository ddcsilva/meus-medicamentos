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

### ✅ Implementados
1.  **Centralização do Redirecionamento** - Router removido do service
2.  **Gerenciamento Global de Loading** - Signal `isLoading` implementado
3.  **Tipagem Estrita e DTOs** - Modelo `AppUser` criado e utilizado
4.  **Tratamento Centralizado de Erros** - Classe `AuthError` e mapeamento de mensagens

### 🔄 Parcialmente Implementados
1.  **Desacoplamento do Provedor** - Modelo interno criado, mas falta interface `AuthGateway` abstrata

### ❌ Pendentes (Próximos Passos)
1.  **Abstração Completa** - Criar interface `AuthGateway` para desacoplar totalmente do Firebase
2.  **Melhorias de UX no Fluxo de Recuperação** - Validações e feedbacks mais ricos
3.  **Configurações de Segurança Avançadas** - Persistence explícita e preparação para MFA

## Melhorias Implementadas Recentemente

### Tratamento Centralizado de Erros ✨
Criamos uma arquitetura profissional de tratamento de erros:
- **Arquivo:** `auth-error.ts` com a classe `AuthError` e função `mapFirebaseAuthError()`
- **Benefícios:**
  - DRY: Zero duplicação de código entre componentes
  - Consistência: Mesmas mensagens em toda aplicação
  - Manutenibilidade: Um único local para alterar mensagens
  - UX: Mensagens em português e amigáveis ao usuário
  - Segurança: Evita enumeração de usuários (mesma mensagem para erros similares)
