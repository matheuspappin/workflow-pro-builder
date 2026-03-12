# Fire Control — Verticalização

**Nicho:** `fire_protection`  
**Modelo de Negócio:** MONETARY (SaaS multi-tenant white-label)  
**Status:** Ativo

---

## Visão Geral

O **Fire Control** é uma verticalização completa para empresas de segurança contra incêndio. Permite que cada empresa (tenant) gerencie clientes, técnicos, engenheiros, extintores, vistorias, projetos PPCI e o ciclo financeiro, tudo em um sistema white-label hospedado na plataforma akaaicore.

---

## Rotas Principais

| Ambiente | Rota |
|---|---|
| Pre-page (splash) | `/solutions/fire-protection` |
| Landing Page | `/solutions/fire-protection/landing` |
| Login | `/solutions/fire-protection/login` |
| Registro de empresa | `/solutions/fire-protection/register` |
| Dashboard (admin/gestor) | `/solutions/fire-protection/dashboard` |
| Portal do Engenheiro | `/solutions/fire-protection/engineer` |
| Portal do Arquiteto | `/solutions/fire-protection/architect` |
| Portal do Técnico | `/solutions/fire-protection/technician` |
| Portal do Cliente | `/solutions/fire-protection/client` |
| Admin interno (super admin) | `/admin/verticalizations/fire-protection` |

---

## Roles de Usuário

| Role | Descrição | Portal de acesso |
|---|---|---|
| `admin` / gestor interno | Dono ou gestor da empresa | `/dashboard` |
| `engineer` | Engenheiro responsável por projetos PPCI | `/engineer` |
| `architect` | Arquiteto vinculado a projetos | `/architect` |
| `technician` / `teacher` | Técnico de campo — executa OS e vistorias | `/technician` |
| `student` | Cliente final (edificação) | `/client` |

> Super admins da plataforma são redirecionados automaticamente para `/admin` e não têm acesso ao painel da verticalização.

---

## Módulos e Funcionalidades

### Operacional

| Módulo | Chave | Descrição |
|---|---|---|
| Dashboard | `dashboard` | Visão geral com KPIs da empresa |
| Clientes / Edificações | `students` | Cadastro e gestão de clientes e seus imóveis |
| Técnicos | `classes` | Gerenciamento de técnicos de campo |
| Engenheiros | `service_orders` | Cadastro e acompanhamento de engenheiros |
| Arquitetos | `service_orders` | Cadastro e acompanhamento de arquitetos |
| Ordens de Serviço | `service_orders` | Criação, atribuição e ciclo de vida das OS |
| Extintores | `inventory` | Cadastro de ativos (extintores) com QR Code, número de série, validade, pressão, agente extintor |
| Vistorias | `service_orders` | Agendamento e execução de vistorias com checklist de conformidade |

### Comercial

| Módulo | Chave | Descrição |
|---|---|---|
| PDV — Vendas | `pos` | Ponto de venda integrado com catálogo de produtos e serviços |
| Portal do Vendedor | `pos` | Visão do vendedor: OS pendentes, comissões, histórico |
| Leads / CRM | `leads` | Captação e qualificação de leads |
| WhatsApp | `whatsapp` | Integração com WhatsApp para atendimento e notificações |
| Chat IA | `ai_chat` | Assistente de IA integrado ao dashboard |

### Gestão

| Módulo | Chave | Descrição |
|---|---|---|
| Projetos PPCI | `service_orders` | Gestão completa de projetos de Prevenção e Proteção Contra Incêndio |
| Financeiro | `financial` | Controle de receitas, pagamentos e fluxo de caixa |
| Relatórios | — | Relatórios operacionais e AVCB, validades e alertas |
| Configurações | `settings` | Configurações da empresa no sistema |

---

## Portal do Técnico de Campo

O técnico possui um portal dedicado com as seguintes funcionalidades:

- **Minhas OS** — lista e detalhes das ordens de serviço atribuídas
- **Scanner de QR Code** — leitura do QR Code do extintor para vistoria rápida
- **Inspeção de extintores** — registro de status: `ok`, `needs_recharge`, `defective`, `replaced`
- **Retirada e entrega** — controle de extintores retirados para recarga com data/hora e observações

---

## Portal do Cliente

Clientes acessam via código de convite ou link direto e têm acesso a:

- Visualização dos seus extintores cadastrados com status e validades
- Histórico de vistorias realizadas
- Documentos e laudos
- Solicitação de novas vistorias

---

## Extintores (Assets)

Campos específicos para extintores gerenciados na tabela `assets`:

| Campo | Tipo | Descrição |
|---|---|---|
| `qr_code` | `VARCHAR(255)` | Código QR único por extintor |
| `serial_number` | `VARCHAR(100)` | Número de série |
| `capacity` | `VARCHAR(50)` | Capacidade (ex: 4kg, 6kg, 12kg) |
| `agent_type` | `VARCHAR(50)` | Agente extintor: PQS, CO2, Água, etc. |
| `manufacture_date` | `DATE` | Data de fabricação |
| `pressure_status` | `VARCHAR(20)` | Status da pressão: `ok`, `low`, `empty` |
| `last_inspection_at` | `TIMESTAMPTZ` | Data da última vistoria |
| `next_inspection_due` | `TIMESTAMPTZ` | Data da próxima vistoria prevista |

---

## Ordens de Serviço — Campos Específicos

Campos adicionados à tabela `service_orders` para o Fire Control:

| Campo | Tipo | Descrição |
|---|---|---|
| `vistoria_type` | `VARCHAR(100)` | Tipo da vistoria |
| `conformidade_score` | `INTEGER (0–100)` | Score de conformidade da vistoria |
| `priority` | `VARCHAR(20)` | Prioridade: `normal`, `alta`, `urgente` |
| `laudo_url` | `TEXT` | URL do laudo gerado |
| `seller_id` | `UUID` | Vendedor responsável (PDV) |
| `payment_method` | `VARCHAR(50)` | Método de pagamento |
| `payment_status` | `VARCHAR(20)` | Status: `pending`, `paid`, `partial`, `cancelled` |
| `paid_at` | `TIMESTAMPTZ` | Data/hora do pagamento |
| `discount_amount` | `DECIMAL` | Valor de desconto aplicado |
| `amount_paid` | `DECIMAL` | Valor pago |
| `change_amount` | `DECIMAL` | Troco |
| `retirada_at` | `TIMESTAMPTZ` | Data/hora de retirada dos extintores |
| `retirada_notes` | `TEXT` | Observações da retirada |
| `entrega_at` | `TIMESTAMPTZ` | Data/hora de entrega dos extintores |
| `asset_ids` | `UUID[]` | IDs dos extintores vinculados à OS |
| `finished_at` | `TIMESTAMPTZ` | Data/hora de conclusão pelo técnico |

Status adicional no ENUM `service_order_status`: `nao_conforme`

---

## Tabelas do Banco de Dados

### `asset_inspections` — Histórico de Inspeções

Criada pela migration 54 para registrar cada inspeção individual de um extintor:

```sql
CREATE TABLE asset_inspections (
  id                 UUID PRIMARY KEY,
  studio_id          UUID REFERENCES studios(id),
  asset_id           UUID REFERENCES assets(id),
  professional_id    UUID REFERENCES professionals(id),
  inspected_at       TIMESTAMPTZ,
  status             VARCHAR(20),  -- ok | needs_recharge | defective | replaced
  notes              TEXT,
  conformidade_score INTEGER,
  service_order_id   UUID REFERENCES service_orders(id),
  created_at         TIMESTAMPTZ
);
```

### `fire_protection_production_config` — Capacidade de Produção

Criada pela migration 58 para configurar a capacidade de recarga por empresa:

```sql
CREATE TABLE fire_protection_production_config (
  id                      UUID PRIMARY KEY,
  studio_id               UUID UNIQUE REFERENCES studios(id),
  extintores_por_dia      INTEGER DEFAULT 20,
  lead_time_minimo_dias   INTEGER DEFAULT 1,
  created_at              TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ
);
```

> Padrão quando não configurado: **20 extintores/dia**, lead time de **1 dia**.

Cada profissional também pode ter capacidade individual via campo `extintores_por_dia` na tabela `professionals`.

---

## Migrations

| Migration | Arquivo | Descrição |
|---|---|---|
| 52 | `52_fire_protection_fields.sql` | Campos de vistoria/OS, score de conformidade, prioridade, laudo, RLS |
| 53 | `53_pdv_fire_protection.sql` | Campos de PDV (vendedor, pagamento, desconto, troco), categorias em produtos e serviços |
| 54 | `54_fire_protection_assets_and_tracking.sql` | Campos de rastreamento de extintores (QR Code, série, pressão, validades), tabela `asset_inspections`, RLS para técnico e cliente |
| 58 | `58_fire_protection_production_config.sql` | Tabela `fire_protection_production_config`, capacidade individual por técnico |

---

## API Routes

### Gestão (Admin/Gestor)

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/fire-protection/customers` | Listar / criar clientes |
| GET/PATCH/DELETE | `/api/fire-protection/customers/[id]` | Detalhe, editar, excluir cliente |
| GET/POST | `/api/fire-protection/technicians` | Listar / criar técnicos |
| GET/PATCH/DELETE | `/api/fire-protection/technicians/[id]` | Detalhe, editar, excluir técnico |
| GET/POST | `/api/fire-protection/os` | Listar / criar ordens de serviço |
| GET/PATCH/DELETE | `/api/fire-protection/os/[id]` | Detalhe, editar, excluir OS |
| GET/POST | `/api/fire-protection/vistorias` | Listar / criar vistorias |
| GET/PATCH/DELETE | `/api/fire-protection/vistorias/[id]` | Detalhe, editar, excluir vistoria |
| GET/POST | `/api/fire-protection/assets` | Listar / criar extintores |
| POST | `/api/fire-protection/assets/bulk` | Criar extintores em lote |
| GET/POST | `/api/fire-protection/leads` | Listar / criar leads |
| GET/POST | `/api/fire-protection/financeiro` | Dados financeiros |
| GET | `/api/fire-protection/catalog` | Catálogo de produtos e serviços (PDV) |
| GET/POST | `/api/fire-protection/reminders` | Lembretes de validade |

### PDV

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/fire-protection/pdv` | Operações de ponto de venda |
| GET | `/api/fire-protection/pdv/historico` | Histórico de vendas |
| GET | `/api/fire-protection/pdv/os-pendentes` | OS pendentes de pagamento |

### Studio / Convites

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/fire-protection/studio/me` | Dados do studio atual |
| GET/POST | `/api/fire-protection/studio/invite-code` | Código de convite genérico |
| GET/POST | `/api/fire-protection/studio/engineer-invite-code` | Código de convite para engenheiros |
| GET/POST | `/api/fire-protection/studio/client-invite-code` | Código de convite para clientes |

### Técnico de Campo

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/fire-protection/technician/os` | OS do técnico autenticado |
| GET/PATCH | `/api/fire-protection/technician/os/[id]` | Detalhe e atualização da OS |
| GET/POST | `/api/fire-protection/technician/os/[id]/extintores` | Extintores vinculados à OS |
| GET/PATCH | `/api/fire-protection/technician/assets/[id]` | Detalhe e atualização de extintor |
| POST | `/api/fire-protection/technician/asset-action` | Ação em extintor (inspeção, retirada, entrega) |
| GET | `/api/fire-protection/technician/scanner` | Dados do extintor via QR Code |
| POST | `/api/fire-protection/technician/scanner/inspecionar` | Registrar inspeção via scanner |
| POST | `/api/fire-protection/technician/vincular` | Vincular técnico ao studio |

### Engenheiro

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/fire-protection/engineer/vincular` | Vincular engenheiro ao studio |

### Cliente

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/fire-protection/client/dashboard` | Dados do dashboard do cliente |
| POST | `/api/fire-protection/client/solicitar` | Solicitar vistoria |
| POST | `/api/fire-protection/client/approve` | Aprovar vinculação |
| POST | `/api/fire-protection/client/reject` | Rejeitar vinculação |
| GET | `/api/fire-protection/client/pendentes-aprovacao` | Vinculações pendentes |
| POST | `/api/fire-protection/client/vincular` | Vincular cliente ao studio |
| GET/POST | `/api/fire-protection/client/documentos` | Documentos e laudos do cliente |

### Admin da Plataforma

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/admin/fire-protection/production-config` | Configuração de capacidade de produção por tenant |
| GET | `/api/cron/fire-protection-reminders` | Cron job de lembretes de validade (executado automaticamente) |

---

## Configuração Técnica

```
Nicho (niche key):     fire_protection
Rota base:             /solutions/fire-protection
Modelo de negócio:     MONETARY
Roles disponíveis:     admin, teacher (técnico), engineer, architect, student (cliente)
Vocabulário cliente:   Cliente
Vocabulário profis.:   Técnico
```

---

## Painel Admin da Plataforma

Acesso em `/admin/verticalizations/fire-protection`.

Exibe:
- KPIs globais: total de empresas, usuários, engenheiros, técnicos, clientes, MRR
- Lista de tenants ativos com acesso rápido
- Atalhos para a landing page, login e registro
- Visão dos módulos habilitados
- Configuração de capacidade de produção (extintores/dia por empresa)
- Parâmetros técnicos da verticalização
