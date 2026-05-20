# Parqués Distribuido — Frontend

Next.js 16 + TypeScript + TailwindCSS + Zustand

## Variables de entorno requeridas

Crea un archivo `.env.local` (local) o configura en Vercel:

```
NEXT_PUBLIC_API_URL=https://tu-backend-railway.up.railway.app
NEXT_PUBLIC_WS_URL=wss://tu-backend-ws.up.railway.app
```

## Correr en local

```bash
npm install
npm run dev
```

## Desplegar en Vercel

1. Conecta este repo en vercel.com
2. Agrega las variables de entorno en Settings → Environment Variables
3. Deploy automático en cada push a main
