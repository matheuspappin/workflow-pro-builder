# Sistema de Importação Universal - AKAAI CORE

## 🎯 Visão Geral

O Sistema de Importação Universal permite que Super Admins importem dados de qualquer formato (Excel, CSV, JSON, XML, TXT) e os transformem em planilhas padronizadas para o sistema do cliente.

## 🚀 Funcionalidades

### ✅ Core Features
- **Upload Universal**: Suporte para múltiplos formatos de arquivo
- **Parser Inteligente**: Detecção automática de estrutura e tipo de dados
- **Mapeamento IA**: Sugestões inteligentes de mapeamento de campos
- **Validação Robusta**: Verificação de qualidade e consistência dos dados
- **Transformação**: Conversão para formato padronizado do sistema
- **Importação Segura**: Respeito às regras multi-tenant (studio_id)

### 📋 Formatos Suportados
- **Excel**: `.xlsx`, `.xls` (todas as planilhas)
- **CSV**: `.csv` (qualquer delimitador)
- **JSON**: `.json` (arrays e objetos)
- **XML**: `.xml` (estrutura hierárquica)
- **TXT**: `.txt` (delimitado por tabs, vírgulas, etc.)

### 🎯 Tipos de Importação
- **Clientes/Alunos**: Dados de pessoas (nome, email, telefone, etc.)
- **Pagamentos**: Transações financeiras (valor, data, status)
- **Produtos**: Itens de estoque (nome, preço, quantidade)
- **Serviços**: Serviços oferecidos (nome, preço, duração)

## 🏗️ Arquitetura

### Backend (API Routes)
```
/api/admin/import/
├── route.ts              # Upload e análise inicial
└── execute/route.ts       # Execução final da importação
```

### Bibliotecas Core
```
/lib/import/
├── file-parser.ts         # Parser universal de arquivos
├── ai-analyzer.ts         # Análise inteligente de dados
└── data-validator.ts      # Validação e limpeza
```

### Frontend (Interface Admin)
```
/app/admin/import/
└── page.tsx              # Interface completa de importação
```

## 🔄 Fluxo de Importação

### 1. Upload do Arquivo
- Seleção do estúdio destino
- Escolha do tipo de importação
- Upload do arquivo (máx 50MB)
- Detecção automática do formato

### 2. Análise Inteligente
- **Qualidade dos Dados**: Completude, consistência, validade
- **Detecção de Entidade**: Identificação automática do tipo de dados
- **Mapeamento Sugerido**: IA sugere correspondência de campos
- **Recomendações**: Sugestões de melhoria dos dados

### 3. Mapeamento de Campos
- Visualização do mapeamento sugerido
- Ajuste manual se necessário
- Preview dos dados transformados
- Validação em tempo real

### 4. Execução da Importação
- Validação final dos dados
- Importação em lote
- Relatório de resultados
- Logs de auditoria

## 🛡️ Segurança e Compliance

### Multi-Tenant Isolation
- **studio_id**: Todos os dados importados respeitam o isolamento
- **Validação de Acesso**: Apenas Super Admins podem importar
- **Auditoria Completa**: Logs detalhados de todas as operações

### Validação de Dados
- **Emails**: Verificação de formato e duplicidade
- **Telefones**: Validação de formato brasileiro
- **CPF/CNPJ**: Validação de documentos
- **Datas**: Conversão e validação de formatos

### Qualidade dos Dados
- **Limpeza Automática**: Remoção de caracteres especiais
- **Normalização**: Padronização de formatos
- **Detecção de Duplicatas**: Evita registros duplicados
- **Validação de Regras**: Regras específicas por tipo de dado

## 📊 Métricas e Relatórios

### KPIs de Importação
- **Taxa de Sucesso**: Percentual de registros importados
- **Qualidade dos Dados**: Índice de completude e validade
- **Erros Comuns**: Tipos de erro mais frequentes
- **Performance**: Tempo de processamento

### Relatórios de Auditoria
- **Log de Operações**: Detalhes de cada importação
- **Alterações de Dados**: Registros afetados
- **Erros e Warnings**: Problemas detectados
- **Responsável**: Quem executou a importação

## 🎛️ Configuração

### Variáveis de Ambiente
```env
# Opcional: Para integração com IA no futuro
GOOGLE_AI_API_KEY=sua_chave_gemini

# Configurações de upload
MAX_FILE_SIZE=52428800  # 50MB em bytes
ALLOWED_EXTENSIONS=xlsx,xls,csv,json,xml,txt
```

### Configurações de Validação
```typescript
// Em lib/import/data-validator.ts
const ValidationRules = {
  student: [
    { field: 'name', type: 'required' },
    { field: 'email', type: 'email' },
    { field: 'phone', type: 'phone' },
    // ... mais regras
  ]
}
```

## 🔧 Extensão e Customização

### Adicionar Novos Tipos de Importação
1. Criar regras de validação em `ValidationRules`
2. Adicionar função de importação em `execute/route.ts`
3. Atualizar interface frontend se necessário

### Suporte a Novos Formatos
1. Adicionar parser em `file-parser.ts`
2. Atualizar `detectFileType()`
3. Adicionar validação de MIME types

### Integração com IA
1. Descomentar código em `ai-analyzer.ts`
2. Configurar `GOOGLE_AI_API_KEY`
3. Customizar prompts para mapeamento

## 🚨 Boas Práticas

### Antes de Importar
1. **Backup**: Sempre faça backup dos dados
2. **Validação**: Teste com amostra pequena
3. **Mapeamento**: Revise mapeamento sugerido
4. **Limpeza**: Limpe dados problemáticos

### Durante Importação
1. **Monitoramento**: Acompanhe progresso
2. **Logs**: Verifique erros e warnings
3. **Rollback**: Tenha plano de rollback
4. **Performance**: Evite horários de pico

### Pós Importação
1. **Verificação**: Confirme dados importados
2. **Relatório**: Analise resultados
3. **Notificação**: Informe stakeholders
4. **Documentação**: Registre operação

## 🐛 Troubleshooting

### Problemas Comuns

#### Arquivo Não Reconhecido
- **Causa**: Formato não suportado ou corrompido
- **Solução**: Verifique extensão e tente salvar como CSV

#### Mapeamento Incorreto
- **Causa**: Nomes de colunas não padronizados
- **Solução**: Ajuste mapeamento manualmente

#### Erros de Validação
- **Causa**: Dados em formato inválido
- **Solução**: Limpe dados antes de importar

#### Performance Lenta
- **Causa**: Arquivos muito grandes
- **Solução**: Divida em arquivos menores

### Logs e Debug
```bash
# Verificar logs de importação
grep "IMPORT_" /var/log/akaai/app.log

# Verificar erros de validação
grep "VALIDATION_ERROR" /var/log/akaai/app.log
```

## 📱 Interface do Usuário

### Acesso ao Sistema
1. Login como Super Admin
2. Menu lateral → "Importação de Dados"
3. Seguir fluxo passo a passo

### Componentes Principais
- **Upload Zone**: Arrastar ou selecionar arquivo
- **Analysis Dashboard**: Métricas de qualidade
- **Mapping Interface**: Configuração de campos
- **Progress Indicator**: Status da importação
- **Results Report**: Resumo final

## 🔮 Roadmap Futuro

### Próximas Features
- [ ] **Importação em Lote**: Múltiplos arquivos simultâneos
- [ ] **Agendamento**: Importações automáticas
- [ ] **Templates**: Modelos pré-configurados
- [ ] **API Pública**: Endpoints para integração
- [ ] **Exportação**: Gerar templates de importação

### Melhorias Técnicas
- [ ] **Processamento Paralelo**: Melhor performance
- [ ] **Cache Inteligente**: Otimização de memória
- [ ] **WebSockets**: Atualizações em tempo real
- [ ] **Machine Learning**: Melhoria na detecção de padrões

## 📞 Suporte

### Canais de Ajuda
- **Documentação**: Este guia completo
- **Logs do Sistema**: `/api/admin/logs`
- **Suporte Técnico**: Canal do Slack ou email

### Escalation
1. **Problemas Leves**: Verifique logs e documentação
2. **Problemas Médios**: Contate time técnico
3. **Problemas Críticos**: Page on-call engineer

---

**AKAAI CORE Import System**  
*Transformando dados em valor para seu negócio* 🚀
