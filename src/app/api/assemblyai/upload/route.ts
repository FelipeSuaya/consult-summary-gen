import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const audioBlob = await request.blob()

    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        Authorization: process.env.ASSEMBLYAI_API_KEY!,
        'Content-Type': 'application/octet-stream',
      },
      body: audioBlob,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `AssemblyAI upload error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json({ upload_url: result.upload_url })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
