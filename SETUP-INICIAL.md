# 🚀 Setup Inicial - Meus Medicamentos

Guia passo a passo para configurar e executar o projeto pela primeira vez.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta no Firebase
- Angular CLI 20+

## 1️⃣ Instalar Dependências

```bash
cd D:\Projetos\certo\meus-medicamentos

# Instalar dependências do frontend
npm install

# Instalar dependências das Cloud Functions
cd functions
npm install
cd ..
```

## 2️⃣ Configurar Firebase

### 2.1 Criar Projeto no Firebase Console
1. Acesse https://console.firebase.google.com
2. Crie um novo projeto
3. Ative Authentication (Email/Password e Google)
4. Ative Firestore Database
5. Ative Storage
6. Ative Hosting

### 2.2 Obter Configuração do Firebase
1. No Firebase Console, vá em Project Settings
2. Em "Your apps", adicione um app Web
3. Copie o objeto de configuração

### 2.3 Criar Arquivo de Ambiente
```bash
# Copie o arquivo de exemplo
cp src/environments/environment.example.ts src/environments/environment.ts
```

Edite `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  }
};
```

## 3️⃣ Deploy das Firestore Rules

```bash
firebase login
firebase use --add  # Selecione seu projeto

# Deploy apenas das rules
firebase deploy --only firestore:rules
```

## 4️⃣ Deploy das Cloud Functions

```bash
# Certifique-se de estar na raiz do projeto
firebase deploy --only functions
```

**Funções deployadas:**
- `setAdmin` - Define o primeiro admin
- `approveUser` - Aprova/rejeita usuários
- `onUserCreated` - Trigger automático ao criar usuário

## 5️⃣ Configurar Primeiro Admin

### Opção 1: Via Firebase Console (Cloud Functions)
1. Vá para Firebase Console → Functions
2. Localize a função `setAdmin`
3. Clique em "Test function"
4. Envie o payload:
```json
{
  "email": "seu@email.com"
}
```

### Opção 2: Via Firebase CLI
```bash
firebase functions:shell

# No shell:
setAdmin({ email: "seu@email.com" })
```

### Opção 3: Via código temporário (remover depois)
Adicione em `app.config.ts`:
```typescript
import { Functions, httpsCallable } from '@angular/fire/functions';

// NO CONSTRUCTOR ou USE Effect:
const functions = inject(Functions);
const setAdminFn = httpsCallable(functions, 'setAdmin');
setAdminFn({ email: 'seu@email.com' }).then(console.log);
```

## 6️⃣ Executar Localmente

```bash
# Terminal 1: Frontend
npm start
# ou
ng serve

# Acesse: http://localhost:4200
```

## 7️⃣ Criar Ícones do PWA (Opcional)

1. Crie uma imagem 512x512 para o ícone do app
2. Use https://realfavicongenerator.net/
3. Gere todos os tamanhos e coloque em `src/assets/icons/`

Tamanhos necessários:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

## 8️⃣ Atualizar index.html para PWA

Adicione no `<head>` de `src/index.html`:
```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#3b82f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="MedStock">
```

## 9️⃣ Habilitar Firestore Persistence

Em `src/app/app.config.ts`, encontre a configuração do Firestore e atualize:

```typescript
import { 
  provideFirestore, 
  getFirestore,
  initializeFirestore,
  persistentLocalCache 
} from '@angular/fire/firestore';

// No array providers:
provideFirestore(() => {
  const app = getApp();
  return initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
}),
```

## 🔟 Primeiro Teste

### Criar Conta de Admin
1. Acesse http://localhost:4200
2. Clique em "Criar Conta"
3. Preencha: nome, email, senha
4. **Status será "pending"**
5. Execute a função `setAdmin` (passo 5) com SEU email
6. No Firebase Console → Firestore → `users` → seu documento
7. Altere `status` para `'approved'` manualmente
8. Recarregue a página
9. Configure sua família
10. Pronto! Você é admin e pode aprovar outros usuários

### Aprovar Outros Usuários
1. Login como admin
2. Acesse `/admin/dashboard`
3. Clique em "Gerenciar Usuários Pendentes"
4. Aprove ou rejeite novos cadastros

---

## 📁 Estrutura de Pastas

```
meus-medicamentos/
├── src/
│   ├── app/
│   │   ├── core/          # Auth, guards, services core
│   │   ├── features/      # Features modulares
│   │   └── shared/        # Componentes compartilhados
│   ├── environments/      # Configurações de ambiente
│   ├── manifest.webmanifest   # PWA manifest
│   └── ngsw-config.json       # Service Worker config
├── functions/             # Cloud Functions
├── firebase.json          # Configuração Firebase
├── firestore.rules        # Security Rules
└── docs/                  # Documentação
```

---

## 🐛 Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique se deployou as Firestore Rules
- Verifique se o usuário está autenticado
- Verifique se o usuário tem `status: 'approved'`

### Erro: "User not found" ao definir admin
- Certifique-se de criar a conta primeiro
- Verifique o email exato usado no registro

### Service Worker não funciona
- Service Worker só funciona em build de produção
- Execute `ng build` e teste com http-server
- Ou teste no Firebase Hosting após deploy

### Firestore Persistence erro
- Verifique se está usando a configuração correta
- Limpe o cache do navegador
- Verifique compatibilidade do navegador

---

## 📚 Documentação Adicional

- **IMPLEMENTATION-COMPLETE.md** - Resumo completo da implementação
- **PWA-SETUP.md** - Guia detalhado do PWA
- **levantamento-requisitos.md** - Requisitos originais
- **Plano de Implementação** - Em `.cursor/plans/`

---

## ✅ Checklist de Setup

- [ ] Dependências instaladas (npm install)
- [ ] Projeto Firebase criado
- [ ] environment.ts configurado
- [ ] Firestore Rules deployadas
- [ ] Cloud Functions deployadas
- [ ] Primeiro admin configurado
- [ ] Teste de login funcionando
- [ ] Teste de aprovação funcionando
- [ ] Teste de criar família funcionando
- [ ] Teste de adicionar medicamento funcionando
- [ ] PWA manifest configurado (opcional)
- [ ] Ícones criados (opcional)

---

## 🎉 Pronto!

Seu sistema está configurado e pronto para desenvolvimento.

**Próximo passo:** Comece adicionando medicamentos e testando as funcionalidades!

**Dúvidas?** Consulte os arquivos de documentação ou a implementação nos componentes.
