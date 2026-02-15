# 🚀 Guia Rápido: Configurar Supabase no Workflow AI

## ❌ Problema Atual
O sistema está mostrando erro porque o Supabase não está configurado corretamente.

## ✅ Solução Passo a Passo

### 1. Criar Projeto Supabase
1. Acesse: https://supabase.com
2. Clique: **"Start your project"**
3. Faça login/cadastro
4. Clique: **"New project"**
5. Preencha:
   - **Name:** `Workflow AI`
   - **Database Password:** `Wanrltwaezakmi171` (sua senha)
   - **Region:** `São Paulo (South America)`

### 2. Executar Schema
1. Aguarde o projeto ser criado (2-3 minutos)
2. Vá para: **SQL Editor**
3. Abra o arquivo: `schema-clean.sql` (do seu projeto)
4. **Cole todo o conteúdo** no SQL Editor
5. Clique: **"Run"**

### 3. Obter Credenciais
1. Vá para: **Settings → API**
2. Copie:
   - **Project URL** (ex: `https://xyz123.supabase.co`)
   - **anon public** key (chave longa)

### 4. Configurar .env
```bash
# Substitua no arquivo .env:
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO-REAL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...SUA-CHAVE-REAL
```

### 5. Testar
```bash
npm run dev
# Acesse: http://localhost:3000
# Deve carregar alunos e dados reais
```

## 🎯 Resultado Esperado

Após configuração correta:
- ✅ Dashboard mostra estatísticas reais
- ✅ Página de alunos carrega 5 alunos
- ✅ Professores aparecem
- ✅ Sem erros de console

## 🔧 Se Ainda Não Funcionar

### Opção 1: Verificar Projeto
- O projeto ainda existe no dashboard?
- O schema foi executado com sucesso?

### Opção 2: Novo Projeto
- Delete o projeto atual
- Crie um novo seguindo os passos acima

### Opção 3: Suporte
- Verifique se sua conta Supabase está ativa
- Teste com outro navegador

---

## 📞 Status Atual
❌ Supabase não configurado - sistema usando dados mock

Após seguir este guia:
✅ Supabase funcionando - dados reais carregados!