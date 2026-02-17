'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ConsultationRecord {
  id: string
  patientName: string
  dateTime: string
  audioUrl?: string
  transcription?: string
  summary?: string
  patientData?: { dni?: string; phone?: string; email?: string; age?: string; [key: string]: string | undefined }
  patientId?: string
  status?: 'completed' | 'processing' | 'failed'
}

function processPatientData(data: any) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return {
    dni: typeof data.dni === 'string' ? data.dni : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    age: typeof data.age === 'string' ? data.age : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
  }
}

function mapConsultation(item: any): ConsultationRecord {
  return {
    id: item.id,
    patientName: item.patient_name,
    dateTime: item.date_time,
    audioUrl: item.audio_url,
    transcription: item.transcription,
    summary: item.summary,
    patientData: processPatientData(item.patient_data),
    patientId: item.patient_id,
  }
}

export async function getConsultationsAction() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('user_id', user.id)
    .order('date_time', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch consultations: ${error.message}`)
  }

  return data.map(mapConsultation)
}

export async function getConsultationByIdAction(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch consultation: ${error.message}`)
  }

  return mapConsultation(data)
}

export async function getConsultationsByPatientAction(patientId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('consultations')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', user.id)
    .order('date_time', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch consultations: ${error.message}`)
  }

  return data.map(mapConsultation)
}

export async function createConsultationAction(data: {
  id: string
  patientName: string
  dateTime: string
  audioUrl?: string
  transcription?: string
  summary?: string
  patientData?: any
  patientId?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: consultation, error } = await supabase
    .from('consultations')
    .insert({
      id: data.id,
      user_id: user.id,
      patient_name: data.patientName,
      date_time: data.dateTime,
      audio_url: data.audioUrl,
      transcription: data.transcription,
      summary: data.summary,
      patient_data: data.patientData,
      patient_id: data.patientId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create consultation: ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return mapConsultation(consultation)
}

export async function updateConsultationAction(
  id: string,
  data: {
    patientName?: string
    transcription?: string
    summary?: string
    patientData?: any
    patientId?: string
  }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const updateData: any = {}
  if (data.patientName !== undefined) updateData.patient_name = data.patientName
  if (data.transcription !== undefined) updateData.transcription = data.transcription
  if (data.summary !== undefined) updateData.summary = data.summary
  if (data.patientData !== undefined) updateData.patient_data = data.patientData
  if (data.patientId !== undefined) updateData.patient_id = data.patientId

  const { data: consultation, error } = await supabase
    .from('consultations')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update consultation: ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return mapConsultation(consultation)
}

export async function deleteConsultationAction(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('consultations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete consultation: ${error.message}`)
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
