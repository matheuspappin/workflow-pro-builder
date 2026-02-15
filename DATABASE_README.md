# Workflow AI - Documentação do Banco de Dados

## 📊 Visão Geral dos Modelos

O arquivo `models.py` contém o esquema completo do banco de dados para o sistema Workflow AI, implementado com SQLAlchemy.

## 🏗️ Arquitetura dos Dados

### Entidades Principais

#### 1. **User (Usuários)** - Herança com Discriminator
- **Admin**: Administradores do sistema
- **Professor**: Professores de dança
- **Aluno**: Alunos matriculados

#### 2. **Class (Turmas)**
- Turmas de dança com informações de estilo, nível e capacidade

#### 3. **Schedule (Grade Horária)**
- Horários das aulas por dia da semana

#### 4. **Session (Aulas/Sessões)**
- Instâncias reais das aulas ministradas

#### 5. **Attendance (Presenças)**
- Controle de presença dos alunos nas aulas

#### 6. **Financeiro**
- **TeacherFinance**: Pagamentos devidos aos professores
- **StudentFinance**: Mensalidades e pagamentos dos alunos

#### 7. **Gamification**
- Sistema de badges e conquistas dos alunos

#### 8. **LeadPipeline**
- Gestão de leads (alunos em potencial)

#### 9. **StudioSettings**
- Configurações globais do estúdio

## 🔗 Relacionamentos

### One-to-Many
- **User (Professor)** → **Class**: Um professor leciona múltiplas turmas
- **Class** → **Schedule**: Uma turma tem múltiplos horários
- **Class** → **Session**: Uma turma gera múltiplas sessões
- **Session** → **Attendance**: Uma sessão tem múltiplas presenças
- **User (Aluno)** → **Attendance**: Um aluno tem múltiplas presenças
- **Session** → **TeacherFinance**: Uma sessão gera um pagamento ao professor
- **User (Aluno)** → **StudentFinance**: Um aluno tem múltiplas mensalidades
- **User (Aluno)** → **Gamification**: Um aluno conquista múltiplos badges

### Many-to-Many (via tabelas intermediárias)
- **User (Aluno)** ↔ **Class** (via `Enrollment`): Alunos se matriculam em turmas

## 📋 Campos Importantes

### Campos Universais
- `id`: Chave primária autoincremental
- `created_at`: Data/hora de criação
- `updated_at`: Data/hora da última atualização

### Campos Específicos por Entidade

#### User (Todos os tipos)
- `role`: Discriminator (admin/professor/aluno)
- `name`, `email`, `phone`: Dados básicos
- `birth_date`: Data de nascimento
- `body_measurements`: JSON com medidas corporais
- `emergency_contact`, `medical_info`: Dados de emergência

#### Professor (específico)
- `hourly_rate`: Valor por hora
- `specialties`: JSON com estilos de dança
- `hire_date`: Data de contratação
- `is_available`: Disponibilidade

#### Aluno (específico)
- `enrollment_date`: Data de matrícula
- `dance_level`: Nível de dança
- `has_trial_class`: Fez aula experimental

#### Class (Turma)
- `name`: Nome da turma
- `dance_style`: Estilo (Ballet, Jazz, Hip Hop, etc.)
- `level`: Nível (Iniciante, Intermediário, Avançado)
- `max_capacity`: Capacidade máxima
- `price_per_month`: Valor mensal

#### Session (Aula)
- `scheduled_date`: Data da aula
- `actual_teacher_id`: Professor que ministrou (pode ser substituto)
- `status`: Agendada, Realizada, Cancelada, Remarcada
- `content_taught`: Conteúdo ministrado
- `attendance_count`: Número de alunos presentes

#### Attendance (Presença)
- `status`: Presente, Falta, Falta Justificada, Reposição
- `check_in_time/check_out_time`: Controle de entrada/saída

#### TeacherFinance
- `base_amount`: Valor base da aula
- `student_count`: Alunos presentes (para cálculo proporcional)
- `bonus_amount`: Bônus adicionais
- `total_amount`: Valor total devido

#### StudentFinance
- `tuition_fee`: Mensalidade
- `costume_fee`: Taxa de figurino
- `late_fee`: Multa por atraso
- `reference_month`: Mês de referência (YYYY-MM)

## ⚙️ Configurações do Estúdio

O sistema inclui configurações globais armazenadas na tabela `StudioSettings`:

- `cancellation_deadline_hours`: Tempo limite para cancelamento sem multa
- `late_fee_percentage`: Percentual da multa por atraso
- `max_absences_month`: Máximo de faltas permitidas por mês
- `trial_class_duration`: Duração da aula experimental
- `teacher_payment_rule`: Regra de pagamento (fixo ou por aluno)
- `working_hours_start/end`: Horário de funcionamento

## 🚀 Como Usar

### Opção 1: Supabase (Recomendado para Produção)

#### 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e chave anônima

#### 2. Executar Schema SQL
1. Abra o **SQL Editor** no Supabase Dashboard
2. Execute o arquivo `database/schema.sql` completo
3. Todas as tabelas serão criadas automaticamente

#### 3. Configurar no Sistema
```bash
# Em Configurações > Integrações > Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Opção 2: SQLAlchemy Local (Desenvolvimento)

#### 1. Instalação das Dependências
```bash
pip install sqlalchemy
```

#### 2. Criar o Banco de Dados Local
```python
from models import create_tables, populate_default_settings, engine, SessionLocal

# Criar tabelas
create_tables(engine)

# Popular configurações padrão
session = SessionLocal()
populate_default_settings(session)
session.close()
```

### 3. Exemplo de Uso
```python
from models import SessionLocal, Aluno, Class, Enrollment

session = SessionLocal()

# Criar um aluno
aluno = Aluno(
    name="João Silva",
    email="joao@email.com",
    phone="(11) 99999-9999",
    birth_date="2000-01-01",
    dance_level="iniciante"
)
session.add(aluno)

# Criar uma turma
turma = Class(
    name="Ballet Iniciante",
    dance_style="Ballet",
    level="iniciante",
    max_capacity=15,
    price_per_month=120.00
)
session.add(turma)

# Matricular aluno na turma
matricula = Enrollment(
    student=aluno,
    class_ref=turma,
    enrollment_date="2024-01-01"
)
session.add(matricula)

session.commit()
session.close()
```

## 📈 Funcionalidades Avançadas

### Sistema de Gamification
```python
from models import Gamification

badge = Gamification(
    student=aluno,
    badge_name="Primeira Aula",
    badge_description="Completou sua primeira aula",
    badge_category="presença",
    points_earned=10
)
session.add(badge)
```

### Controle de Presença
```python
from models import Session, Attendance, AttendanceStatus

# Registrar presença
presenca = Attendance(
    session=aula_session,
    student=aluno,
    status=AttendanceStatus.PRESENTE,
    check_in_time=datetime.now()
)
session.add(presenca)
```

### Gestão Financeira
```python
from models import StudentFinance, PaymentStatus

# Criar mensalidade
mensalidade = StudentFinance(
    student=aluno,
    reference_month="2024-01",
    tuition_fee=120.00,
    due_date="2024-01-10",
    payment_status=PaymentStatus.PENDENTE
)
session.add(mensalidade)
```

## 🔧 Manutenção

### Índices Criados
- `users_email`, `users_role`
- `classes_teacher_id`, `classes_status`
- `sessions_date`, `sessions_status`
- `enrollments_student_class`
- `payments_student_status`
- `attendances_session_student`

### Constraints
- Foreign Keys em todos os relacionamentos
- Enums para valores controlados
- Unique constraints onde necessário
- Not Null em campos obrigatórios

### Triggers
- `updated_at` automático em todas as tabelas

## 🔒 Segurança

- Validações de dados nos modelos
- Constraints de integridade referencial
- Enums para prevenir valores inválidos
- Campos de auditoria (created_at/updated_at)

## 📊 Consultas Comuns

### Alunos Ativos
```sql
SELECT * FROM alunos WHERE is_active = true;
```

### Presença por Turma
```sql
SELECT c.name, COUNT(a.*) as presentes
FROM classes c
JOIN sessions s ON c.id = s.class_id
JOIN attendances a ON s.id = a.session_id
WHERE a.status = 'presente'
GROUP BY c.id, c.name;
```

### Receita Mensal
```sql
SELECT SUM(total_amount) as receita
FROM student_finances
WHERE payment_status = 'pago'
AND reference_month = '2024-01';
```

Este modelo fornece uma base sólida e escalável para o sistema Workflow AI, suportando todas as funcionalidades solicitadas e permitindo futuras expansões.