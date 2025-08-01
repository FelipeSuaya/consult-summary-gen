
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if consultation-audios bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'consultation-audios')

    if (!bucketExists) {
      console.log('Creating consultation-audios bucket...')
      
      const { error: createError } = await supabase.storage.createBucket('consultation-audios', {
        public: true,
        fileSizeLimit: 52428800, // 50MB limit
        allowedMimeTypes: ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/ogg']
      })

      if (createError) {
        console.error('Error creating bucket:', createError)
        throw createError
      }

      console.log('consultation-audios bucket created successfully')
    } else {
      console.log('consultation-audios bucket already exists')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: bucketExists ? 'Bucket already exists' : 'Bucket created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error ensuring bucket:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
