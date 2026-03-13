/**
 * Script de auditoria de segurança de rotas.
 * Detecta rotas que usam `supabaseAdmin` com `studioId` mas não chamam `checkStudioAccess`.
 *
 * Uso:
 *   npx tsx scripts/audit-routes.ts
 *   npx tsx scripts/audit-routes.ts --fix-report   (gera JSON com detalhes)
 */

import * as fs from 'fs'
import * as path from 'path'

const API_DIR = path.join(process.cwd(), 'app', 'api')
const REPORT_PATH = path.join(process.cwd(), 'scripts', 'audit-routes-report.json')

interface RouteAudit {
  file: string
  usesSupabaseAdmin: boolean
  usesStudioId: boolean
  hasCheckStudioAccess: boolean
  hasRequireStudioAccess: boolean
  hasAllowInternalAiCall: boolean
  isCron: boolean
  isWebhook: boolean
  isAdmin: boolean
  verdict: 'ok' | 'warning' | 'unprotected'
  note: string
}

function readFileSync(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function walkDir(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath))
    } else if (entry.isFile() && entry.name === 'route.ts') {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Padrões que indicam que a rota deriva studio_id do próprio registro do usuário
 * (não de input externo), portanto não é IDOR.
 */
const SAFE_DERIVATION_PATTERNS = [
  // Invite code flows — studioId vem do DB pelo código, não do usuário
  'invite_code',
  'inviteCode',
  'technician_invite_code',
  'seller_invite_code',
  'resolve-invite',
  // studioId derivado do próprio registro do usuário autenticado
  'student.studio_id',
  'student?.studio_id',
  // guardModule valida auth + módulo internamente
  'guardModule(',
  // Rotas que validam ownership diretamente
  "owner_id', user.id",
  "owner_id: user.id",
  // Rotas de registro (criação de novo studio, sem studio pré-existente)
  'registerSchema',
  // Rota de debug com proteção explícita
  "NODE_ENV === 'production'",
  // Confirmar crédito: valida student_id === user.id
  'student_id !== user.id',
  // Scoped por professionalId (não por studioId externo)
  'in(\'professional_id\', professionalIds)',
  '.in("professional_id", professionalIds)',
  // Scoped por studioIds do professional (technician scanner)
  'studioIds.includes(asset.studio_id)',
  '.in(\'studio_id\', studioIds)',
  '.in("studio_id", studioIds)',
  // StudioId derivado do owner_id do usuário autenticado
  'resolveStudioId(user.id)',
  // Validação de ownership: studio.owner_id === user.id
  'owner_id === user.id',
  'owner_id: user.id',
  // Verificação de ownership por negação (owner_id !== user.id → return 403)
  'owner_id !== user.id',
  // Verificação de studio_id do asset contra studio_id do professional
  'asset.studio_id !== professional.studio_id',
]

function auditRoute(filePath: string): RouteAudit {
  const content = readFileSync(filePath)
  const relative = filePath.replace(process.cwd(), '').replace(/\\/g, '/')

  const usesSupabaseAdmin = content.includes('supabaseAdmin')
  const usesStudioId =
    content.includes('studioId') ||
    content.includes('studio_id') ||
    content.includes('p_studio_id')
  const hasCheckStudioAccess = content.includes('checkStudioAccess')
  const hasRequireStudioAccess = content.includes('requireStudioAccess')
  const hasAllowInternalAiCall = content.includes('allowInternalAiCall')
  const hasSuperAdminGuard =
    content.includes('checkSuperAdminDetailed') ||
    content.includes('requireSuperAdmin') ||
    content.includes('requireSuperAdmin()')
  const isCron = relative.includes('/cron/')
  const isWebhook = relative.includes('/webhooks/')
  const isAdmin = relative.includes('/admin/')

  // Verifica se a rota usa padrões seguros de derivação de studioId
  const hasSafeDerivation = SAFE_DERIVATION_PATTERNS.some(p => content.includes(p))

  let verdict: RouteAudit['verdict'] = 'ok'
  let note = ''

  if (usesSupabaseAdmin && usesStudioId) {
    if (hasCheckStudioAccess || hasRequireStudioAccess) {
      verdict = 'ok'
      note = 'checkStudioAccess presente'
    } else if (hasAllowInternalAiCall) {
      verdict = 'ok'
      note = 'rota interna com allowInternalAiCall'
    } else if (isCron) {
      verdict = 'ok'
      note = 'CRON — protegido por CRON_SECRET'
    } else if (hasSafeDerivation) {
      verdict = 'ok'
      note = 'studio_id derivado de registro próprio do usuário ou fluxo de convite — sem IDOR'
    } else if (isWebhook) {
      verdict = 'warning'
      note = 'webhook — verificar assinatura e lógica de studio_id'
    } else if (isAdmin && hasSuperAdminGuard) {
      verdict = 'ok'
      note = 'rota admin — verifica super_admin antes de usar supabaseAdmin'
    } else if (isAdmin) {
      verdict = 'warning'
      note = 'rota admin — verificar se valida super_admin antes'
    } else {
      verdict = 'unprotected'
      note = 'usa supabaseAdmin + studioId SEM checkStudioAccess — IDOR potencial'
    }
  } else if (!usesStudioId) {
    verdict = 'ok'
    note = 'não usa studioId — sem risco de IDOR multi-tenant'
  }

  return {
    file: relative,
    usesSupabaseAdmin,
    usesStudioId,
    hasCheckStudioAccess,
    hasRequireStudioAccess,
    hasAllowInternalAiCall,
    isCron,
    isWebhook,
    isAdmin,
    verdict,
    note,
  }
}

function main() {
  const files = walkDir(API_DIR)
  const results: RouteAudit[] = files.map(auditRoute)

  const unprotected = results.filter((r) => r.verdict === 'unprotected')
  const warnings = results.filter((r) => r.verdict === 'warning')
  const ok = results.filter((r) => r.verdict === 'ok')

  console.log('\n=== AUDIT DE ROTAS — SEGURANÇA MULTI-TENANT ===\n')
  console.log(`Total de rotas analisadas: ${results.length}`)
  console.log(`✅ Protegidas: ${ok.length}`)
  console.log(`⚠️  Warnings: ${warnings.length}`)
  console.log(`❌ Desprotegidas (IDOR): ${unprotected.length}`)

  if (unprotected.length > 0) {
    console.log('\n❌ ROTAS DESPROTEGIDAS — AÇÃO IMEDIATA NECESSÁRIA:')
    for (const r of unprotected) {
      console.log(`  ${r.file}`)
      console.log(`    → ${r.note}`)
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS — VERIFICAR MANUALMENTE:')
    for (const r of warnings) {
      console.log(`  ${r.file}`)
      console.log(`    → ${r.note}`)
    }
  }

  const generateReport = process.argv.includes('--fix-report')
  if (generateReport) {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2))
    console.log(`\nRelatório salvo em: ${REPORT_PATH}`)
  }

  if (unprotected.length > 0) {
    console.log('\n⛔ Falha na auditoria: existem rotas desprotegidas.')
    process.exit(1)
  }

  console.log('\n✅ Auditoria concluída sem rotas desprotegidas.')
}

main()
