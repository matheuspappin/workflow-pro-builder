# Plugin Architecture — Verticalizações

## Visão geral

Cada nicho (dance, fire_protection, agroflowai) é um **plugin** que centraliza config de AI, cache e rotas. Evita copy-paste entre verticalizações.

## Estrutura

```
lib/plugins/
├── types.ts        # NichePlugin, NicheSlug, NicheContextCacheConfig
├── registry.ts     # getPlugin(), getPluginByBasePath(), getAllPlugins()
├── dance.ts        # dancePlugin
├── fire-protection.ts
├── agroflowai.ts
└── index.ts
```

## Camadas

| Camada | Responsabilidade | Arquivos |
|--------|------------------|----------|
| **Plataforma** | Auth, proxy, rate limit, infra | `proxy.ts`, `lib/auth`, `lib/rate-limit` |
| **Plugin** | Config por nicho (AI, cache, rotas) | `lib/plugins/*` |
| **Domínio** | Lógica específica (tools, prompts, UI) | `lib/catarina`, `app/solutions/*` |

## Adicionar novo nicho

### 1. Criar plugin

`lib/plugins/meu-nicho.ts`:

```ts
import type { NichePlugin } from './types'

export const meuNichoPlugin: NichePlugin = {
  niche: 'meu_nicho',
  basePath: 'meu-nicho',
  aiEndpoint: '/api/meu-nicho/ai/chat',
  contextCache: {
    trainingLimit: 6,
    includeModelSetting: true,
    includeLeads: false,
    includeInventory: false,
  },
}
```

### 2. Registrar no registry

`lib/plugins/registry.ts`:

```ts
import { meuNichoPlugin } from './meu-nicho'

const PLUGINS: Record<NicheSlug, NichePlugin> = {
  dance: dancePlugin,
  fire_protection: fireProtectionPlugin,
  agroflowai: agroflowaiPlugin,
  meu_nicho: meuNichoPlugin,  // adicionar
}
```

### 3. Atualizar tipos

`lib/plugins/types.ts` — adicionar `'meu_nicho'` em `NicheSlug`.

### 4. Config de rotas

`config/verticalizations.ts` — adicionar entrada em `VERTICALIZATIONS`.

### 5. Prompt de nicho

`lib/catarina/niche-prompts.ts` — adicionar em `NICHE_PROMPTS` e `NicheSlug`.

### 6. AI endpoint

Criar `app/api/meu-nicho/ai/chat/route.ts` — seguir padrão de `fire-protection` ou `agroflowai`.

### 7. Nav e módulos

`config/meu-nicho-nav.ts` e `config/verticalization-nav-modules.ts`.

## Fluxo de dados

```
Request → proxy.ts (auth) → /api/<niche>/ai/chat
  → getPlugin(niche) → contextCache config
  → getCachedStudioContextGeneric(studioId, niche)
  → Gemini/Vertex AI
```

## O que NÃO é plugin

- **Rotas de auth**: `config/verticalizations.ts` (proxy.ts lê)
- **Nav items**: `config/*-nav.ts` (cada vertical tem seu nav)
- **Tools/funções da IA**: específicos por endpoint (fire-protection tem FIRE_TOOLS, agroflowai tem AGRO_OS_TYPES)
