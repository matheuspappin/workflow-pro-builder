import { OSList } from '@/components/service-orders/os-list'
import { getAuthenticatedClient } from '@/lib/server-utils'
import { redirect } from 'next/navigation'

export default async function OSPage() {
  const supabase = await getAuthenticatedClient()
  if (!supabase) redirect('/login')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Buscar studio_id do usuário logado
  const { data: profile } = await supabase
    .from('users_internal')
    .select('studio_id')
    .eq('id', user.id)
    .single()

  let studioId = profile?.studio_id;

  if (!studioId) {
    // Tentar professionals se não for admin
    const { data: prof } = await supabase
      .from('professionals')
      .select('studio_id')
      .eq('user_id', user.id)
      .single();
    
    studioId = prof?.studio_id;
  }

  if (!studioId) redirect('/dashboard');

  return (
    <div className="p-6">
      <OSList studioId={studioId} />
    </div>
  );
}
