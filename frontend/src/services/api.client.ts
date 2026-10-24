import { Platform } from 'react-native';
import { getApiBaseUrl } from '../config/api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

function isFormDataBody(body: unknown): boolean {
  if (body == null || typeof body !== 'object') return false;
  const globalCtor = (globalThis as { FormData?: typeof FormData }).FormData;
  if (typeof globalCtor === 'function' && body instanceof globalCtor) return true;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return true;
  if (
    typeof window !== 'undefined' &&
    typeof window.FormData === 'function' &&
    body instanceof window.FormData
  ) {
    return true;
  }
  // React Native FormData stores parts on `_parts` / `getParts()`.
  const maybe = body as { getParts?: unknown; _parts?: unknown };
  return typeof maybe.getParts === 'function' || Array.isArray(maybe._parts);
}

function getBrowserFormDataCtor(): typeof FormData {
  if (typeof window !== 'undefined' && typeof window.FormData === 'function') {
    return window.FormData;
  }
  return FormData;
}

function getBrowserFetch(): typeof fetch {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  return fetch;
}

function inferMimeType(filename: string, provided?: string | null): string {
  const given = (provided || '').toLowerCase().trim();
  if (given && given !== 'application/octet-stream') {
    return given;
  }
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

function assertImageUpload(mimeType: string, sizeBytes?: number | null) {
  const type = mimeType.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.includes(type) && type !== 'image/heic') {
    throw new Error(
      `Invalid file type "${mimeType || 'unknown'}". Please upload a JPEG, PNG, or WebP image.`
    );
  }
  if (typeof sizeBytes === 'number' && sizeBytes > MAX_UPLOAD_BYTES) {
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(1);
    throw new Error(`File is too large (${sizeMB} MB). Maximum allowed size is 5 MB.`);
  }
}

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
    const sendingFormData = isFormDataBody(options.body);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Do NOT set Content-Type for FormData -- the runtime must generate the
    // multipart boundary. A manual multipart/form-data header has no boundary
    // and the backend cannot parse the file.
    if (!sendingFormData) {
      headers['Content-Type'] = 'application/json';
    } else {
      delete headers['Content-Type'];
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchFn = Platform.OS === 'web' ? getBrowserFetch() : fetch;

    try {
      const response = await fetchFn(url, {
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
      if (
        err.message &&
        (err.message.includes('Network request failed') ||
          err.message.includes('Failed to fetch'))
      ) {
        throw new Error(
          `Unable to connect to MiniLedger backend at ${getApiBaseUrl()}. Please check server is running and API URL is correct.`
        );
      }
      throw err;
    }
  }

  get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T = any>(endpoint: string, data?: any): Promise<T> {
    const sendingFormData = isFormDataBody(data);
    return this.request<T>(endpoint, {
      method: 'POST',
      body: sendingFormData ? data : data === undefined ? undefined : JSON.stringify(data),
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

  /**
   * Upload a receipt image.
   *
   * Expo SDK 57 replaces native `fetch` with a WinterCG implementation that
   * serializes FormData via convertFormDataAsync(). That helper only accepts
   * string and Blob parts. React Native FormData stores files as
   * `{ uri, name, type }`, which throws "Unsupported FormDataPart implementation".
   *
   * Web: append a real browser File to window.FormData and send it with the
   * existing HTTP client (window.fetch). Do not set Content-Type.
   * Native: send the RN `{ uri, name, type }` part with XMLHttpRequest, whose
   * native bridge streams the file as multipart/form-data with a boundary.
   */
  async uploadReceipt(
    fileUri: string,
    filename = 'receipt.jpg',
    file?: File,
    mimeType?: string | null,
    fileSize?: number | null
  ): Promise<{ url: string }> {
    if (Platform.OS === 'web') {
      return this.uploadReceiptOnWeb(fileUri, filename, file, mimeType, fileSize);
    }
    return this.uploadReceiptOnNative(fileUri, filename, mimeType, fileSize);
  }

  private async uploadReceiptOnWeb(
    fileUri: string,
    filename: string,
    file?: File,
    mimeType?: string | null,
    fileSize?: number | null
  ): Promise<{ url: string }> {
    const BrowserFile = typeof window !== 'undefined' ? window.File : File;
    const BrowserFormData = getBrowserFormDataCtor();

    let uploadFile: File;
    if (file && BrowserFile && file instanceof BrowserFile) {
      uploadFile = file;
    } else {
      const blobResponse = await getBrowserFetch()(fileUri);
      if (!blobResponse.ok) {
        throw new Error('Failed to read the selected image file.');
      }
      const blob = await blobResponse.blob();
      const type = inferMimeType(filename, mimeType || blob.type);
      uploadFile = new BrowserFile([blob], filename || 'receipt.jpg', { type });
    }

    const type = inferMimeType(filename, uploadFile.type || mimeType);
    assertImageUpload(type, uploadFile.size ?? fileSize);

    const formData = new BrowserFormData();
    formData.append('receipt', uploadFile, filename || uploadFile.name || 'receipt.jpg');

    const res = await this.post<{ success: boolean; data: { url: string } }>(
      '/api/upload/receipt',
      formData
    );
    if (!res?.data?.url) {
      throw new Error('Upload succeeded but server returned an unexpected response.');
    }
    return res.data;
  }

  private async uploadReceiptOnNative(
    fileUri: string,
    filename: string,
    mimeType?: string | null,
    fileSize?: number | null
  ): Promise<{ url: string }> {
    const type = inferMimeType(filename, mimeType);
    assertImageUpload(type, fileSize);

    const formData = new FormData();
    // @ts-expect-error React Native FormData accepts { uri, name, type }
    formData.append('receipt', {
      uri: fileUri,
      name: filename,
      type,
    });

    return this.uploadReceiptWithXhr(formData);
  }

  private uploadReceiptWithXhr(formData: FormData): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      const url = `${getApiBaseUrl()}/api/upload/receipt`;
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Accept', 'application/json');
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }

      xhr.onload = () => {
        let json: any = null;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {
          json = null;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (json?.data?.url) {
            resolve(json.data);
          } else {
            reject(
              new Error('Upload succeeded but server returned an unexpected response.')
            );
          }
        } else {
          reject(
            new Error(
              json?.error || json?.message || `Upload failed with HTTP status ${xhr.status}`
            )
          );
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Unable to connect to MiniLedger backend at ${getApiBaseUrl()}. Please check server is running and API URL is correct.`
          )
        );
      };

      xhr.send(formData);
    });
  }
}

export const api = new ApiClient();
