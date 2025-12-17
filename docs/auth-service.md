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

## Próximos Passos Sugeridos
1.  Refatorar a navegação para fora do serviço.
2.  Mapear o objeto `User` para um modelo interno.
3.  Implementar um interceptor ou serviço de notificação para erros do Firebase (ex: `auth/user-not-found`).
