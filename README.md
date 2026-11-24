# PWA Web Oropeza

Aplicacion web del ecosistema de comercio GestoPago. Consume el backend Spring
Boot (repo `Prueba-Oropeza_Yepiz`) mediante un proxy server-side que mantiene
el JWT en cookies **httpOnly** (nunca accesibles desde JavaScript).

## Stack
- **Next.js 15** (App Router) + **TypeScript** strict
- **Material UI v6** para componentes y tema
- **Zustand** para estado global del cliente
- **Zod** + **react-hook-form** para validacion
- Cookies `httpOnly + Secure + SameSite=Strict` para el JWT
- CSP estricta y security headers en `next.config.ts`

## Arrancar local

```bash
# Instalar deps (una vez)
npm install

# Copia .env.example a .env y setea BACKEND_URL
cp .env.example .env

# Dev server
npm run dev
```

Abre http://localhost:3000. El backend debe estar corriendo en `http://localhost:8081`.

## Arquitectura de seguridad

- **JWT nunca sale del servidor**: el browser solo recibe cookies httpOnly.
- **Backend URL oculta**: el cliente llama `/api/proxy/...` y Next.js forwardea al backend.
- **Validacion doble**: Zod en cliente antes del submit + Bean Validation en backend.
- **Rutas protegidas**: `middleware.ts` verifica cookie de sesion antes de renderizar dashboard.
- **CSP + HSTS + X-Frame-Options**: defensa en profundidad contra XSS/clickjacking.

## Estructura

```
app/
  (auth)/          Login y 2FA (publicos)
  (dashboard)/     Catalogo, compra, historial (protegidos por middleware)
  api/proxy/       Proxy server-side al backend
lib/
  api-client.ts    Fetch wrapper
  auth/            Cookies, schemas Zod, helpers
  store/           Zustand stores
  theme/           Tema MUI
components/
  auth/            Formularios de login/2FA
  common/          Compartidos
```

## Deploy

Vercel: `vercel --prod`. En Vercel Settings setea `BACKEND_URL` apuntando a la
URL de Render del backend.
