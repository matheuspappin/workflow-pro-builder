/**
 * Serviço para obter certificado A1 descriptografado do tenant.
 * O certificado é armazenado criptografado em tenant_certificates.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const KEY_LENGTH = 32

export interface DecryptedCertificate {
  pfxBase64: string
  password: string
  environment?: 'homologation' | 'production'
}

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.CERT_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) return null
  try {
    return Buffer.from(keyHex, 'hex')
  } catch {
    return null
  }
}

function decryptBuffer(
  encrypted: Buffer,
  iv: string,
  authTag: string,
  key: Buffer
): Buffer | null {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'hex'),
      { authTagLength: AUTH_TAG_LENGTH }
    )
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
  } catch {
    return null
  }
}

export interface EncryptedPayload {
  encrypted: Buffer
  iv: string
  authTag: string
}

function encryptBuffer(plain: Buffer, key: Buffer): EncryptedPayload | null {
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    })
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
    const authTag = cipher.getAuthTag()
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    }
  } catch {
    return null
  }
}

export async function saveCertificateForStudio(
  studioId: string,
  pfxBuffer: Buffer,
  password: string,
  options?: { environment?: 'homologation' | 'production'; validUntil?: Date }
): Promise<{ success: boolean; error?: string }> {
  const key = getEncryptionKey()
  if (!key) {
    return { success: false, error: 'CERT_ENCRYPTION_KEY não configurada' }
  }

  const pfxEncrypted = encryptBuffer(pfxBuffer, key)
  if (!pfxEncrypted) return { success: false, error: 'Falha ao criptografar certificado' }

  const passwordEncrypted = encryptBuffer(Buffer.from(password, 'utf-8'), key)
  if (!passwordEncrypted) return { success: false, error: 'Falha ao criptografar senha' }

  const { error } = await supabaseAdmin.from('tenant_certificates').upsert(
    {
      studio_id: studioId,
      pfx_encrypted: pfxEncrypted.encrypted,
      pfx_iv: pfxEncrypted.iv,
      pfx_auth_tag: pfxEncrypted.authTag,
      pfx_password_encrypted: passwordEncrypted.encrypted,
      pfx_password_iv: passwordEncrypted.iv,
      pfx_password_auth_tag: passwordEncrypted.authTag,
      environment: options?.environment || 'homologation',
      valid_until: options?.validUntil?.toISOString() || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'studio_id',
      ignoreDuplicates: false,
    }
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getDecryptedForStudio(studioId: string): Promise<DecryptedCertificate | null> {
  const key = getEncryptionKey()
  if (!key) return null

  const { data: cert, error } = await supabaseAdmin
    .from('tenant_certificates')
    .select('pfx_encrypted, pfx_iv, pfx_auth_tag, pfx_password_encrypted, pfx_password_iv, pfx_password_auth_tag, environment')
    .eq('studio_id', studioId)
    .maybeSingle()

  if (error || !cert) return null

  let pfxBuffer = cert.pfx_encrypted
  if (!pfxBuffer) return null
  if (!Buffer.isBuffer(pfxBuffer)) {
    pfxBuffer = Buffer.from(pfxBuffer instanceof Uint8Array ? pfxBuffer : new Uint8Array(pfxBuffer as ArrayBuffer))
  }

  const pfxDecrypted = decryptBuffer(pfxBuffer, cert.pfx_iv, cert.pfx_auth_tag, key)
  if (!pfxDecrypted) return null

  let passwordBuffer = cert.pfx_password_encrypted
  if (!passwordBuffer) return null
  if (!Buffer.isBuffer(passwordBuffer)) {
    passwordBuffer = Buffer.from(passwordBuffer instanceof Uint8Array ? passwordBuffer : new Uint8Array(passwordBuffer as ArrayBuffer))
  }

  const passwordDecrypted = decryptBuffer(
    passwordBuffer,
    cert.pfx_password_iv,
    cert.pfx_password_auth_tag,
    key
  )
  if (!passwordDecrypted) return null

  const env = cert.environment === 'production' ? 'production' : 'homologation'
  return {
    pfxBase64: pfxDecrypted.toString('base64'),
    password: passwordDecrypted.toString('utf-8'),
    environment: env,
  }
}
