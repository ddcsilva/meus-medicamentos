# Guia de Uso: Sistema de Autenticação

## Para Desenvolvedores do Time

Este guia mostra como usar o sistema de autenticação refatorado seguindo as melhores práticas do Angular 20+.

---

## 1. Consumindo o AuthService em Componentes

### Exemplo: Componente de Login
```typescript
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  errorMessage = signal<string | null>(null);

  async onLogin(email: string, password: string) {
    this.errorMessage.set(null);

    try {
      // O service retorna void se sucesso, ou lança AuthError
      await this.authService.login(email, password);
      
      // Componente decide para onde navegar
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      // Erro já vem traduzido e pronto para exibir
      this.errorMessage.set(error.message);
    }
  }
}
```

### Exemplo: Verificando Autenticação
```typescript
export class ProfileComponent {
  private authService = inject(AuthService);
  
  // Signal reativo do usuário atual
  currentUser = this.authService.currentUser;
  
  // Computed signal derivado
  isAuthenticated = this.authService.isAuthenticated;
  
  // Estado de loading global
  isLoading = this.authService.isLoading;
}
```

Template:
```html
@if (currentUser()) {
  <p>Bem-vindo, {{ currentUser()!.displayName }}!</p>
} @else {
  <p>Você não está autenticado.</p>
}

<!-- Loading global -->
@if (isLoading()) {
  <div class="spinner">Carregando...</div>
}
```

---

## 2. Usando o AuthGuard nas Rotas

```typescript
import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // Protege a rota
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes'),
    canActivate: [authGuard], // Protege o módulo inteiro
  }
];
```

---

## 3. Configurando Persistência de Sessão

### Desenvolvimento (Padrão)
- Persistência: `local` (mantém login após fechar navegador)
- Timeout: Desabilitado
- Ideal para: Desenvolvimento e testes

### Produção
- Persistência: `session` (logout ao fechar navegador)
- Timeout: 30 minutos de inatividade
- Ideal para: Aplicações com dados sensíveis

**Alterar comportamento:**
```typescript
// src/app/core/auth/auth-config.ts

export const CUSTOM_AUTH_CONFIG: AuthConfig = {
  persistence: 'session',        // 'local' | 'session' | 'none'
  sessionTimeoutMinutes: 15,     // Timeout customizado
  requireEmailVerification: true, // Exigir e-mail verificado
  // ... outras configs
};
```

Aplicar no `app.config.ts`:
```typescript
import { CUSTOM_AUTH_CONFIG } from './core/auth/auth-config';

// Use CUSTOM_AUTH_CONFIG em vez de DEFAULT_AUTH_CONFIG
```

---

## 4. Tratamento de Erros (Automático)

Todos os erros do Firebase são automaticamente traduzidos:

| Código Firebase | Mensagem ao Usuário |
|----------------|---------------------|
| `auth/invalid-credential` | "E-mail ou senha incorretos." |
| `auth/email-already-in-use` | "Este e-mail já está cadastrado." |
| `auth/too-many-requests` | "Muitas tentativas. Aguarde alguns minutos..." |

**Você não precisa fazer nada!** Apenas capture o erro e exiba `error.message`.

---

## 5. Trocando de Provedor de Autenticação

Se no futuro migrar de Firebase para Supabase, AWS Cognito, etc:

### Passo 1: Criar Nova Implementação
```typescript
// supabase-auth-gateway.ts
@Injectable({ providedIn: 'root' })
export class SupabaseAuthGateway implements AuthGateway {
  // Implementar todos os métodos da interface
  async signInWithEmailAndPassword(email, password) {
    // Lógica do Supabase aqui
  }
  // ... outros métodos
}
```

### Passo 2: Atualizar Provider
```typescript
// app.config.ts
import { SupabaseAuthGateway } from './core/auth/supabase-auth-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    // Trocar de FirebaseAuthGateway para SupabaseAuthGateway
    { provide: AuthGateway, useClass: SupabaseAuthGateway },
    // ...
  ]
};
```

**Pronto!** Nenhum componente ou serviço precisa ser alterado.

---

## 6. Habilitando MFA (Multi-Factor Authentication)

### Quando Implementar
A estrutura já está pronta, mas a UI de MFA ainda não foi criada.

### Passos para Habilitar
1. Atualizar `auth-config.ts`:
   ```typescript
   enableMFA: true
   ```

2. Criar componente de verificação:
   ```typescript
   @Component({
     selector: 'app-mfa-verify',
     template: `<input [(ngModel)]="code" />`
   })
   export class MfaVerifyComponent {
     async verify(code: string) {
       await this.authService.verifyMFACode(code);
     }
   }
   ```

3. Adicionar método no `AuthService`:
   ```typescript
   async verifyMFACode(code: string): Promise<void> {
     await this.gateway.verifyMFACode(code);
   }
   ```

4. Implementar no `FirebaseAuthGateway`:
   ```typescript
   async verifyMFACode(code: string): Promise<void> {
     // Lógica do Firebase MFA
   }
   ```

---

## 7. Boas Práticas

### ✅ Faça
- Use `authService.currentUser()` para acessar o usuário atual
- Use `authService.isAuthenticated()` para verificar se está logado
- Deixe o componente decidir para onde navegar após login/logout
- Exiba `error.message` diretamente (já está traduzido)

### ❌ Não Faça
- Não chame `Firebase Auth` diretamente nos componentes
- Não crie lógica de tratamento de erro nos componentes
- Não hardcode rotas no `AuthService`
- Não use o tipo `User` do Firebase fora do `FirebaseAuthGateway`

---

## 8. Debugging

### Ver Estado Atual de Autenticação
```typescript
effect(() => {
  console.log('User:', this.authService.currentUser());
  console.log('Authenticated:', this.authService.isAuthenticated());
  console.log('Loading:', this.authService.isLoading());
});
```

### Forçar Recarga do Usuário
```typescript
await this.authService.gateway.reloadUser();
```

---

## Resumo para Novos Desenvolvedores

1. **Para autenticar:** Use `AuthService.login()`, `register()`, etc.
2. **Para verificar login:** Use `authService.isAuthenticated()`
3. **Para proteger rotas:** Use `canActivate: [authGuard]`
4. **Para tratar erros:** Apenas exiba `error.message`
5. **Para configurar:** Edite `auth-config.ts`

**Tudo está centralizado, testável e pronto para escalar!** 🚀
