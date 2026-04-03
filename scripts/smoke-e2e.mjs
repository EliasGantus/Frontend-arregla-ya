const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:5173';
const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:3000';

const waitForOk = async (url, label, retries = 30) => {
  for (let index = 0; index < retries; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`No se pudo alcanzar ${label} en ${url}.`);
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

await waitForOk(`${backendUrl}/health`, 'backend');
await waitForOk(`${frontendUrl}/login`, 'frontend');

const loginResponse = await fetch(`${backendUrl}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'cliente@arreglaya.com',
    password: '123456',
  }),
});

assert(loginResponse.ok, `Login falló con status ${loginResponse.status}.`);

const loginPayload = await loginResponse.json();
assert(loginPayload.accessToken, 'El login no devolvió accessToken.');

const requestsResponse = await fetch(`${backendUrl}/service-requests`, {
  headers: {
    Authorization: `Bearer ${loginPayload.accessToken}`,
  },
});

assert(requestsResponse.ok, `Listado de solicitudes falló con status ${requestsResponse.status}.`);

const requestsPayload = await requestsResponse.json();
assert(Array.isArray(requestsPayload), 'La respuesta de solicitudes no es un array.');

console.log(
  JSON.stringify(
    {
      frontend: `${frontendUrl}/login`,
      backend: `${backendUrl}/health`,
      login: 'ok',
      serviceRequests: requestsPayload.length,
    },
    null,
    2,
  ),
);
