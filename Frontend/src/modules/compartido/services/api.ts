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
