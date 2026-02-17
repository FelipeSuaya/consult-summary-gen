'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Patient, PatientResponse } from '@/types'

interface ConsultationStats {
  patient_id: string
  first_consultation: string
  last_consultation: string
  count: number
}

export async function getPatientsAction(startDate?: string, endDate?: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  // Query 1: Get all patients for user
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (patientsError) {
    return { data: null, error: patientsError.message }
  }

  if (!patients || patients.length === 0) {
    return { data: [], error: null }
  }

  const patientIds = patients.map(p => p.id)

  // Query 2: Get consultation stats grouped by patient_id
  // Using aggregation to avoid N+1
  const { data: consultations, error: consultationsError } = await supabase
    .from('consultations')
    .select('patient_id, date_time')
    .in('patient_id', patientIds)
    .order('date_time', { ascending: true })

  if (consultationsError) {
    return { data: null, error: consultationsError.message }
  }

  // Build stats map
  const statsMap = new Map<string, ConsultationStats>()

  if (consultations) {
    consultations.forEach(c => {
      const existing = statsMap.get(c.patient_id)
      if (!existing) {
        statsMap.set(c.patient_id, {
          patient_id: c.patient_id,
          first_consultation: c.date_time,
          last_consultation: c.date_time,
          count: 1
        })
      } else {
        existing.last_consultation = c.date_time
        existing.count++
      }
    })
  }

  // Map patients with stats
  let result: Patient[] = patients.map(p => {
    const stats = statsMap.get(p.id)
    return {
      id: p.id,
      name: p.name,
      dni: p.dni || undefined,
      phone: p.phone || undefined,
      email: p.email || undefined,
      age: p.age || undefined,
      notes: p.notes || undefined,
      firstConsultationDate: stats?.first_consultation || undefined,
      lastConsultationDate: stats?.last_consultation || undefined,
      consultationsCount: stats?.count || 0
    }
  })

  // Filter by date range if provided
  if (startDate || endDate) {
    result = result.filter(p => {
      if (!p.firstConsultationDate) return false

      const firstDate = new Date(p.firstConsultationDate)

      if (startDate && firstDate < new Date(startDate)) return false
      if (endDate && firstDate > new Date(endDate)) return false

      return true
    })
  }

  return { data: result, error: null }
}

export async function getPatientByIdAction(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  if (!patient) {
    return { data: null, error: 'Patient not found' }
  }

  // Get consultation stats for this patient
  const { data: consultations } = await supabase
    .from('consultations')
    .select('date_time')
    .eq('patient_id', id)
    .order('date_time', { ascending: true })

  const result: Patient = {
    id: patient.id,
    name: patient.name,
    dni: patient.dni || undefined,
    phone: patient.phone || undefined,
    email: patient.email || undefined,
    age: patient.age || undefined,
    notes: patient.notes || undefined,
    firstConsultationDate: consultations?.[0]?.date_time || undefined,
    lastConsultationDate: consultations?.[consultations.length - 1]?.date_time || undefined,
    consultationsCount: consultations?.length || 0
  }

  return { data: result, error: null }
}

export async function searchPatientsAction(query: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { data: null, error: 'Not authenticated' }
  }

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .or(`name.ilike.%${query}%,dni.ilike.%${query}%`)
    .order('name')

  if (error) {
    return { data: null, error: error.message }
  }

  if (!patients || patients.length === 0) {
    return { data: [], error: null }
  }

  const patientIds = patients.map(p => p.id)

  // Get consultation stats
  const { data: consultations } = await supabase
    .from('consultations')
    .select('patient_id, date_time')
    .in('patient_id', patientIds)
    .order('date_time', { ascending: true })

  // Build stats map
  const statsMap = new Map<string, ConsultationStats>()

  if (consultations) {
    consultations.forEach(c => {
      const existing = statsMap.get(c.patient_id)
      if (!existing) {
        statsMap.set(c.patient_id, {
          patient_id: c.patient_id,
          first_consultation: c.date_time,
          last_consultation: c.date_time,
          count: 1
        })
      } else {
        existing.last_consultation = c.date_time
        existing.count++
      }
    })
  }

  const result: Patient[] = patients.map(p => {
    const stats = statsMap.get(p.id)
    return {
      id: p.id,
      name: p.name,
      dni: p.dni || undefined,
      phone: p.phone || undefined,
      email: p.email || undefined,
      age: p.age || undefined,
      notes: p.notes || undefined,
      firstConsultationDate: stats?.first_consultation || undefined,
      lastConsultationDate: stats?.last_consultation || undefined,
      consultationsCount: stats?.count || 0
    }
  })

  return { data: result, error: null }
}

export async function createPatientAction(data: {
  name: string
  dni?: string
  phone?: string
  age?: string
  email?: string
  notes?: string
}): Promise<PatientResponse> {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      user_id: user.id,
      name: data.name,
      dni: data.dni || null,
      phone: data.phone || null,
      age: data.age || null,
      email: data.email || null,
      notes: data.notes || null
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  return { id: patient.id }
}

export async function updatePatientAction(
  id: string,
  data: {
    name?: string
    dni?: string
    phone?: string
    age?: string
    email?: string
    notes?: string
  }
) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const updateData: Record<string, string | null> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.dni !== undefined) updateData.dni = data.dni || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.age !== undefined) updateData.age = data.age || null
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.notes !== undefined) updateData.notes = data.notes || null

  const { error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  return { success: true }
}

export async function deletePatientAction(id: string) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Delete associated consultations first
  const { error: consultationsError } = await supabase
    .from('consultations')
    .delete()
    .eq('patient_id', id)

  if (consultationsError) {
    return { error: consultationsError.message }
  }

  // Delete patient
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  return { success: true }
}
