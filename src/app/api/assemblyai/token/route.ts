import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const response = await fetch(
      'https://streaming.assemblyai.com/v3/token?expires_in_seconds=600',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.ASSEMBLYAI_API_KEY!}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: `AssemblyAI token error: ${response.status} - ${error}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ token: data.token })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
