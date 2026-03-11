/**
 * Workflow AI - WhatsApp Integration Library
 * Esta biblioteca centraliza o envio de mensagens e formatação de payloads.
 */

import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { guardModule } from '@/lib/modules-server'
import logger from '@/lib/logger';

interface SendMessageOptions {
  to: string;
  message: string;
  studioId?: string;
}

export async function sendWhatsAppMessage({ to, message, studioId }: SendMessageOptions) {
  if (studioId) await guardModule('whatsapp')
  let apiKey = '';
  let apiUrl = '';
  let instanceId = '';

  // 1. Se tiver studioId, BUSCA as chaves do estúdio (ou usa fallback da plataforma)
  if (studioId && studioId !== '00000000-0000-0000-0000-000000000000') {
    const { data: studioKeys } = await supabase
      .from('studio_api_keys')
      .select('*, studio:studios(slug)')
      .eq('studio_id', studioId)
      .eq('service_name', 'whatsapp')
      .maybeSingle();

    if (studioKeys && studioKeys.api_key) {
      apiKey = studioKeys.api_key;
      apiUrl = studioKeys.settings?.api_url || 'http://127.0.0.1:8081';
      instanceId = studioKeys.instance_id || (studioKeys as any).studio?.slug ? `df_${(studioKeys as any).studio.slug}` : 'danceflow';
    } else {
      // Fallback: usar Evolution API da plataforma (Docker único) - instância df_{slug}
      const platformKey = process.env.WHATSAPP_API_KEY;
      const platformUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
      if (!platformKey || !platformUrl) {
        logger.warn(`⚠️ WhatsApp do Estúdio ${studioId} não configurado e plataforma sem WHATSAPP_API_KEY.`);
        return { success: false, error: 'A API de WhatsApp não está configurada.' };
      }
      const { data: studio } = await supabaseAdmin.from('studios').select('slug').eq('id', studioId).maybeSingle();
      if (!studio?.slug) {
        logger.warn(`⚠️ Estúdio ${studioId} sem slug.`);
        return { success: false, error: 'Estúdio sem identificador.' };
      }
      apiKey = platformKey;
      apiUrl = platformUrl;
      instanceId = `df_${studio.slug}`;
    }
  } else {
    // 2. Se NÃO tiver studioId, é uma mensagem de SISTEMA (ex: Código de Verificação)
    // Usamos a API do SuperAdmin (definida no .env)
    apiKey = process.env.WHATSAPP_API_KEY || '';
    apiUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
    instanceId = 'danceflow'; // Instância padrão do sistema
  }

  if (!apiKey || !apiUrl) {
    logger.warn('⚠️ WhatsApp API não configurada. Mensagem não enviada:', { to, message, studioId });
    return { success: false, error: 'Configurações de API ausentes' };
  }

  try {
    // Evolution API v1.8.2 uses /message/sendText/{instance}
    const sendUrl = `${apiUrl}/message/sendText/${instanceId}`;

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: formatPhoneNumber(to), // Garantir formato internacional
        textMessage: {
          text: message
        },
      }),
    });

    const result = await response.json();
    logger.info('📤 Resposta do envio WhatsApp:', JSON.stringify(result, null, 2));
    
    // Evolution API retorna status: 201 Created quando envia com sucesso
    if (response.ok || response.status === 201) {
      return { success: true, data: result };
    }
    
    return { success: false, error: result };
  } catch (error) {
    logger.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    return { success: false, error };
  }
}

/**
 * Obtém o QR Code ou Status de conexão da instância
 */
export async function getWhatsAppConnection(studioId: string) {
  await guardModule('whatsapp')
  // 1. Se NÃO tiver studioId ou for o ID do SuperAdmin, usamos a instância global
  if (!studioId || studioId === '00000000-0000-0000-0000-000000000000') {
    const apiKey = process.env.WHATSAPP_API_KEY || '';
    if (!apiKey) {
      return { success: false, error: 'WHATSAPP_API_KEY não configurada. Defina no .env.' };
    }
    const instanceId = 'danceflow';
    const baseUrl = (process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081').split('/message')[0].replace(/\/$/, "");

    logger.info(`📡 Verificando instância SuperAdmin: ${instanceId} em ${baseUrl}`);
    return await handleWhatsAppInstance(instanceId, apiKey, baseUrl);
  }

  // 2. Buscar chaves específicas do estúdio (ou usar fallback da plataforma)
  const { data: studioKeys } = await supabase
    .from('studio_api_keys')
    .select('*, studio:studios(slug)')
    .eq('studio_id', studioId)
    .eq('service_name', 'whatsapp')
    .maybeSingle();

  let apiKey: string;
  let instanceId: string;
  let baseUrl: string;

  if (studioKeys && studioKeys.api_key) {
    apiKey = studioKeys.api_key;
    instanceId = studioKeys.instance_id || (studioKeys as any)?.studio?.slug ? `df_${(studioKeys as any).studio.slug}` : 'danceflow';
    baseUrl = studioKeys.settings?.api_url || process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
    if (instanceId === 'danceflow' && studioId) {
      const { data: studio } = await supabaseAdmin.from('studios').select('slug').eq('id', studioId).maybeSingle();
      if (studio?.slug) instanceId = `df_${studio.slug}`;
    }
  } else {
    // Fallback: usar Evolution API da plataforma - cliente só escaneia QR, sem configurar nada
    const platformKey = process.env.WHATSAPP_API_KEY;
    const platformUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
    if (!platformKey || !platformUrl) {
      return { success: false, error: 'WHATSAPP_API_KEY não configurada. Configure no .env da plataforma.' };
    }
    const { data: studio } = await supabaseAdmin.from('studios').select('slug').eq('id', studioId).maybeSingle();
    if (!studio?.slug) {
      return { success: false, error: 'Estúdio sem slug. Contate o suporte.' };
    }
    apiKey = platformKey;
    instanceId = `df_${studio.slug}`;
    baseUrl = platformUrl;
  }

  baseUrl = baseUrl.split('/message')[0].replace(/\/$/, "");

  logger.info(`📡 Verificando instância: ${instanceId} em ${baseUrl}`);
  return await handleWhatsAppInstance(instanceId, apiKey, baseUrl);
}

/**
 * Lógica compartilhada para gerenciar instâncias (verificar, criar e conectar)
 */
async function handleWhatsAppInstance(instanceId: string, apiKey: string, baseUrl: string) {
  try {
    // 1. Tentar ver se a instância existe
    const statusRes = await fetch(`${baseUrl}/instance/connectionState/${instanceId}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
      cache: 'no-store'
    });

    logger.info(`📊 Status da instância ${instanceId}: ${statusRes.status}`);

    if (statusRes.status === 404) {
      // 2. Se não existe, criar a instância automaticamente
      logger.info(`🔨 Instância não encontrada. Criando ${instanceId}...`);
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'apikey': apiKey 
        },
        body: JSON.stringify({
          instanceName: instanceId,
          token: `${apiKey}_${Date.now()}`, // Token único para evitar erro de token duplicado
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (!createRes.ok) {
        const err = await createRes.text();
        logger.error(`❌ Falha ao criar instância:`, err);
        return { success: false, error: `Falha ao criar instância: ${err}` };
      }
      
      logger.info(`✅ Instância ${instanceId} criada com sucesso.`);
      
      // Pequena pausa para a API processar a criação
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Buscar o QR Code / Status de Conexão
    logger.info(`🔗 Solicitando QR Code/Conexão para: ${instanceId}`);
    const response = await fetch(`${baseUrl}/instance/connect/${instanceId}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
      cache: 'no-store'
    });

    const result = await response.json();
    
    // 4. Buscar também o estado atual para garantir
    const stateRes = await fetch(`${baseUrl}/instance/connectionState/${instanceId}`, {
      method: 'GET',
      headers: { 'apikey': apiKey },
      cache: 'no-store'
    });
    const stateData = await stateRes.json();

    logger.info(`📦 Estado da instância ${instanceId}:`, JSON.stringify(stateData));
    
    // Normalizar o estado (Evolution API pode retornar state em locais diferentes)
    const currentState = stateData.instance?.state || stateData.state || stateData.status || 'disconnected';

    // Se já estiver conectado, não precisamos do QR Code novamente
    if (currentState === 'open') {
      return {
        success: true,
        data: {
          instance: {
            instanceName: instanceId,
            state: 'open'
          }
        }
      };
    }

    logger.info('📦 Resposta da Evolution API recebida (QR Code):', JSON.stringify(result));
    
    // Normalizar o QR Code (suporte a v1 e v2 da Evolution API)
    let base64 = result.base64;
    
    if (!base64 && result.qrcode) {
        if (typeof result.qrcode === 'string') {
            base64 = result.qrcode;
        } else if (result.qrcode.base64) {
            base64 = result.qrcode.base64;
        }
    }

    // Se ainda não tiver base64, verificar se está na propriedade 'url' ou 'code' (algumas versões)
    if (!base64 && result.url) base64 = result.url;
    if (!base64 && result.code) base64 = result.code;

    // Garantir que o base64 comece com o prefixo correto se não tiver
    if (base64 && !base64.startsWith('data:image')) {
        base64 = `data:image/png;base64,${base64}`;
    }

    // Atualizar o objeto result com o base64 normalizado
    if (base64) {
        result.base64 = base64;
    }

    return { 
      success: true, 
      data: {
        ...result,
        base64: base64, // Forçar o envio explícito do base64 na raiz do data
        instance: {
          ...stateData.instance,
          state: currentState
        }
      } 
    };
  } catch (error: any) {
    logger.error('❌ Erro ao buscar conexão WhatsApp:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao conectar com o motor de WhatsApp. Certifique-se que o Docker está rodando.' 
    };
  }
}

/**
 * Desconecta e remove a instância do WhatsApp
 */
export async function logoutWhatsApp(studioId: string) {
  await guardModule('whatsapp')

  // 1. Se NÃO tiver studioId ou for o ID do SuperAdmin, usamos a instância global
  if (!studioId || studioId === '00000000-0000-0000-0000-000000000000') {
    const apiKey = process.env.WHATSAPP_API_KEY || '';
    if (!apiKey) {
      return { success: false, error: 'WHATSAPP_API_KEY não configurada. Defina no .env.' };
    }
    const instanceId = 'danceflow';
    const baseUrl = (process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081').split('/message')[0].replace(/\/$/, "");

    logger.info(`📡 Desconectando instância SuperAdmin: ${instanceId} em ${baseUrl}`);
    
    try {
      await fetch(`${baseUrl}/instance/logout/${instanceId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey }
      });

      await fetch(`${baseUrl}/instance/delete/${instanceId}`, {
        method: 'DELETE',
        headers: { 'apikey': apiKey }
      });

      return { success: true };
    } catch (error: any) {
      logger.error('❌ Erro ao desconectar WhatsApp SuperAdmin:', error);
      return { success: false, error: error.message };
    }
  }

  const { data: studioKeys } = await supabase
    .from('studio_api_keys')
    .select('*, studio:studios(slug)')
    .eq('studio_id', studioId)
    .eq('service_name', 'whatsapp')
    .maybeSingle();

  let apiKey: string;
  let instanceId: string;
  let baseUrl: string;

  if (studioKeys && studioKeys.api_key) {
    apiKey = studioKeys.api_key;
    instanceId = studioKeys.instance_id || (studioKeys as any)?.studio?.slug ? `df_${(studioKeys as any).studio.slug}` : 'danceflow';
    baseUrl = studioKeys.settings?.api_url || process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
    if (instanceId === 'danceflow' && studioId) {
      const { data: studio } = await supabaseAdmin.from('studios').select('slug').eq('id', studioId).maybeSingle();
      if (studio?.slug) instanceId = `df_${studio.slug}`;
    }
  } else {
    const platformKey = process.env.WHATSAPP_API_KEY;
    const platformUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
    if (!platformKey || !platformUrl) return { success: false, error: 'Configurações não encontradas.' };
    const { data: studio } = await supabaseAdmin.from('studios').select('slug').eq('id', studioId).maybeSingle();
    if (!studio?.slug) return { success: false, error: 'Estúdio sem slug.' };
    apiKey = platformKey;
    instanceId = `df_${studio.slug}`;
    baseUrl = platformUrl;
  }
  baseUrl = baseUrl.split('/message')[0];

  try {
    // 1. Logout da instância (desconecta o celular)
    await fetch(`${baseUrl}/instance/logout/${instanceId}`, {
      method: 'DELETE',
      headers: { 'apikey': apiKey }
    });

    // 2. Deletar a instância (opcional, mas bom para reset completo)
    await fetch(`${baseUrl}/instance/delete/${instanceId}`, {
      method: 'DELETE',
      headers: { 'apikey': apiKey }
    });

    return { success: true };
  } catch (error: any) {
    logger.error('❌ Erro ao desconectar WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Provisiona o WhatsApp com credenciais da plataforma para um novo estúdio.
 * Usa Evolution API única (Docker) - cliente só escaneia QR, sem configurar nada.
 * Só executa se WHATSAPP_API_KEY e WHATSAPP_API_URL estiverem no .env.
 */
export async function provisionWhatsAppForStudio(studioId: string, slug: string): Promise<void> {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const apiUrl = process.env.WHATSAPP_API_URL || 'http://127.0.0.1:8081';
  if (!apiKey || !apiUrl) {
    logger.info('⏭️ WhatsApp provisionamento ignorado: WHATSAPP_API_KEY/URL não configuradas.');
    return;
  }
  try {
    const { error } = await supabaseAdmin.from('studio_api_keys').upsert(
      {
        studio_id: studioId,
        service_name: 'whatsapp',
        api_key: apiKey,
        instance_id: `df_${slug}`,
        settings: { api_url: apiUrl },
        status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'studio_id,service_name' }
    );
    if (error) return;
    logger.info(`✅ WhatsApp provisionado para estúdio ${studioId} (df_${slug})`);
  } catch (e) {
    logger.warn('Erro ao provisionar WhatsApp:', e);
  }
}

/**
 * Formata o número de telefone para o padrão internacional (E.164)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

/**
 * Notifica o aluno quando os créditos estão baixos (1 ou 2 restantes)
 */
export async function notifyLowCredits(studentId: string, studioId: string, remainingCredits: number) {
  if (remainingCredits > 2 || remainingCredits <= 0) return;

  try {
    const { data: student } = await supabase
      .from('students')
      .select('name, phone')
      .eq('id', studentId)
      .single();

    if (!student || !student.phone) return;

    const { data: studio } = await supabase
      .from('studios')
      .select('name')
      .eq('id', studioId)
      .single();

    const studioName = studio?.name || "seu estúdio de dança";
    
    const message = remainingCredits === 2 
      ? `Olá *${student.name}*! 👋 Notamos que você tem apenas *2 créditos* de aula restantes na *${studioName}*. Que tal garantir seu próximo pacote para não interromper sua evolução? 💃✨`
      : `Olá *${student.name}*! 👋 Você tem apenas *1 crédito* de aula restante na *${studioName}*. Garanta seu novo pacote agora para continuar dançando conosco! 💃🚀`;

    await sendWhatsAppMessage({
      to: student.phone,
      message,
      studioId
    });

    logger.info(`📢 Notificação de crédito baixo enviada para ${student.name} (${remainingCredits} restates)`);
  } catch (error) {
    logger.error('❌ Erro ao enviar notificação de crédito baixo:', error);
  }
}
