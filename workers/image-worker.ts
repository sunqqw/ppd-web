import { processImage, type ProcessImagePayload, type ProcessImageResult } from '../lib/image/pipeline'

export interface WorkerRequest {
  id: string
  type: 'process-image'
  payload: ProcessImagePayload
}

export interface WorkerResponse {
  id: string
  type: 'process-image-result' | 'error'
  payload?: ProcessImageResult
  message?: string
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data
  if (type !== 'process-image') return

  try {
    const result = processImage(payload)
    const response: WorkerResponse = { id, type: 'process-image-result', payload: result }
    self.postMessage(response)
  }
  catch (err) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      message: err instanceof Error ? err.message : '处理失败',
    }
    self.postMessage(response)
  }
}
