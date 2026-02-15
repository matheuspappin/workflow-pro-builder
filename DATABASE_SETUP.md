# 🗄️ Configuração do Banco de Dados - Workflow AI

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Node.js instalado
- Credenciais do Supabase (URL e chave anônima)

## 🚀 Guia de Configuração Passo a Passo

### 1. **Criar Projeto no Supabase**

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New project"**
3. Configure:
   - **Name**: `danceflow-ai`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima (ex: São Paulo)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos até a criação

### 2. **Executar Schema SQL**

1. No Dashboard do Supabase, clique em **"SQL Editor"**
2. Clique em **"New query"**
3. Abra o arquivo `database/schema.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **"Run"** ou pressione **Ctrl+Enter**

### 3. **Obter Credenciais**

1. No menu lateral, clique em **"Settings"**
2. Clique em **"API"**
3. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon/public key** (chave longa começando com `eyJ...`)

### 4. **Configurar no Sistema**

#### **Arquivo .env**
```bash
# Edite o arquivo .env na raiz do projeto
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### **Testar Conexão**
```bash
# Testar se as credenciais estão corretas
npm run db:test
```

### 5. **Inicializar Banco de Dados**

```bash
# Executar inicialização completa
npm run db:init
```

Este comando irá:
- ✅ Verificar conexão com Supabase
- ✅ Confirmar que todas as tabelas existem
- ✅ Inserir dados de exemplo (alunos, professores, turmas)

## 📊 Estrutura do Banco Criada

### **Tabelas Principais**
- `students` - Alunos e suas informações
- `teachers` - Professores e especialidades
- `classes` - Turmas oferecidas
- `schedules` - Horários das aulas
- `sessions` - Sessões/aulas realizadas
- `enrollments` - Matrículas de alunos
- `attendance` - Controle de presença
- `payments` - Pagamentos e mensalidades
- `teacher_finances` - Financeiro dos professores
- `student_finances` - Financeiro dos alunos
- `gamifications` - Sistema de conquistas
- `lead_pipelines` - Gestão de leads
- `studio_settings` - Configurações do estúdio

### **Dados de Exemplo Inseridos**
- 5 alunos ativos
- 4 professores especializados
- 4 turmas diferentes
- Matrículas e pagamentos de exemplo

## 🔧 Scripts Disponíveis

### **Teste de Conexão**
```bash
npm run db:test
# ✅ Conexão estabelecida com sucesso!
```

### **Inicialização Completa**
```bash
npm run db:init
# 1️⃣ Testando conexão...
# 2️⃣ Verificando tabelas...
# 3️⃣ Inicializando dados...
# 🎉 Banco inicializado com sucesso!
```

### **Popular com Dados de Exemplo**
```bash
npm run db:seed
# ✅ Seed completado
```

## 📱 Como Usar no Sistema

### **Conectar APIs ao Banco**

O sistema já está configurado para usar o Supabase automaticamente quando as credenciais estão presentes.

#### **APIs que usam o banco:**
- `/api/chat` - Busca dados reais para respostas da IA
- `/api/gemini` - Mesmo comportamento
- `/api/attendance` - Registra presenças/faltas
- Páginas do dashboard - Exibem dados reais

#### **Funcionalidades que salvam no banco:**
- Cadastro de alunos e professores
- Registro de aulas e presenças
- Controle financeiro
- Gamificação
- Configurações do estúdio

### **Monitoramento**

Acesse o **Supabase Dashboard > Reports** para:
- 📊 Ver queries executadas
- ⚡ Monitorar performance
- 🔍 Analisar logs
- 📈 Ver estatísticas de uso

## 🚨 Troubleshooting

### **Erro: "Tabela não existe"**
```bash
# Execute o schema novamente
# Verifique se não há erros de sintaxe no SQL
```

### **Erro: "Credenciais inválidas"**
```bash
# Verifique se o .env tem as chaves corretas
# Confirme se o projeto Supabase está ativo
# Teste com: npm run db:test
```

### **Erro: "Permissões insuficientes"**
```bash
# Use a chave 'anon' (não 'service_role')
# Verifique RLS policies no Supabase se necessário
```

### **Performance Lenta**
```bash
# Adicione índices se necessário
# Use paginação em queries grandes
# Monitore no Supabase Dashboard
```

## 🔒 Segurança

### **Row Level Security (RLS)**
O Supabase inclui RLS por padrão. Configure policies para:
- Alunos só veem seus próprios dados
- Professores acessam suas turmas
- Admins têm acesso completo

### **Chaves de API**
- Nunca exponha `service_role_key` no frontend
- Use apenas `anon_key` para operações do usuário
- Configure CORS apropriadamente

## 📈 Próximos Passos

### **Otimização**
- [ ] Configurar RLS policies
- [ ] Adicionar índices para queries frequentes
- [ ] Implementar cache Redis se necessário
- [ ] Configurar backups automáticos

### **Funcionalidades Avançadas**
- [ ] Triggers para notificações automáticas
- [ ] Functions Edge para processamento serverless
- [ ] Realtime subscriptions para updates live
- [ ] Analytics avançado

### **Monitoramento**
- [ ] Alertas de uso excessivo
- [ ] Logs detalhados de auditoria
- [ ] Métricas de performance
- [ ] Backup automático

---

## 🎯 **Resultado Final**

Seu **Workflow AI** agora tem:

- ✅ **Banco PostgreSQL robusto** no Supabase
- ✅ **Dados persistentes** e seguros
- ✅ **APIs funcionais** salvando no banco
- ✅ **Dashboard live** com dados reais
- ✅ **IA inteligente** alimentada por dados atuais

**🎉 Pronto! O sistema está completamente integrado ao Supabase!**