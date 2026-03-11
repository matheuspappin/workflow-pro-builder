import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'

interface AdminLogData {
  action: string
  user_id?: string
  studio_id?: string
  targetStudio?: string
  importType?: string
  totalRecords?: number
  importedRecords?: number
  errorRecords?: number
  fileName?: string
  fileSize?: number
  fileType?: string
  recordCount?: number
  details?: Record<string, unknown>
  // Nunca aceita 'session' — evita tokens em logs
}

export async function logAdmin(action: string, data: Omit<AdminLogData, 'action'> = {}) {
  try {
    // Extrair apenas o user_id — nunca serializar o objeto session completo
    const safeData: AdminLogData = {
      action,
      user_id: data.user_id,
      studio_id: data.studio_id || data.targetStudio,
      targetStudio: data.targetStudio,
      importType: data.importType,
      totalRecords: data.totalRecords,
      importedRecords: data.importedRecords,
      errorRecords: data.errorRecords,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      recordCount: data.recordCount,
      details: data.details,
    }

    // Log seguro — sem tokens
    logger.info('[ADMIN LOG]', {
      action,
      user_id: safeData.user_id,
      studio_id: safeData.studio_id,
      importType: safeData.importType,
      fileName: safeData.fileName,
      recordCount: safeData.recordCount ?? safeData.totalRecords,
    })

    // Persistir no banco com todos os campos de auditoria
    const { error } = await supabaseAdmin
      .from('admin_logs')
      .insert({
        action,
        user_id: safeData.user_id,
        studio_id: safeData.studio_id,
        details: {
          importType: safeData.importType,
          targetStudio: safeData.targetStudio,
          totalRecords: safeData.totalRecords,
          importedRecords: safeData.importedRecords,
          errorRecords: safeData.errorRecords,
          fileName: safeData.fileName,
          fileSize: safeData.fileSize,
          fileType: safeData.fileType,
          recordCount: safeData.recordCount,
          ...safeData.details,
        },
        created_at: new Date().toISOString(),
      })

    if (error) {
      logger.error('[ADMIN LOG] Erro ao salvar log no banco:', { message: error.message })
    }
  } catch (err) {
    logger.error('[ADMIN LOG] Erro ao registrar log:', { message: err instanceof Error ? err.message : String(err) })
  }
}
