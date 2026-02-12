# 🐘 Conexão Direta PostgreSQL

Este projeto agora suporta **conexão direta com PostgreSQL** usando o pacote `postgres` para operações avançadas e de alta performance.

## 📦 Instalação

O pacote `postgres` já está instalado e configurado.

## ⚙️ Configuração

### 1. Arquivo `.env`

Adicione sua `DATABASE_URL` no arquivo `.env`:

```bash
# Conexão direta PostgreSQL (para scripts avançados)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 2. Como Obter a DATABASE_URL

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para: **Settings → Database**
4. Copie a **Connection string** (URI)
5. Substitua `[YOUR-PASSWORD]` pela sua senha

## 🚀 Uso Básico

### Importar a conexão:

```javascript
import sql from './db.js'
```

### Executar queries:

```javascript
// SELECT
const users = await sql`SELECT * FROM users WHERE active = ${true}`

// INSERT
const newUser = await sql`
  INSERT INTO users (name, email)
  VALUES (${name}, ${email})
  RETURNING id
`

// UPDATE
await sql`
  UPDATE users
  SET last_login = NOW()
  WHERE id = ${userId}
`

// DELETE
await sql`DELETE FROM users WHERE id = ${userId}`
```

### Sempre fechar a conexão:

```javascript
// No final do script
await sql.end()
```

## 🧪 Testar Conexão

Execute o teste automático:

```bash
npm run db:test-postgres
```

Ou teste manualmente:

```javascript
import sql from './db.js'

const result = await sql`SELECT COUNT(*) FROM students`
console.log('Alunos:', result[0].count)

await sql.end()
```

## 🔄 Quando Usar

### ✅ Use PostgreSQL Direto para:
- Scripts de migração
- Operações em lote (bulk operations)
- Queries complexas com JOINs avançados
- Análise de dados e relatórios
- Operações de manutenção do banco

### ✅ Use Supabase SDK para:
- Operações CRUD no app Next.js
- Autenticação e autorização
- Real-time subscriptions
- Storage e Edge Functions

## 📊 Exemplos Práticos

### Contar registros por tabela:

```javascript
import sql from './db.js'

async function getTableCounts() {
  const tables = ['students', 'teachers', 'classes', 'sessions']

  for (const table of tables) {
    const result = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`
    console.log(`${table}: ${result[0].count} registros`)
  }

  await sql.end()
}
```

### Buscar alunos com turmas:

```javascript
import sql from './db.js'

async function getStudentsWithClasses() {
  const students = await sql`
    SELECT
      s.name,
      s.email,
      c.name as class_name,
      c.dance_style
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    JOIN classes c ON e.class_id = c.id
    WHERE s.status = 'active'
    ORDER BY s.name
  `

  console.log('Alunos matriculados:', students)
  await sql.end()
}
```

## 🔒 Segurança

- Nunca commite a `DATABASE_URL` no Git
- Use variáveis de ambiente
- Feche sempre as conexões com `sql.end()`
- Use prepared statements (automático com template literals)

## 🎯 Performance

- Conexões são **reutilizadas** automaticamente
- **Connection pooling** embutido
- **Queries preparadas** para performance
- **Transações** suportadas

---

## 🚀 Pronto para Uso!

Sua configuração PostgreSQL direta está **100% funcional**! 🎉

Use `npm run db:test-postgres` para verificar se tudo está funcionando.