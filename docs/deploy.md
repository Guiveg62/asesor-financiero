# Fase 10 — Publicación (Vercel)

De tu ordenador a una dirección de internet. La app ya compila para producción
(`npm run build` ✅). Faltan solo estos pasos, que necesitan tus cuentas.

## 1. Subir el código a GitHub

Ya está iniciado el repositorio git local con el primer commit. Crea un
repositorio vacío en [github.com/new](https://github.com/new) (privado) y luego,
en la carpeta del proyecto:

```bash
git remote add origin https://github.com/TU-USUARIO/asesor-financiero.git
git branch -M main
git push -u origin main
```

> `.env.local` NO se sube (está en `.gitignore`). Tus claves se quedan en tu equipo.

## 2. Importar en Vercel

1. Entra en [vercel.com/new](https://vercel.com/new) e inicia sesión con GitHub.
2. **Import** el repositorio `asesor-financiero`. Vercel detecta Next.js solo.
3. Antes de **Deploy**, abre **Environment Variables** y añade:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rfivicfvnlkwciyofdnn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | tu clave `sb_secret_…` de Supabase |
| `ANTHROPIC_API_KEY` | tu clave `sk-ant-…` de Anthropic |
| `ASESOR_PASSWORD` | una contraseña segura para el panel |

4. Pulsa **Deploy**. En ~1 minuto tendrás una URL `https://asesor-financiero.vercel.app`.

## 3. Comprobar

- `/` — la landing (ES/SV/EN).
- `/panel` — login del asesor (con `ASESOR_PASSWORD`).
- La entrevista y el plan necesitan **saldo en Anthropic** para conversar.

## Notas

- Cada `git push` a `main` vuelve a desplegar automáticamente.
- Supabase ya está en la nube: no hay que desplegar la base de datos.
- Recuerda cambiar `ASESOR_PASSWORD` (por defecto es `asesor` en local).
