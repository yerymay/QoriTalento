// Cliente HTTP compartido. En desarrollo se utiliza el proxy /api → Express.
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v1/${path.replace(/^\//, '')}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}
