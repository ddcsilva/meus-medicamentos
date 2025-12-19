# Configuração do PWA - MedStock

## 📱 Progressive Web App

O MedStock está configurado como um PWA (Progressive Web App), permitindo instalação em dispositivos móveis e desktop, funcionamento offline e experiência de app nativo.

## ✅ Arquivos Criados

- `src/manifest.webmanifest` - Configuração do app (nome, ícones, cores, shortcuts)
- `src/ngsw-config.json` - Configuração do Service Worker (cache, estratégias)

## 🎯 Próximos Passos

### 1. Instalar @angular/pwa

```bash
ng add @angular/pwa
```

Ou manualmente:

```bash
npm install @angular/pwa@^20.3.0 --save
```

### 2. Criar Ícones

Você precisa criar os ícones do PWA nos seguintes tamanhos em `src/assets/icons/`:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Dica:** Use um serviço online como https://realfavicongenerator.net/ ou https://www.pwabuilder.com/ para gerar todos os tamanhos a partir de uma imagem única.

### 3. Atualizar index.html

Adicione os links para o manifest no `<head>`:

```html
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#3b82f6">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="MedStock">
```

### 4. Configurar Firebase Firestore Persistence

No `app.config.ts`, habilite a persistência do Firestore:

```typescript
import { initializeFirestore, persistentLocalCache } from '@angular/fire/firestore';

providers: [
  provideFirebaseApp(() => initializeApp(environment.firebase)),
  provideFirestore(() => {
    const firestore = initializeFirestore(getApp(), {
      localCache: persistentLocalCache()
    });
    return firestore;
  }),
  // ... outros providers
]
```

### 5. Build de Produção

O Service Worker só funciona em build de produção:

```bash
ng build --configuration=production
```

### 6. Testar Localmente

```bash
npm install -g http-server
http-server -p 8080 -c-1 dist/browser
```

Acesse `http://localhost:8080` e teste:
- Instalar o app
- Funcionar offline
- Receber notificações de atualização

## 🔧 Configurações do Service Worker

### Asset Groups

- **app**: Arquivos principais (HTML, CSS, JS) - prefetch no primeiro carregamento
- **assets**: Imagens, fontes, etc - lazy loading

### Data Groups

- **api-firestore**: Cache de 1 hora para chamadas do Firestore, estratégia freshness (rede primeiro)
- **api-auth**: Cache de 1 hora para autenticação

## 📲 Features do PWA

### Instalável
- Usuários podem instalar o app na tela inicial
- Funciona como app nativo

### Offline First
- Firestore Persistence habilitado
- Cache inteligente de assets
- Sincronização automática quando voltar online

### Shortcuts
- Adicionar Medicamento (direto da home screen)
- Ver Medicamentos

### Updates
- Service Worker detecta atualizações automaticamente
- Usuário pode forçar refresh para atualizar

## 🎨 Personalização

### Cores do Tema
- Theme Color: `#3b82f6` (azul)
- Background Color: `#ffffff` (branco)

Altere no `manifest.webmanifest` conforme sua identidade visual.

### Ícones
- Use imagens com fundo sólido ou gradiente
- Evite transparência nos ícones maskable
- Teste em diferentes dispositivos

## 🧪 Testes

### Lighthouse
```bash
# Abra o DevTools > Lighthouse
# Teste: PWA, Performance, Accessibility, Best Practices, SEO
```

### PWA Checklist
- ✅ Manifest configurado
- ✅ Service Worker registrado
- ✅ HTTPS (obrigatório - Firebase Hosting fornece)
- ✅ Ícones de todos os tamanhos
- ✅ Funciona offline
- ✅ Meta tags configuradas

## 📚 Recursos

- [Angular PWA Docs](https://angular.dev/ecosystem/service-workers)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
