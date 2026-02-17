'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function loginAction(email: string, password: string) {
	const supabase = await createServerSupabaseClient()

	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})

	if (error) {
		return { error: error.message }
	}

	revalidatePath('/', 'layout')
	return { error: null }
}

export async function registerAction(email: string, password: string) {
	const supabase = await createServerSupabaseClient()

	const { error } = await supabase.auth.signUp({
		email,
		password,
	})

	if (error) {
		return { error: error.message }
	}

	return { error: null }
}

export async function logoutAction() {
	const supabase = await createServerSupabaseClient()
	await supabase.auth.signOut()
	revalidatePath('/', 'layout')
	redirect('/auth')
}
