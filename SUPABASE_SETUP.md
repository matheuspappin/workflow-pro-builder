# 🗄️ Configuração do Supabase - Workflow AI

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New project"**
3. Preencha os dados:
   - **Name**: `danceflow-ai` (ou nome desejado)
   - **Database Password**: Escolha uma senha forte
   - **Region**: Selecione a região mais próxima (ex: `São Paulo (South America)`)
4. Clique em **"Create new project"**
5. Aguarde a criação (cerca de 2-3 minutos)

### 2. Executar Schema SQL

1. No Dashboard do seu projeto, clique em **"SQL Editor"** no menu lateral esquerdo
2. Clique em **"New query"**
3. Abra o arquivo `database/schema.sql` neste repositório
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** ou pressione **Ctrl+Enter**

### 3. Verificar Criação das Tabelas

Após executar o SQL, você deve ver todas estas tabelas criadas:

#### Tabelas Principais:
- ✅ `students` - Alunos
- ✅ `teachers` - Professores
- ✅ `classes` - Turmas
- ✅ `schedules` - Grade horária
- ✅ `sessions` - Aulas ministradas
- ✅ `enrollments` - Matrículas
- ✅ `payments` - Pagamentos
- ✅ `attendance` - Presenças
- ✅ `teacher_finances` - Financeiro professores
- ✅ `student_finances` - Financeiro alunos
- ✅ `gamifications` - Sistema de badges
- ✅ `lead_pipelines` - Gestão de leads
- ✅ `studio_settings` - Configurações do estúdio

### 4. Obter Credenciais da API

1. No Dashboard do Supabase, clique em **"Settings"** no menu lateral
2. Clique em **"API"**
3. Copie as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Chave longa começando com `eyJ...`

### 5. Configurar no Sistema Workflow AI

#### Opção A: Via Interface (Recomendado)
1. Acesse seu sistema Workflow AI
2. Vá para **Configurações > Integrações**
3. Clique em **"Configurar"** no card do Supabase
4. Cole a **URL do Projeto** no campo "URL do Projeto"
5. Cole a **anon key** no campo "Chave Anônima"
6. Clique em **"Conectar"** para testar
7. Clique em **"Salvar Alterações"**

#### Opção B: Via Arquivo .env
```bash
# Edite o arquivo .env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Verificar Conexão

1. Após configurar, vá para o **Chat IA**
2. Faça uma pergunta como: *"Quantos alunos temos cadastrados?"*
3. A IA deve responder com dados reais do banco Supabase

## 📊 Dados de Exemplo Incluídos

O schema SQL inclui dados de exemplo para testes:

### Alunos de Exemplo:
- Ana Paula Rodrigues (Ballet)
- Carlos Eduardo Silva (Hip Hop)
- Lucas Oliveira (Hip Hop)
- Marina Santos (Salsa)
- Roberto Ferreira (Contemporâneo)

### Professores de Exemplo:
- Prof. Sofia Mendes (Ballet, Contemporâneo)
- Prof. Ricardo Lima (Hip Hop, Jazz)
- Prof. Carla Souza (Salsa, Jazz)

### Turmas de Exemplo:
- Ballet Adulto - Iniciante
- Hip Hop Teen
- Jazz Intermediário
- Contemporâneo Avançado

## 🔧 Funcionalidades do Schema

### Índices Otimizados
- `idx_students_status` - Busca rápida por status de alunos
- `idx_teachers_status` - Busca rápida por professores ativos
- `idx_classes_status` - Busca rápida por turmas ativas
- `idx_sessions_date` - Busca rápida por aulas por data
- E muitos outros para performance

### Constraints de Segurança
- **Foreign Keys**: Integridade referencial em todos os relacionamentos
- **Unique Constraints**: Evita duplicatas (ex: email único)
- **Check Constraints**: Valores válidos para enums
- **Not Null**: Campos obrigatórios protegidos

### Triggers Automáticos
- **updated_at**: Atualizado automaticamente em todas as tabelas
- **Timestamps UTC**: Consistência temporal global

### Configurações Padrão
O schema inclui configurações padrão do estúdio:
- `cancellation_deadline_hours`: 24h para cancelamento
- `late_fee_percentage`: 2% de multa por atraso
- `max_absences_month`: Máximo 3 faltas por mês
- `working_hours_start`: 06:00
- `working_hours_end`: 22:00

## 🧪 Testando a Integração

### 1. Teste Básico
```sql
-- Verificar se as tabelas foram criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 2. Teste de Dados
```sql
-- Ver alunos ativos
SELECT name, email, enrollment_date FROM students WHERE status = 'active';

-- Ver turmas ativas
SELECT name, dance_style, max_students FROM classes WHERE status = 'active';

-- Ver aulas de hoje
SELECT c.name as turma, s.scheduled_date, t.name as professor
FROM sessions s
JOIN classes c ON s.class_id = c.id
JOIN teachers t ON s.actual_teacher_id = t.id
WHERE s.scheduled_date = CURRENT_DATE;
```

### 3. Teste da IA
Após configurar, teste estas perguntas no Chat IA:
- "Quantos alunos temos matriculados?"
- "Qual a receita do mês atual?"
- "Quais aulas acontecem hoje?"
- "Quantos professores estão ativos?"

## 🚨 Troubleshooting

### Erro: "Tabela já existe"
- Algumas tabelas podem já existir
- Execute apenas as partes que faltam ou
- Delete o projeto e crie novamente

### Erro: "Permissões insuficientes"
- Verifique se está usando a `anon key` correta
- Para operações de escrita, pode precisar da `service_role key`

### Erro na IA: "Dados não encontrados"
- Verifique se a conexão com Supabase está funcionando
- Teste a API manualmente: `GET /api/attendance?studentId=...&classId=...`

### Performance Lenta
- Verifique se os índices foram criados corretamente
- Monitore o uso no Supabase Dashboard

## 📈 Próximos Passos

1. **Configurar Row Level Security** no Supabase para segurança adicional
2. **Implementar Real-time** para atualizações live na dashboard
3. **Configurar Backups** automáticos
4. **Adicionar Logs** de auditoria
5. **Implementar Caching** para melhor performance

## 💡 Dicas Avançadas

### Monitoramento
- Use o **Supabase Dashboard** para monitorar queries lentas
- Configure **alertas** para uso excessivo
- Monitore **Realtime metrics** para conexões ativas

### Otimização
- Use **prepared statements** para queries frequentes
- Implemente **pagination** para listas grandes
- Considere **database views** para queries complexas

### Segurança
- Nunca exponha a `service_role_key` no frontend
- Use **RLS policies** para controle de acesso granular
- Configure **CORS** apropriadamente

---

🎉 **Parabéns!** Seu banco Supabase está configurado e integrado ao Workflow AI.

O sistema agora pode fornecer respostas inteligentes baseadas em dados reais do seu estúdio de dança!