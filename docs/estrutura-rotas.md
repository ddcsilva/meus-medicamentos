# Estrutura de Rotas - MedStock

**Arquitetura:** Feature-Based com Lazy Loading  
**Angular:** 20+  
**Padrão:** Standalone Components

---

## 📋 Estrutura Atual

```
/ (raiz)
├── → redireciona para /auth
│
├── /auth (AuthLayout - Público)
│   ├── /login
│   ├── /register
│   └── /reset-password
│
└── /app (MainLayout - Autenticado)
    └── /dashboard
```

---

## 🎯 Como Funciona

### 1. Rota Raiz (`/`)

```typescript
{
  path: '',
  redirectTo: 'auth',
  pathMatch: 'full'
}
```

**Comportamento:**
- Usuário acessa `http://localhost:4200/`
- É redirecionado para `/auth`
- Que redireciona para `/auth/login`

---

### 2. Rotas de Autenticação (`/auth/*`)

```typescript
{
  path: 'auth',
  component: AuthLayout,  // Layout sem sidebar
  children: [...]
}
```

**Características:**
- ✅ Layout limpo (sem sidebar/header)
- ✅ Rotas públicas (sem authGuard)
- ✅ Lazy loading de componentes
- ✅ Títulos customizados

**Rotas disponíveis:**
- `/auth/login` → LoginComponent
- `/auth/register` → RegisterComponent
- `/auth/reset-password` → ResetPasswordComponent

---

### 3. Rotas Autenticadas (`/app/*`)

```typescript
{
  path: 'app',
  component: MainLayout,  // Layout com sidebar + header
  canActivate: [authGuard],  // 🔒 Protegido
  children: [...]
}
```

**Características:**
- 🔒 Protegido por `authGuard`
- ✅ Layout completo (sidebar + header)
- ✅ Lazy loading de features
- ✅ Redireciona para login se não autenticado

**Rotas disponíveis:**
- `/app/dashboard` → Dashboard

---

## 🔒 Proteção com AuthGuard

### Como Funciona

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // Preserva URL de destino
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  return true;
};
```

### Fluxo de Proteção

**Cenário 1: Usuário não autenticado tenta acessar `/app/dashboard`**
```
1. authGuard detecta que não está autenticado
2. Redireciona para /auth/login?returnUrl=/app/dashboard
3. Após login, volta para /app/dashboard automaticamente
```

**Cenário 2: Usuário autenticado acessa `/app/dashboard`**
```
1. authGuard detecta que está autenticado
2. Permite acesso
3. Renderiza MainLayout + Dashboard
```

---

## ➕ Como Adicionar Novas Features

### Exemplo: Adicionar Feature de Medicamentos

#### 1. Crie a estrutura da feature

```
src/app/features/medicamentos/
├── medicamentos.ts           # Componente principal
├── medicamentos.html
├── medicamentos.css
└── pages/
    ├── lista/
    ├── cadastro/
    └── detalhes/
```

#### 2. Adicione a rota em `app.routes.ts`

```typescript
{
  path: 'app',
  component: MainLayout,
  canActivate: [authGuard],
  children: [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    },
    {
      path: 'dashboard',
      loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
      title: 'MedStock - Dashboard'
    },
    // ✅ Nova feature
    {
      path: 'medicamentos',
      loadComponent: () => import('./features/medicamentos/medicamentos').then(m => m.MedicamentosComponent),
      title: 'MedStock - Medicamentos'
    },
  ]
}
```

#### 3. Adicione link no Sidebar

Em `src/app/core/layout/components/sidebar/sidebar.html`:

```html
<a 
  routerLink="/app/medicamentos" 
  routerLinkActive="active"
  class="menu-item"
>
  <svg>...</svg>
  Medicamentos
</a>
```

---

## 📁 Padrão de Nomenclatura

### Rotas Públicas (sem guard)
```typescript
{
  path: 'nome-feature',
  component: AuthLayout,
  children: [...]
}
```

### Rotas Protegidas (com guard)
```typescript
{
  path: 'app',
  component: MainLayout,
  canActivate: [authGuard],
  children: [
    {
      path: 'nome-feature',
      loadComponent: () => import('...'),
      title: 'MedStock - Nome da Feature'
    }
  ]
}
```

---

## 🎨 Layouts Disponíveis

### 1. AuthLayout

**Arquivo:** `src/app/features/auth/layout/auth-layout/auth-layout.ts`

**Uso:** Rotas de autenticação (login, registro, recuperação)

**Características:**
- Layout limpo e centrado
- Sem sidebar/header
- Background com gradiente
- Logo da aplicação

**Quando usar:**
- Telas de login, registro, recuperação de senha
- Telas públicas que não requerem autenticação

---

### 2. MainLayout

**Arquivo:** `src/app/core/layout/main-layout/main-layout.ts`

**Uso:** Rotas autenticadas (dashboard, features)

**Características:**
- Sidebar responsiva (toggle)
- Header com informações do usuário
- Área de conteúdo com padding
- Footer

**Quando usar:**
- Todas as features autenticadas
- Dashboard e páginas internas

---

## 🧪 Testando as Rotas

### 1. Rota Raiz

```bash
# Acesse
http://localhost:4200/

# Deve redirecionar para
http://localhost:4200/auth/login
```

### 2. Login e Redirecionamento

```bash
# 1. Tente acessar rota protegida sem login
http://localhost:4200/app/dashboard

# 2. Será redirecionado para
http://localhost:4200/auth/login?returnUrl=/app/dashboard

# 3. Faça login

# 4. Será redirecionado automaticamente para
http://localhost:4200/app/dashboard
```

### 3. Navegação entre Features

```bash
# Acesse o dashboard
http://localhost:4200/app/dashboard

# Clique em um link do sidebar
# → Deve navegar sem recarregar a página (SPA)
```

---

## 🚀 Próximas Features Sugeridas

### Curto Prazo

1. **Medicamentos** (`/app/medicamentos`)
   - Lista de medicamentos
   - Cadastro de novo medicamento
   - Detalhes do medicamento

2. **Estoque** (`/app/estoque`)
   - Visão geral do estoque
   - Alertas de estoque baixo
   - Histórico de movimentações

3. **Perfil** (`/app/perfil`)
   - Dados do usuário
   - Alterar senha
   - Preferências

### Médio Prazo

4. **Relatórios** (`/app/relatorios`)
   - Relatório de consumo
   - Relatório de vencimentos
   - Exportação de dados

5. **Configurações** (`/app/configuracoes`)
   - Configurações gerais
   - Integrações
   - Notificações

---

## ⚙️ Configurações Avançadas

### Adicionar Guard de Permissão

```typescript
// role.guard.ts
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const requiredRole = route.data['role'];
  const userRole = authService.currentUser()?.role;
  
  return userRole === requiredRole;
};

// Uso
{
  path: 'admin',
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
}
```

### Adicionar Resolver para Dados

```typescript
// medicamento.resolver.ts
export const medicamentoResolver: ResolveFn<Medicamento> = (route) => {
  const service = inject(MedicamentosService);
  const id = route.params['id'];
  return service.getById(id);
};

// Uso
{
  path: 'medicamentos/:id',
  resolve: { medicamento: medicamentoResolver },
  loadComponent: () => import('...')
}
```

---

## ✅ Checklist de Implementação

### Rotas Básicas
- [x] Rota raiz configurada
- [x] Rotas de autenticação (`/auth/*`)
- [x] Rotas autenticadas (`/app/*`)
- [x] AuthGuard implementado
- [x] Lazy loading funcionando

### Layouts
- [x] AuthLayout para rotas públicas
- [x] MainLayout para rotas autenticadas
- [x] Sidebar responsiva
- [x] Header com informações do usuário

### Navegação
- [x] ReturnUrl funcionando
- [x] Redirecionamentos corretos
- [x] Links no sidebar
- [x] Títulos de página

---

## 📚 Referências

- [Angular Routing Guide](https://angular.dev/guide/routing)
- [Lazy Loading](https://angular.dev/guide/ngmodules/lazy-loading-ngmodules)
- [Route Guards](https://angular.dev/guide/router#preventing-unauthorized-access)
- [Feature-Based Architecture](https://angular.dev/guide/architecture)

---

**Status:** ✅ **Estrutura de rotas completa e funcional!**
