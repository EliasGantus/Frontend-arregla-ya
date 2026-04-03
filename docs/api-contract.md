# Contrato esperado entre frontend y backend

## Base URL
- Definida por `VITE_API_URL`.
- Se asume API REST JSON.

## Auth
- `POST /auth/login`
  - request:
    ```json
    {
      "email": "cliente@arreglaya.com",
      "password": "123456"
    }
    ```
  - response:
    ```json
    {
      "accessToken": "jwt",
      "refreshToken": "jwt",
      "user": {
        "id": "uuid",
        "email": "cliente@arreglaya.com",
        "fullName": "Lucia Benitez",
        "role": "cliente",
        "city": "Buenos Aires",
        "zone": "Caballito"
      }
    }
    ```
- `POST /auth/refresh`
  - request:
    ```json
    {
      "refreshToken": "jwt"
    }
    ```
  - response:
    ```json
    {
      "accessToken": "jwt",
      "refreshToken": "jwt"
    }
    ```
- `POST /auth/logout`
  - request:
    ```json
    {
      "refreshToken": "jwt"
    }
    ```
  - response: `204 No Content` o `200`.

## Usuario autenticado
- `GET /me`
- `PATCH /me`

## Marketplace
- `GET /service-requests`
- `POST /service-requests`
- `GET /quotes/me`
- `POST /service-requests/:id/quotes`

## Admin
- `GET /admin/users`
- `GET /admin/service-requests`

## Manejo de errores esperado
- JSON homogéneo:
  ```json
  {
    "message": "Descripción legible",
    "code": "OPTIONAL_MACHINE_CODE",
    "details": {}
  }
  ```
- `401` debe indicar token inválido o expirado para permitir refresh.
