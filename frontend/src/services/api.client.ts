import { getApiBaseUrl } from '../config/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let json: any = null;
      try {
        json = await response.json();
      } catch {
        json = null;
      }

      if (!response.ok) {
        const errorMessage =
          json?.error ||
          json?.message ||
          `Request failed with HTTP status ${response.status} (${response.statusText})`;
        throw new Error(errorMessage);
      }

      return json;
    } catch (err: any) {
      if (err.message && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
        throw new Error(
          `Unable to connect to MiniLedger backend at ${baseUrl}. Please check server is running and API URL is correct.`
        );
      }
      throw err;
    }
  }

  get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  patch<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadReceipt(fileUri: string, filename = 'receipt.jpg'): Promise<{ url: string }> {
    const formData = new FormData();
    // @ts-ignore - React Native FormData accepts uri/name/type object
    formData.append('receipt', {
      uri: fileUri,
      name: filename,
      type: 'image/jpeg',
    });

    const res = await this.post<{ success: boolean; data: { url: string } }>('/api/upload/receipt', formData);
    return res.data;
  }
}

export const api = new ApiClient();
