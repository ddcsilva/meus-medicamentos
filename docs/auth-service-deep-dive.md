# AuthService - Deep Dive Técnico

**Guia Completo para Desenvolvedores**

---

## 📘 Visão Geral

O `AuthService` é o **coração da feature de autenticação**, responsável por orquestrar todas as operações de autenticação através de uma abstração (`AuthGateway`), gerenciar estado reativo com Signals, e fornecer uma API limpa para os componentes.

### Localização
```
src/app/core/auth/auth.service.ts
```

### Características Principais
- ✅ **Signals-first**: Estado reativo com performance otimizada
- ✅ **Provider-agnostic**: Abstração via `AuthGateway`
- ✅ **Error handling centralizado**: Mensagens amigáveis automáticas
- ✅ **Type-safe**: TypeScript estrito
- ✅ **Testável**: Fácil mockar via interface

---

## 🏗️ Arquitetura do Service

### Diagrama de Dependências

```
┌─────────────────────────────────────┐
│      Componentes (UI Layer)         │
│   LoginComponent | RegisterComponent│
└────────────────┬────────────────────┘
                 │ injeta
                 ▼
┌─────────────────────────────────────┐
│        AuthService                  │
│  • Estado reativo (Signals)         │
│  • Orquestração de operações        │
│  • Tratamento de erros              │
└────────────────┬────────────────────┘
                 │ depende de
                 ▼
┌─────────────────────────────────────┐
│   AuthGateway (Interface)           │
│  • signInWithEmailAndPassword()     │
│  • createUserWithEmailAndPassword() │
│  • sendPasswordResetEmail()         │
└────────────────┬────────────────────┘
                 │ implementada por
                 ▼
┌─────────────────────────────────────┐
│   FirebaseAuthGateway               │
│  • Comunicação com Firebase         │
│  • Mapeamento User → AppUser        │
└─────────────────────────────────────┘
```

---

## 🔑 API Pública do Service

### Signals Expostos

#### 1. `currentUser: Signal<AppUser | null>`
Usuário autenticado atual (ou `null` se não autenticado).

**Tipo:**
```typescript
interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}
```

**Uso:**
```typescript
export class ProfileComponent {
  private authService = inject(AuthService);
  
  user = this.authService.currentUser;
  
  displayWelcome() {
    const user = this.user();
    if (user) {
      console.log(`Bem-vindo, ${user.displayName}!`);
    }
  }
}
```

**No Template:**
```html
@if (authService.currentUser(); as user) {
  <p>Olá, {{ user.displayName }}</p>
  <img [src]="user.photoURL || 'default-avatar.png'" />
} @else {
  <p>Você não está autenticado</p>
}
```

---

#### 2. `isAuthenticated: Signal<boolean>`
Computed signal que retorna `true` se há usuário autenticado.

**Uso:**
```typescript
export class HeaderComponent {
  private authService = inject(AuthService);
  
  isAuth = this.authService.isAuthenticated;
}
```

```html
@if (isAuth()) {
  <button (click)="logout()">Sair</button>
} @else {
  <a routerLink="/auth/login">Entrar</a>
}
```

---

#### 3. `isLoading: Signal<boolean>`
Indica se há alguma operação de autenticação em andamento.

**Uso:**
```typescript
// Exibir spinner global
export class AppComponent {
  authLoading = inject(AuthService).isLoading;
}
```

```html
@if (authLoading()) {
  <div class="global-spinner">Carregando...</div>
}
```

**⚠️ Importante:** Este signal é **read-only**. Você não pode alterá-lo externamente.

---

## 📖 Métodos Públicos

### 1. `login(email: string, password: string): Promise<void>`

Autentica um usuário com e-mail e senha.

**Parâmetros:**
- `email`: E-mail do usuário
- `password`: Senha do usuário

**Retorno:**
- `Promise<void>`: Resolve em sucesso, rejeita com `AuthError` em falha

**Comportamento:**
1. Define `isLoading` como `true`
2. Chama `gateway.signInWithEmailAndPassword()`
3. Em caso de erro, mapeia para `AuthError` com mensagem em português
4. Define `isLoading` como `false` (sempre, via `finally`)

**Exemplo de Uso:**
```typescript
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  errorMessage = signal<string | null>(null);

  async onLogin(email: string, password: string) {
    this.errorMessage.set(null);
    
    try {
      await this.authService.login(email, password);
      // Sucesso: o Signal currentUser() será atualizado automaticamente
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      // Erro: já vem traduzido para português
      this.errorMessage.set(error.message);
    }
  }
}
```

**Erros Possíveis:**
| Código Firebase | Mensagem em PT |
|----------------|----------------|
| `auth/invalid-credential` | "E-mail ou senha incorretos." |
| `auth/user-not-found` | "E-mail ou senha incorretos." |
| `auth/too-many-requests` | "Muitas tentativas. Aguarde..." |

---

### 2. `register(email: string, password: string, fullName: string): Promise<void>`

Cria uma nova conta de usuário.

**Parâmetros:**
- `email`: E-mail para registro
- `password`: Senha (mínimo 8 caracteres recomendado)
- `fullName`: Nome completo do usuário

**Comportamento:**
1. Cria conta no Firebase
2. Atualiza o `displayName` do usuário
3. Recarrega dados do usuário (para refletir o nome)
4. `currentUser` é atualizado automaticamente

**Exemplo:**
```typescript
async onRegister(form: FormData) {
  try {
    await this.authService.register(
      form.email,
      form.password,
      form.fullName
    );
    this.router.navigate(['/onboarding']);
  } catch (error: any) {
    this.handleRegistrationError(error);
  }
}
```

**⚠️ Nota de Segurança:**
O Firebase já valida:
- E-mail duplicado → `auth/email-already-in-use`
- Senha fraca → `auth/weak-password`

---

### 3. `logout(): Promise<void>`

Encerra a sessão do usuário atual.

**Comportamento:**
1. Chama `gateway.signOut()`
2. `currentUser` é automaticamente atualizado para `null`
3. `isAuthenticated` passa a retornar `false`

**Exemplo:**
```typescript
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  async logout() {
    const confirmed = confirm('Deseja realmente sair?');
    if (!confirmed) return;

    try {
      await this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
```

---

### 4. `recoverPassword(email: string): Promise<void>`

Envia e-mail de recuperação de senha.

**Comportamento:**
1. **Valida formato do e-mail localmente** (evita chamada desnecessária)
2. Envia e-mail via Firebase
3. Firebase envia link com token de recuperação

**Exemplo:**
```typescript
async sendRecoveryEmail(email: string) {
  try {
    await this.authService.recoverPassword(email);
    this.successMessage.set('E-mail enviado! Verifique sua caixa de entrada.');
  } catch (error: any) {
    this.errorMessage.set(error.message);
  }
}
```

**Validação Local:**
O service valida o formato do e-mail **antes** de chamar o Firebase:
```typescript
private isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Benefícios:**
- 🚀 Feedback instantâneo ao usuário
- 💰 Economiza quota do Firebase
- 📶 Funciona mesmo offline (validação básica)

---

### 5. `loginWithSocial(provider: 'google' | 'facebook' | 'apple'): Promise<void>`

Login com provedor social (OAuth).

**Parâmetros:**
- `provider`: `'google'` | `'facebook'` | `'apple'`

**Exemplo:**
```typescript
async loginWithGoogle() {
  try {
    await this.authService.loginWithSocial('google');
    this.router.navigate(['/dashboard']);
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      // Usuário fechou o popup, não exibir erro
      return;
    }
    this.errorMessage.set(error.message);
  }
}
```

**⚠️ Atenção:**
- Desktop: Usa `signInWithPopup` (melhor UX)
- Mobile: Considere `signInWithRedirect` (mais confiável)

---

### 6. `updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<void>`

Atualiza perfil do usuário autenticado.

**Exemplo:**
```typescript
async updateUserProfile(newName: string) {
  try {
    await this.authService.updateProfile({ displayName: newName });
    // currentUser() será atualizado automaticamente
    this.successMessage.set('Perfil atualizado!');
  } catch (error: any) {
    this.errorMessage.set('Falha ao atualizar perfil.');
  }
}
```

---

## 🎯 Padrões de Uso Recomendados

### ✅ Pattern 1: Reactive UI com Effects

```typescript
export class DashboardComponent {
  private authService = inject(AuthService);
  
  userName = signal('Carregando...');
  
  constructor() {
    // Effect reage automaticamente a mudanças em currentUser
    effect(() => {
      const user = this.authService.currentUser();
      this.userName.set(user?.displayName || 'Visitante');
    });
  }
}
```

---

### ✅ Pattern 2: Derivar Estado Local

```typescript
export class SettingsComponent {
  private authService = inject(AuthService);
  
  // Computed derivado do signal global
  canEditProfile = computed(() => {
    const user = this.authService.currentUser();
    return user?.emailVerified === true;
  });
}
```

---

### ✅ Pattern 3: Loading Unificado

```typescript
export class AppComponent {
  private authService = inject(AuthService);
  
  // Loading global em qualquer lugar da app
  isAuthLoading = this.authService.isLoading;
}
```

Template:
```html
<div class="app-container" [class.loading]="isAuthLoading()">
  <router-outlet />
  
  @if (isAuthLoading()) {
    <div class="backdrop-spinner">
      <mat-spinner></mat-spinner>
    </div>
  }
</div>
```

---

### ❌ Anti-Pattern: Não Chamar Firebase Diretamente

```typescript
// ❌ ERRADO
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

export class LoginComponent {
  private auth = inject(Auth); // NÃO FAÇA ISSO
  
  async login() {
    await signInWithEmailAndPassword(this.auth, email, password);
  }
}

// ✅ CORRETO
export class LoginComponent {
  private authService = inject(AuthService);
  
  async login() {
    await this.authService.login(email, password);
  }
}
```

**Por quê?**
- Quebra a abstração
- Duplica lógica de loading/erro
- Dificulta testes
- Impede migração de provedor

---

## 🧪 Testando o AuthService

### Setup de Teste

```typescript
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthGateway } from './auth-gateway.interface';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let mockGateway: jasmine.SpyObj<AuthGateway>;

  beforeEach(() => {
    // Mock da interface AuthGateway
    mockGateway = jasmine.createSpyObj('AuthGateway', [
      'signInWithEmailAndPassword',
      'createUserWithEmailAndPassword',
      'signOut',
      'sendPasswordResetEmail'
    ]);
    
    // authState$ precisa retornar Observable
    mockGateway.authState$ = of(null);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: FirebaseAuthGateway, useValue: mockGateway }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  it('deve chamar gateway ao fazer login', async () => {
    const email = 'test@test.com';
    const password = '123456';

    mockGateway.signInWithEmailAndPassword.and.returnValue(Promise.resolve());

    await service.login(email, password);

    expect(mockGateway.signInWithEmailAndPassword).toHaveBeenCalledWith(email, password);
  });

  it('deve mapear erro ao falhar login', async () => {
    const firebaseError = { code: 'auth/invalid-credential' };
    mockGateway.signInWithEmailAndPassword.and.returnValue(Promise.reject(firebaseError));

    try {
      await service.login('test@test.com', 'wrong');
      fail('Deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('E-mail ou senha incorretos.');
    }
  });

  it('isAuthenticated deve retornar false quando não há usuário', () => {
    expect(service.isAuthenticated()).toBe(false);
  });
});
```

---

## 🔐 Considerações de Segurança

### 1. Não Expor Informações Sensíveis
```typescript
// ❌ ERRADO
console.log('Senha:', password); // NUNCA faça isso

// ✅ CORRETO
console.log('Tentativa de login para:', email); // OK
```

### 2. Rate Limiting
O `isLoading` signal ajuda a prevenir double-submit:

```typescript
async onSubmit() {
  if (this.authService.isLoading()) {
    return; // Ignora se já está processando
  }
  await this.authService.login(email, password);
}
```

### 3. Validação no Frontend ≠ Segurança
A validação de formato de e-mail no service é **apenas UX**. A segurança real está no backend (Firebase).

---

## 📊 Performance

### Otimizações Implementadas

1. **Signals Change Detection**
   - Apenas componentes que consomem `currentUser()` são atualizados
   - `OnPush` strategy funciona automaticamente

2. **Validação Local de E-mail**
   - Evita chamadas desnecessárias ao Firebase
   - Feedback instantâneo

3. **Read-only Signals**
   - `isLoading.asReadonly()` previne mutações acidentais
   - Garante fluxo unidirecional de dados

---

## 🎓 Conclusão

O `AuthService` é um exemplo de **arquitetura limpa e testável**, seguindo princípios SOLID e utilizando as features mais modernas do Angular 20+.

### Principais Takeaways:
✅ Use sempre o service, nunca chame Firebase diretamente  
✅ Consuma Signals reativos (`currentUser`, `isAuthenticated`, `isLoading`)  
✅ Não precisa tratar erros manualmente (já vêm traduzidos)  
✅ O service é facilmente mockável para testes  

---

**Última Atualização:** 2025  
**Versão do Angular:** 20+  
**Autor:** Time de Arquitetura
