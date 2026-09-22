import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/v1/');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it('preserves the configured path prefix and sends JSON with caller headers and options', async () => {
  const { http } = await import('./http');
  vi.mocked(fetch).mockResolvedValue(new Response('{"id":"record_1"}', { status: 201 }));
  const signal = new AbortController().signal;
  expect(await http('/records', { method: 'POST', body: { title: 'Test' }, headers: { Authorization: 'Bearer example' }, signal })).toEqual({ id: 'record_1' });
  const [url, options] = vi.mocked(fetch).mock.calls[0];
  expect(url).toBe('https://api.example.com/v1/records');
  expect(options).toMatchObject({ method: 'POST', body: '{"title":"Test"}', signal });
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer example');
  expect(new Headers(options?.headers).get('Content-Type')).toBe('application/json');
});

it('defaults to a same-origin API prefix and handles empty responses', async () => {
  vi.stubEnv('VITE_API_BASE_URL', '');
  const { http } = await import('./http');
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
  await expect(http<void>('records/1', { method: 'DELETE' })).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledWith('/api/records/1', expect.objectContaining({ method: 'DELETE' }));
  expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).has('Content-Type')).toBe(false);
});

it.each([
  ['{"message":"Access denied"}', 403, 'Access denied'],
  ['{"error":{"message":"Invalid input"}}', 422, 'Invalid input'],
  ['{"error":"Not found"}', 404, 'Not found'],
  ['<html>upstream failure</html>', 502, 'Request failed (502). Please try again.'],
  ['', 500, 'Request failed (500). Please try again.'],
])('normalizes HTTP errors without rendering raw responses', async (body, status, message) => {
  const { http, HttpError } = await import('./http');
  vi.mocked(fetch).mockResolvedValue(new Response(body, { status }));
  await expect(http('/records')).rejects.toMatchObject({ name: 'HttpError', status, message });
  vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(http('/records')).rejects.toBeInstanceOf(HttpError);
});

it('normalizes invalid JSON, network failures, and cancellation', async () => {
  const { http } = await import('./http');
  vi.mocked(fetch).mockResolvedValueOnce(new Response('not JSON', { status: 200 }));
  await expect(http('/records')).rejects.toMatchObject({ status: 200, message: 'The server returned an invalid JSON response.' });
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError('offline'));
  await expect(http('/records')).rejects.toMatchObject({ status: null, message: 'Unable to reach the server. Please try again.' });
  const controller = new AbortController();
  controller.abort();
  vi.mocked(fetch).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
  await expect(http('/records', { signal: controller.signal })).rejects.toMatchObject({ status: null, message: 'Request cancelled.' });
});
