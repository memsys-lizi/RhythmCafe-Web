import { computed, ref } from 'vue'

export const MOD_BRIDGE_PORT = 2771
export const MOD_BRIDGE_BASE_URL = `http://127.0.0.1:${MOD_BRIDGE_PORT}`

export type ModConnectionStatus = 'unknown' | 'checking' | 'connected' | 'disconnected'
export type ModProgressState =
  | 'preparing'
  | 'downloading'
  | 'extracting'
  | 'opening'
  | 'success'
  | 'error'

export interface ModHealth {
  connected: boolean
  modVersion: string
  port: number
  scene: string
  gameReady: boolean
  busy: boolean
}

export interface OpenLevelPayload {
  levelId: string
  downloadUrl: string
  fileName: string
}

export interface ModProgress {
  requestId: string
  levelId: string
  state: ModProgressState
  loaded: number
  total: number
  percentage: number
  message: string
}

export interface ModBridgeResponse {
  success: boolean
  state?: string
  code?: string
  message?: string
  requestId?: string
}

export class ModBridgeError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code = 'MOD_BRIDGE_ERROR', status = 0) {
    super(message)
    this.name = 'ModBridgeError'
    this.code = code
    this.status = status
  }
}

const status = ref<ModConnectionStatus>('unknown')
const health = ref<ModHealth | null>(null)
const isModalOpen = ref(false)
const downloadProgress = ref<ModProgress | null>(null)
const activeLevelId = ref<string | null>(null)

let pollingTimer: number | null = null
let clearProgressTimer: number | null = null
let eventSource: EventSource | null = null
let eventStreamPromise: Promise<boolean> | null = null

function parseProgressEvent(event: Event): ModProgress | null {
  try {
    const data = JSON.parse((event as MessageEvent<string>).data) as Partial<ModProgress>

    if (
      typeof data.requestId !== 'string' ||
      typeof data.levelId !== 'string' ||
      typeof data.state !== 'string'
    ) {
      return null
    }

    return {
      requestId: data.requestId,
      levelId: data.levelId,
      state: data.state as ModProgressState,
      loaded: typeof data.loaded === 'number' ? data.loaded : 0,
      total: typeof data.total === 'number' ? data.total : -1,
      percentage: typeof data.percentage === 'number' ? data.percentage : -1,
      message: typeof data.message === 'string' ? data.message : '',
    }
  } catch {
    return null
  }
}

function bindEventSource(source: EventSource) {
  source.addEventListener('progress', (event) => {
    const nextProgress = parseProgressEvent(event)
    if (!nextProgress || nextProgress.levelId !== activeLevelId.value) return

    downloadProgress.value = nextProgress
  })
}

async function ensureEventStream(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (eventSource?.readyState === EventSource.OPEN) return true
  if (eventStreamPromise) return eventStreamPromise

  eventSource?.close()
  const source = new EventSource(`${MOD_BRIDGE_BASE_URL}/events`)
  eventSource = source
  bindEventSource(source)

  eventStreamPromise = new Promise<boolean>((resolve) => {
    let settled = false
    let opened = false
    const timeout = window.setTimeout(() => finish(false), 1500)

    const finish = (connected: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      resolve(connected)
    }

    source.onopen = () => {
      opened = true
      finish(true)
    }
    source.onerror = () => {
      if (!opened) finish(false)
    }
  }).then((connected) => {
    eventStreamPromise = null
    if (!connected && eventSource === source) {
      source.close()
      eventSource = null
    }
    return connected
  })

  return eventStreamPromise
}

function scheduleProgressCleanup() {
  if (clearProgressTimer !== null) {
    window.clearTimeout(clearProgressTimer)
  }

  clearProgressTimer = window.setTimeout(() => {
    downloadProgress.value = null
    activeLevelId.value = null
    clearProgressTimer = null
  }, 5000)
}

export function useModBridge() {
  const checkConnection = async (options?: { silent?: boolean }): Promise<boolean> => {
    if (typeof window === 'undefined') return false

    if (!options?.silent) {
      status.value = 'checking'
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2500)

    try {
      const response = await fetch(`${MOD_BRIDGE_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      })
      const data = (await response.json()) as ModHealth

      if (!response.ok || data.connected !== true) {
        throw new ModBridgeError('Mod 返回了无效的连接状态。', 'INVALID_HEALTH', response.status)
      }

      health.value = data
      status.value = 'connected'
      return true
    } catch {
      health.value = null
      status.value = 'disconnected'
      return false
    } finally {
      window.clearTimeout(timeout)
    }
  }

  const openLevel = async (payload: OpenLevelPayload): Promise<ModBridgeResponse> => {
    if (typeof window === 'undefined') {
      throw new ModBridgeError('Mod 连接只能在浏览器中使用。', 'CLIENT_ONLY')
    }

    if (clearProgressTimer !== null) {
      window.clearTimeout(clearProgressTimer)
      clearProgressTimer = null
    }

    activeLevelId.value = payload.levelId
    downloadProgress.value = {
      requestId: '',
      levelId: payload.levelId,
      state: 'preparing',
      loaded: 0,
      total: -1,
      percentage: -1,
      message: '正在连接 Mod。',
    }

    await ensureEventStream()

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 5 * 60 * 1000)

    try {
      const response = await fetch(`${MOD_BRIDGE_BASE_URL}/open-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      const data = (await response.json()) as ModBridgeResponse

      if (data.requestId && downloadProgress.value) {
        downloadProgress.value = {
          ...downloadProgress.value,
          requestId: data.requestId,
        }
      }

      if (!response.ok || !data.success) {
        throw new ModBridgeError(
          data.message || 'Mod 无法打开谱面。',
          data.code || 'OPEN_LEVEL_FAILED',
          response.status,
        )
      }

      scheduleProgressCleanup()
      return data
    } catch (error) {
      if (error instanceof ModBridgeError) {
        downloadProgress.value = {
          ...(downloadProgress.value as ModProgress),
          state: 'error',
          message: error.message,
        }
        scheduleProgressCleanup()
        throw error
      }

      const bridgeError = new ModBridgeError(
        '无法连接到 Mod，请确认 Mod 已启动并重试。',
        'MOD_UNAVAILABLE',
      )
      downloadProgress.value = {
        ...(downloadProgress.value as ModProgress),
        state: 'error',
        message: bridgeError.message,
      }
      scheduleProgressCleanup()
      throw bridgeError
    } finally {
      window.clearTimeout(timeout)
    }
  }

  const openConnectionModal = () => {
    isModalOpen.value = true
  }

  const closeConnectionModal = () => {
    isModalOpen.value = false
  }

  const startPolling = () => {
    if (typeof window === 'undefined' || pollingTimer !== null) return

    void checkConnection()
    pollingTimer = window.setInterval(() => {
      void checkConnection({ silent: true })
    }, 3000)
  }

  const stopPolling = () => {
    if (pollingTimer === null) return

    window.clearInterval(pollingTimer)
    pollingTimer = null
  }

  const statusLabel = computed(() => {
    switch (status.value) {
      case 'connected':
        return '已连接'
      case 'checking':
        return '检测中'
      case 'disconnected':
        return '未连接'
      default:
        return '连接 Mod'
    }
  })

  return {
    status,
    statusLabel,
    health,
    isModalOpen,
    downloadProgress,
    activeLevelId,
    checkConnection,
    openLevel,
    openConnectionModal,
    closeConnectionModal,
    startPolling,
    stopPolling,
  }
}
