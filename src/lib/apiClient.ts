import { supabase } from '../lib/supabaseClient'
import { API_CONFIG } from '../config/api.config'

/**
 * API Client with JWT authentication & request timeout
 */
const TIMEOUT_MS = 5000 // 5 second timeout for every request

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  /** fetch wrapper with AbortController timeout */
  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await fetch(url, { ...init, signal: controller.signal })
    } finally {
      clearTimeout(id)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<{ data: T | null; error: any }> {
    try {
      const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`)
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value)
        })
      }

      const response = await this.fetchWithTimeout(url.toString(), {
        method: 'GET',
        headers: await this.getHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.error || result }
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('API GET error:', error)
      return { data: null, error }
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: any }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.error || result }
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('API POST error:', error)
      return { data: null, error }
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: any }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.error || result }
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('API PUT error:', error)
      return { data: null, error }
    }
  }

  async patch<T>(endpoint: string, body?: any): Promise<{ data: T | null; error: any }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.error || result }
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('API PATCH error:', error)
      return { data: null, error }
    }
  }

  async delete<T>(endpoint: string): Promise<{ data: T | null; error: any }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        return { data: null, error: result.error || result }
      }

      return { data: result.data || result, error: null }
    } catch (error) {
      console.error('API DELETE error:', error)
      return { data: null, error }
    }
  }
}

export const apiClient = new ApiClient()
