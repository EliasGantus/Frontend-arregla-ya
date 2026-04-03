import { configureHttpClient, httpClient } from '@/shared/api/http-client';

describe('httpClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    configureHttpClient({});
  });

  it('normaliza errores de red con un mensaje claro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(httpClient.get('/service-requests')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    });
  });

  it('reintenta una vez cuando recibe 401 y el refresh resuelve', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const refreshSpy = vi.fn().mockResolvedValue(true);

    vi.stubGlobal('fetch', fetchMock);
    configureHttpClient({
      getAccessToken: () => 'access-token',
      refreshAccessToken: refreshSpy,
      onUnauthorized: vi.fn(),
    });

    await expect(httpClient.get<{ ok: boolean }>('/me')).resolves.toEqual({ ok: true });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ejecuta logout forzado cuando no puede refrescar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const logoutSpy = vi.fn();

    vi.stubGlobal('fetch', fetchMock);
    configureHttpClient({
      getAccessToken: () => 'expired',
      refreshAccessToken: vi.fn().mockResolvedValue(false),
      onUnauthorized: logoutSpy,
    });

    await expect(httpClient.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
