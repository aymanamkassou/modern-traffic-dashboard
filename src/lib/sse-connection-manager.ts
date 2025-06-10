import { SSEEvent } from '@/hooks/use-server-sent-events'

interface SSEConnection {
  eventSource: EventSource
  subscribers: Set<string>
  lastActivity: number
  retryCount: number
  maxRetries: number
}

interface SSESubscriber {
  id: string
  onEvent: (event: SSEEvent) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

class SSEConnectionManager {
  private connections = new Map<string, SSEConnection>()
  private subscribers = new Map<string, SSESubscriber>()
  private maxConnections = 4 // Browser limit consideration
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private heartbeatInterval = 30000

  constructor() {
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup()
      })
      
      // Periodic cleanup of inactive connections
      setInterval(() => {
        this.cleanupInactiveConnections()
      }, 60000) // Every minute
    }
  }

  subscribe(url: string, subscriber: SSESubscriber): () => void {
    // Prevent SSR issues
    if (typeof window === 'undefined') {
      return () => {}
    }

    console.log(`🔌 SSE Manager: Subscribing to ${url}`, { subscriberId: subscriber.id })
    
    this.subscribers.set(subscriber.id, subscriber)
    
    // Get or create connection
    let connection = this.connections.get(url)
    if (!connection) {
      if (this.connections.size >= this.maxConnections) {
        console.warn(`⚠️ SSE Manager: Max connections (${this.maxConnections}) reached. Reusing existing connection.`)
        // Find the connection with the most subscribers to share
        const [sharedUrl] = Array.from(this.connections.entries())
          .sort(([,a], [,b]) => b.subscribers.size - a.subscribers.size)[0] || []
        
        if (sharedUrl) {
          connection = this.connections.get(sharedUrl)!
          console.log(`🔄 SSE Manager: Sharing connection ${sharedUrl} for ${url}`)
        }
      }
      
      if (!connection) {
        connection = this.createConnection(url)
        this.connections.set(url, connection)
      }
    }
    
    connection.subscribers.add(subscriber.id)
    connection.lastActivity = Date.now()
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(url, subscriber.id)
    }
  }

  private createConnection(url: string): SSEConnection {
    console.log(`🚀 SSE Manager: Creating new connection to ${url}`)
    
    const connection: SSEConnection = {
      eventSource: new EventSource(url),
      subscribers: new Set(),
      lastActivity: Date.now(),
      retryCount: 0,
      maxRetries: 5
    }

    this.setupEventHandlers(url, connection)
    return connection
  }

  private setupEventHandlers(url: string, connection: SSEConnection) {
    const { eventSource } = connection

    eventSource.onopen = () => {
      console.log(`✅ SSE Manager: Connected to ${url}`)
      connection.retryCount = 0
      connection.lastActivity = Date.now()
      
      // Notify all subscribers
      connection.subscribers.forEach(subscriberId => {
        const subscriber = this.subscribers.get(subscriberId)
        subscriber?.onConnect?.()
      })
    }

    eventSource.onmessage = (event) => {
      connection.lastActivity = Date.now()
      
      try {
        const parsedData = JSON.parse(event.data)
        const sseEvent: SSEEvent = {
          type: parsedData.type || 'message',
          data: parsedData.data || parsedData,
          timestamp: parsedData.timestamp || new Date().toISOString(),
          id: event.lastEventId || undefined
        }

        console.log(`📨 SSE Manager: Event received on ${url}`, { 
          type: sseEvent.type, 
          subscribers: connection.subscribers.size 
        })

        // Broadcast to all subscribers
        connection.subscribers.forEach(subscriberId => {
          const subscriber = this.subscribers.get(subscriberId)
          subscriber?.onEvent?.(sseEvent)
        })

      } catch (parseError) {
        console.error(`❌ SSE Manager: Parse error on ${url}:`, parseError)
        
        const errorEvent: SSEEvent = {
          type: 'parse_error',
          data: { originalData: event.data, error: parseError },
          timestamp: new Date().toISOString()
        }

        connection.subscribers.forEach(subscriberId => {
          const subscriber = this.subscribers.get(subscriberId)
          subscriber?.onEvent?.(errorEvent)
        })
      }
    }

    eventSource.onerror = (error) => {
      console.error(`💥 SSE Manager: Connection error on ${url}:`, error)
      
      // Notify subscribers of error
      connection.subscribers.forEach(subscriberId => {
        const subscriber = this.subscribers.get(subscriberId)
        subscriber?.onError?.(new Error(`SSE connection failed: ${url}`))
      })

      // Attempt reconnection with exponential backoff
      if (connection.retryCount < connection.maxRetries) {
        const delay = Math.min(
          this.reconnectDelay * Math.pow(2, connection.retryCount),
          this.maxReconnectDelay
        )
        
        console.log(`🔄 SSE Manager: Reconnecting to ${url} in ${delay}ms (attempt ${connection.retryCount + 1}/${connection.maxRetries})`)
        
        setTimeout(() => {
          if (this.connections.has(url) && connection.subscribers.size > 0) {
            this.reconnect(url)
          }
        }, delay)
        
        connection.retryCount++
      } else {
        console.error(`❌ SSE Manager: Max retries reached for ${url}. Giving up.`)
        this.closeConnection(url)
      }
    }
  }

  private reconnect(url: string) {
    console.log(`🔄 SSE Manager: Reconnecting to ${url}`)
    
    const oldConnection = this.connections.get(url)
    if (!oldConnection) return

    // Close old connection
    oldConnection.eventSource.close()
    
    // Create new connection
    const newConnection = this.createConnection(url)
    newConnection.subscribers = oldConnection.subscribers
    
    this.connections.set(url, newConnection)
  }

  private unsubscribe(url: string, subscriberId: string) {
    console.log(`🔌 SSE Manager: Unsubscribing ${subscriberId} from ${url}`)
    
    const connection = this.connections.get(url)
    if (connection) {
      connection.subscribers.delete(subscriberId)
      
      // Close connection if no more subscribers
      if (connection.subscribers.size === 0) {
        console.log(`🔌 SSE Manager: No more subscribers for ${url}, closing connection`)
        this.closeConnection(url)
      }
    }
    
    this.subscribers.delete(subscriberId)
  }

  private closeConnection(url: string) {
    const connection = this.connections.get(url)
    if (connection) {
      console.log(`🔌 SSE Manager: Closing connection to ${url}`)
      
      // Notify subscribers of disconnection
      connection.subscribers.forEach(subscriberId => {
        const subscriber = this.subscribers.get(subscriberId)
        subscriber?.onDisconnect?.()
      })
      
      connection.eventSource.close()
      this.connections.delete(url)
    }
  }

  private cleanupInactiveConnections() {
    const now = Date.now()
    const inactiveThreshold = 5 * 60 * 1000 // 5 minutes
    
    for (const [url, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > inactiveThreshold && connection.subscribers.size === 0) {
        console.log(`🧹 SSE Manager: Cleaning up inactive connection to ${url}`)
        this.closeConnection(url)
      }
    }
  }

  private cleanup() {
    console.log('🧹 SSE Manager: Cleaning up all connections')
    for (const url of this.connections.keys()) {
      this.closeConnection(url)
    }
    this.subscribers.clear()
  }

  // Debug methods
  getConnectionStatus() {
    return {
      activeConnections: this.connections.size,
      totalSubscribers: this.subscribers.size,
      connections: Array.from(this.connections.entries()).map(([url, conn]) => ({
        url,
        subscribers: conn.subscribers.size,
        state: conn.eventSource.readyState,
        lastActivity: new Date(conn.lastActivity).toISOString(),
        retryCount: conn.retryCount
      }))
    }
  }
}

// Singleton instance
export const sseManager = new SSEConnectionManager()

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__sseManager = sseManager
} 