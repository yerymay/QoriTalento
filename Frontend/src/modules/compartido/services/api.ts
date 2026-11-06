export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}
export async function requestJson<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/${path.replace(/^\//, '')}`, {
      method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/json', ...(method !== 'GET' ? {'Content-Type':'application/json','X-Qori-Client':'web'} : {}) },
      ...(data !== undefined ? {body: JSON.stringify(data)} : {}),
    });
  } catch { throw new ApiError('No se pudo conectar. Revisa tu conexión e intenta de nuevo; tus datos siguen en el formulario.',0); }
  const body = response.status === 204 ? undefined : await response.json().catch(()=>undefined);
  if (!response.ok) throw new ApiError(body?.error?.message ?? 'No se pudo completar la operación. Intenta de nuevo.',response.status,body?.error?.code);
  return body as T;
}
export const getJson = <T>(path: string) => requestJson<T>(path);

export function uploadFile<T>(path: string, method: 'POST' | 'PUT', file: File, signal: AbortSignal, progress: (value: number | null) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(), data = new FormData();
    data.append('cv', file);
    xhr.open(method, '/api/v1/' + path.replace(/^\//, ''));
    xhr.withCredentials = true; xhr.setRequestHeader('X-Qori-Client', 'web'); xhr.responseType = 'json'; xhr.timeout = 60000;
    xhr.upload.onprogress = event => progress(event.lengthComputable ? Math.round(event.loaded / event.total * 100) : null);
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response as T); else reject(new ApiError(xhr.response?.error?.message ?? 'No se pudo completar la operación.', xhr.status, xhr.response?.error?.code)); };
    xhr.onerror = () => reject(new ApiError('No se pudo conectar. Consulta el estado antes de reintentar.', 0));
    xhr.ontimeout = xhr.onerror; xhr.onabort = () => reject(new ApiError('Carga cancelada. Consulta el estado antes de reintentar.', 0));
    signal.addEventListener('abort', () => xhr.abort(), { once: true });
    if (signal.aborted) { reject(new ApiError('Carga cancelada.', 0)); return; }
    xhr.send(data);
  });
}