import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestAffiliate() {
  const email = 'teste@afiliado.com.br';
  const password = 'password123';
  const name = 'Afiliado Teste';
  const slug = 'afiliado-teste';

  console.log(`🚀 Iniciando criação do afiliado: ${email}`);

  // 1. Criar usuário (ou buscar se já existe)
  let userId;
  
  try {
    // Tenta criar usuário
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'affiliate'
      }
    });

    if (createError) {
      if (createError.message && (createError.message.includes('already registered') || createError.status === 422)) {
         console.log('⚠️ Usuário já existe, buscando ID...');
         const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
         const existingUser = users.find(u => u.email === email);
         
         if (existingUser) {
           userId = existingUser.id;
           console.log(`✅ Usuário encontrado: ${userId}`);
         } else {
           throw new Error('Usuário existe mas não foi encontrado na lista.');
         }
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
      console.log(`✅ Usuário criado com sucesso: ${userId}`);
    }

    // 2. Verificar se já existe como partner
    const { data: existingPartner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingPartner) {
      console.log(`⚠️ Usuário já é um parceiro (ID: ${existingPartner.id}). Atualizando dados...`);
      const { error: updateError } = await supabase
        .from('partners')
        .update({
           name,
           slug,
           commission_rate: 10
        })
        .eq('id', existingPartner.id);
        
      if (updateError) throw updateError;
      console.log('✅ Dados do parceiro atualizados.');
      
    } else {
      console.log('Creating partner record...');
      const { data: newPartner, error: insertError } = await supabase
        .from('partners')
        .insert({
          user_id: userId,
          name,
          slug,
          commission_rate: 10
        })
        .select()
        .single();

      if (insertError) {
          if (insertError.message && insertError.message.includes('duplicate key') && insertError.message.includes('slug')) {
             console.log('⚠️ Slug em uso, tentando slug alternativo...');
             const { error: retryError } = await supabase
                .from('partners')
                .insert({
                  user_id: userId,
                  name,
                  slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
                  commission_rate: 10
                });
             if (retryError) throw retryError;
          } else {
             throw insertError;
          }
      }
      console.log(`✅ Parceiro criado com sucesso.`);
    }

    console.log('\n🎉 Processo concluído com sucesso!');
    console.log(`Login: ${email}`);
    console.log(`Senha: ${password}`);

  } catch (err) {
    console.error('❌ Erro durante o processo:', err.message);
    console.error(err);
  }
}

createTestAffiliate();
