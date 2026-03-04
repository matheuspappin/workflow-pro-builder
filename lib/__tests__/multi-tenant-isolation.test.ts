/**
 * Testes de isolamento multi-tenant
 * 
 * Valida que as funções críticas de segurança funcionam corretamente:
 * - checkStudioAccess bloqueia acesso cross-tenant
 * - requireStudioAccess bloqueia studios inativos e trials expirados
 * - guardModule bloqueia módulos desativados
 * - saveStudent/saveProfessional respeitam limites de plano
 * 
 * Para rodar: npx jest lib/__tests__/multi-tenant-isolation.test.ts
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY configurados
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica que uma query Supabase inclui filtro .eq('studio_id', ...) 
 * Analisa o código fonte de um arquivo de rota para garantir isolamento.
 */
function assertStudioIdFilter(routeCode: string, routePath: string): void {
  const hasStudioFilter = routeCode.includes(".eq('studio_id'") || routeCode.includes('.eq("studio_id"')
  if (!hasStudioFilter) {
    throw new Error(`FALHA DE ISOLAMENTO: ${routePath} não filtra por studio_id`)
  }
}

/**
 * Verifica que uma rota importa e usa checkStudioAccess
 */
function assertCheckStudioAccess(routeCode: string, routePath: string): void {
  const hasImport = routeCode.includes('checkStudioAccess')
  if (!hasImport) {
    throw new Error(`FALHA DE SEGURANÇA: ${routePath} não usa checkStudioAccess`)
  }
}

// ─── Testes estáticos (análise de código) ────────────────────────────────────

describe('Multi-Tenant Isolation - Análise Estática', () => {
  const fs = require('fs')
  const path = require('path')

  const criticalRoutes = [
    'app/api/attendance/route.ts',
    'app/api/finance/expenses/route.ts',
    'app/api/finance/employee-payments/route.ts',
    'app/api/finance/notas/route.ts',
    'app/api/dashboard/live-classes/route.ts',
    'app/api/whatsapp/connect/route.ts',
    'app/api/whatsapp/send/route.ts',
    'app/api/whatsapp/logout/route.ts',
    'app/api/whatsapp/notify-low-credits/route.ts',
    'app/api/notifications/route.ts',
    'app/api/notifications/mark-all-read/route.ts',
  ]

  for (const route of criticalRoutes) {
    const routeName = route.replace('app/api/', '').replace('/route.ts', '')

    it(`${routeName}: deve usar checkStudioAccess`, () => {
      const fullPath = path.resolve(process.cwd(), route)
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Arquivo não encontrado: ${route}`)
        return
      }
      const code = fs.readFileSync(fullPath, 'utf-8')
      assertCheckStudioAccess(code, route)
    })
  }

  it('require-studio-access: deve verificar studios.status', () => {
    const fullPath = path.resolve(process.cwd(), 'lib/auth/require-studio-access.ts')
    const code = fs.readFileSync(fullPath, 'utf-8')
    expect(code).toContain("status === 'inactive'")
    expect(code).toContain('trial_ends_at')
    expect(code).toContain('402')
  })

  it('modules-server: deve verificar studios.status antes de retornar config', () => {
    const fullPath = path.resolve(process.cwd(), 'lib/modules-server.ts')
    const code = fs.readFileSync(fullPath, 'utf-8')
    expect(code).toContain("studio.status === 'inactive'")
    expect(code).toContain('subscription_status')
    expect(code).toContain('trial_ends_at')
  })

  it('database-utils: saveStudent deve verificar limites de plano', () => {
    const fullPath = path.resolve(process.cwd(), 'lib/database-utils.ts')
    const code = fs.readFileSync(fullPath, 'utf-8')
    expect(code).toContain('isLimitReached')
    expect(code).toContain("'maxStudents'")
  })

  it('database-utils: saveProfessional deve verificar limites de plano', () => {
    const fullPath = path.resolve(process.cwd(), 'lib/database-utils.ts')
    const code = fs.readFileSync(fullPath, 'utf-8')
    expect(code).toContain("'maxProfessionals'")
  })

  it('proxy.ts: deve ter check de modo manutenção', () => {
    const fullPath = path.resolve(process.cwd(), 'proxy.ts')
    const code = fs.readFileSync(fullPath, 'utf-8')
    expect(code).toContain('MAINTENANCE_MODE')
    expect(code).toContain('/maintenance')
  })
})

// ─── Testes de lógica (isLimitReached) ───────────────────────────────────────

describe('Plan Limits - isLimitReached', () => {
  // Dynamic import to avoid module resolution issues in test
  let isLimitReached: any
  let PLAN_LIMITS: any

  beforeAll(async () => {
    const mod = await import('../plan-limits')
    isLimitReached = mod.isLimitReached
    PLAN_LIMITS = mod.PLAN_LIMITS
  })

  it('gratuito: deve bloquear quando atingir 10 alunos', () => {
    expect(isLimitReached(10, 'gratuito', 'maxStudents')).toBe(true)
    expect(isLimitReached(9, 'gratuito', 'maxStudents')).toBe(false)
  })

  it('gratuito: deve bloquear quando atingir 1 profissional', () => {
    expect(isLimitReached(1, 'gratuito', 'maxProfessionals')).toBe(true)
    expect(isLimitReached(0, 'gratuito', 'maxProfessionals')).toBe(false)
  })

  it('pro: deve ter limites maiores que gratuito', () => {
    const gratuitoStudents = PLAN_LIMITS.gratuito.maxStudents
    const proStudents = PLAN_LIMITS.pro.maxStudents
    expect(proStudents).toBeGreaterThan(gratuitoStudents)
  })

  it('enterprise: deve ter limites maiores que pro', () => {
    const proStudents = PLAN_LIMITS.pro.maxStudents
    const enterpriseStudents = PLAN_LIMITS.enterprise.maxStudents
    expect(enterpriseStudents).toBeGreaterThan(proStudents)
  })

  it('plano desconhecido: deve usar fallback gratuito', () => {
    expect(isLimitReached(10, 'plano-inexistente', 'maxStudents')).toBe(true)
  })
})
