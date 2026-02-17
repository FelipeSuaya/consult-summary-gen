import { groqApi } from '@/lib/api'
import { LoggingService } from '@/lib/logging'
import { createClient } from '@/lib/supabase/client'

const UPLOAD_TIMEOUT_MS = 60_000
const UPLOAD_RETRIES = 2

export async function uploadToAssemblyAI(audioBlob: Blob): Promise<string> {
	let attemptsLeft = UPLOAD_RETRIES
	let lastError: unknown = null

	while (attemptsLeft >= 0) {
		try {
			await LoggingService.info('processing-pipeline', `Upload attempt ${UPLOAD_RETRIES - attemptsLeft + 1}/${UPLOAD_RETRIES + 1}`, {
				blobSize: audioBlob.size,
				blobType: audioBlob.type,
			})

			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

			const response = await fetch('/api/assemblyai/upload', {
				method: 'POST',
				body: audioBlob,
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`AssemblyAI upload error: ${response.status} - ${errorText}`)
			}

			const result = await response.json()

			if (!result.upload_url) {
				throw new Error('No upload URL received from AssemblyAI')
			}

			return result.upload_url
		} catch (error) {
			lastError = error

			await LoggingService.error('processing-pipeline', `Upload attempt ${UPLOAD_RETRIES - attemptsLeft + 1} failed`, {
				error: error instanceof Error ? error.message : 'Unknown error',
				remainingAttempts: attemptsLeft,
			})

			if (attemptsLeft > 0) {
				const backoffTime = 1000 * Math.pow(2, UPLOAD_RETRIES - attemptsLeft)
				await new Promise(resolve => setTimeout(resolve, backoffTime))
				attemptsLeft--
			} else {
				throw error
			}
		}
	}

	throw lastError || new Error('Unknown error uploading to AssemblyAI')
}

export async function transcribeAudio(audioUrl: string): Promise<string> {
	await LoggingService.info('processing-pipeline', 'Starting transcription', { audioUrl })

	const response = await fetch('/api/assemblyai/transcribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ audio_url: audioUrl }),
	})

	if (!response.ok) {
		const err = await response.json()
		throw new Error(err.error || 'Error transcribing audio')
	}

	const { text } = await response.json()

	await LoggingService.info('processing-pipeline', 'Transcription completed', {
		transcriptionLength: text.length,
	})

	return text
}

export async function generateSoapSummary(transcription: string): Promise<string> {
	await LoggingService.info('processing-pipeline', 'Generating SOAP summary')

	const response = await fetch('/api/openai/soap', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ transcription }),
	})

	if (!response.ok) {
		const err = await response.json()
		throw new Error(err.error || 'Error generating SOAP summary')
	}

	const { summary } = await response.json()

	return groqApi.correctMedicalTerms(summary)
}

export async function uploadAudioToStorage(
	audioBlob: Blob,
	consultationId: string,
): Promise<string> {
	const supabase = createClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		throw new Error('Not authenticated — cannot upload audio to storage')
	}

	const filePath = `${user.id}/${consultationId}.webm`

	await LoggingService.info('processing-pipeline', 'Uploading audio to Supabase Storage', {
		filePath,
		blobSize: audioBlob.size,
	})

	const { error } = await supabase.storage
		.from('consultation-audios')
		.upload(filePath, audioBlob, {
			contentType: 'audio/webm',
			upsert: true,
		})

	if (error) {
		throw new Error(`Failed to upload audio to storage: ${error.message}`)
	}

	const { data: urlData } = supabase.storage
		.from('consultation-audios')
		.getPublicUrl(filePath)

	await LoggingService.info('processing-pipeline', 'Audio uploaded to storage', {
		publicUrl: urlData.publicUrl,
	})

	return urlData.publicUrl
}
