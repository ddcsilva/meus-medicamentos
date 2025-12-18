# Segurança: Prevenção de User Enumeration

**Data:** 2025  
**Nível de Prioridade:** 🔴 **CRÍTICO**  
**Referência:** OWASP Authentication Cheat Sheet

---

## 🎯 O que é User Enumeration Attack?

User Enumeration é uma vulnerabilidade que permite atacantes **descobrir quais emails/usuários estão cadastrados** no sistema através de mensagens de erro diferentes.

### Exemplo de Vulnerabilidade

```typescript
// ❌ CÓDIGO VULNERÁVEL
async resetPassword(email: string) {
  const userExists = await checkUser(email);
  
  if (!userExists) {
    throw new Error('Email não encontrado'); // ⚠️ Revela que email não existe
  }
  
  await sendResetEmail(email);
  return { message: 'Email enviado' };
}
```

**Resultado:** Atacante pode testar milhares de emails e descobrir quais estão cadastrados:

```bash
# Teste automatizado
teste1@empresa.com → "Email não encontrado" ❌
joao.silva@empresa.com → "Email enviado" ✅ (usuário válido!)
maria@empresa.com → "Email enviado" ✅ (usuário válido!)
```

---

## 🚨 Por que é Perigoso?

### 1. Ataques Direcionados
Sabendo que `joao.silva@empresa.com` existe, atacantes podem:
- Fazer **ataques de força bruta** focados
- **Phishing direcionado** ("Olá João Silva, clique aqui...")
- **Social engineering** com informações reais

### 2. Vazamento de Dados
Lista de emails válidos pode ser:
- **Vendida** na dark web
- Usada para **spam direcionado**
- Correlacionada com outros **vazamentos de dados**

### 3. Violação de LGPD/GDPR
Revelar se um email está cadastrado pode ser considerado **exposição de dados pessoais**.

---

## ✅ Solução Implementada

### Código Seguro (Atual)

```typescript
// ✅ CÓDIGO SEGURO
async recoverPassword(email: string): Promise<void> {
  // Valida formato localmente (UX)
  if (!this.isValidEmailFormat(email)) {
    throw new AuthError('invalid-email', 'E-mail inválido.');
  }

  this._isLoading.set(true);
  
  try {
    // Firebase SEMPRE retorna sucesso
    // Só envia email SE o usuário existir (internamente)
    await this.gateway.sendPasswordResetEmail(email);
  } catch (error) {
    throw mapFirebaseAuthError(error);
  } finally {
    this._isLoading.set(false);
  }
}
```

### Mensagem no Frontend (Atual)

```html
<h3>Solicitação enviada!</h3>
<p>
  Se este e-mail estiver cadastrado, você receberá um link de recuperação.
  Verifique sua caixa de entrada e também a pasta de spam.
</p>
```

**Importante:** A mensagem é **genérica** e **não confirma** se o email existe.

---

## 🛡️ Proteções Implementadas

### 1. Mensagem Genérica
- ✅ Sempre retorna sucesso (HTTP 200)
- ✅ Não diferencia se email existe ou não
- ✅ Usuário legítimo recebe email normalmente

### 2. Firebase Nativo
O Firebase `sendPasswordResetEmail()` já implementa isso:
- ✅ Sempre retorna `Promise<void>` (sucesso)
- ✅ Só envia email se usuário existir (internamente)
- ✅ Zero vazamento de informação

### 3. Validação Local (UX)
Validamos apenas **formato** do email (não existência):

```typescript
private isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

Isso melhora UX **sem comprometer segurança**.

---

## 🔍 Comparação: Antes vs Depois

| Aspecto | Comportamento Vulnerável | Comportamento Seguro (Atual) |
|---------|-------------------------|------------------------------|
| **Email válido** | "Email enviado" | "Se este email existir..." |
| **Email não cadastrado** | "Email não encontrado" ❌ | "Se este email existir..." |
| **HTTP Status** | 404 (não encontrado) | 200 (sucesso) |
| **Vazamento de info** | SIM (revela existência) | NÃO |
| **Conformidade OWASP** | ❌ Vulnerável | ✅ Seguro |

---

## 📚 Referências e Padrões

### OWASP - Authentication Cheat Sheet
> "When a user requests a password reset, the application should not reveal whether a username or email exists in the system."

**Link:** [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#password-recovery)

### Firebase Documentation
> "The sendPasswordResetEmail() method always resolves successfully, even if the email does not exist."

### NIST Digital Identity Guidelines
> "Verifiers should not indicate to the claimant that the identifier is valid or invalid during the password reset process."

### CWE-204: Observable Response Discrepancy
Categoria de vulnerabilidade que inclui User Enumeration.

---

## ⚖️ Alternativa: Validar Existência (Trade-offs)

Se **for requisito de negócio** informar que o email não existe:

### Implementação com Validação

```typescript
async recoverPasswordWithValidation(email: string): Promise<void> {
  // Consulta no Firestore (custo extra)
  const userDoc = await this.firestore
    .collection('users')
    .where('email', '==', email)
    .get();
  
  if (userDoc.empty) {
    throw new AuthError(
      'email-not-found',
      'Este email não está cadastrado. Deseja criar uma conta?'
    );
  }
  
  // Envia reset
  await this.gateway.sendPasswordResetEmail(email);
}
```

### Trade-offs Dessa Abordagem

| Aspecto | Impacto |
|---------|---------|
| **UX** | ✅ Melhor (usuário sabe imediatamente) |
| **Segurança** | ❌ Vulnerável a user enumeration |
| **Performance** | ❌ Consulta extra no banco |
| **Custo** | ❌ Leituras adicionais no Firestore |
| **LGPD/GDPR** | ⚠️ Possível exposição de dados |

---

## 🎯 Recomendação Sênior

### Manter Comportamento Atual (Seguro)

**Razões:**
1. ✅ **Segurança em primeiro lugar** (OWASP best practice)
2. ✅ **Zero custo adicional** (sem consultas extras)
3. ✅ **Conformidade regulatória** (LGPD/GDPR friendly)
4. ✅ **Padrão da indústria** (Google, Facebook, GitHub fazem assim)

### Se UX for Crítica

Implementar uma das alternativas:

#### Opção 1: Sugestão de Cadastro
```html
<p>
  Email não cadastrado?
  <a routerLink="/auth/register">Criar conta grátis</a>
</p>
```

#### Opção 2: Timeout Inteligente
```typescript
// Adiciona delay proposital para dificultar automação
await new Promise(resolve => setTimeout(resolve, 2000));
```

#### Opção 3: Rate Limiting
```typescript
// Limita tentativas por IP (dificulta testes em massa)
if (attemptsFromIP > 5) {
  throw new AuthError('rate-limit', 'Muitas tentativas. Aguarde 15 minutos.');
}
```

---

## ✅ Checklist de Conformidade

### Implementado ✓
- [x] Mensagem genérica não revela se email existe
- [x] Sempre retorna HTTP 200 (sucesso)
- [x] Firebase `sendPasswordResetEmail` usado corretamente
- [x] Validação local de formato (não existência)
- [x] Documentação da decisão de segurança

### Próximos Passos (Opcional)
- [ ] Rate limiting por IP (prevenir testes em massa)
- [ ] Captcha após N tentativas
- [ ] Log de tentativas suspeitas para auditoria
- [ ] Monitoramento de padrões de uso anormal

---

## 🔐 Conclusão

A implementação atual segue **best practices internacionais de segurança** e está em conformidade com:

- ✅ OWASP Authentication Guidelines
- ✅ NIST Digital Identity Guidelines  
- ✅ Firebase Security Best Practices
- ✅ LGPD/GDPR Compliance

**Manter este comportamento é a recomendação oficial.**

Se houver pressão para "melhorar a UX" revelando se o email existe, **documente os riscos** e obtenha **aprovação formal** da liderança.

---

**Autor:** Desenvolvedor Sênior Angular  
**Revisão:** Análise de Segurança  
**Status:** ✅ **Aprovado e Implementado**
