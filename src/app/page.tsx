import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Dashboard } from '@/modules/dashboard/components/dashboard'

export default async function HomePage() {
	const supabase = await createServerSupabaseClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth')
	}

	return <Dashboard userEmail={user.email ?? ''} />
}
