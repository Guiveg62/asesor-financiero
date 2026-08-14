# Roadmap — Asesor Financiero

Plan de construcción de la app web (sistema sueco, kr) para Alberto y Margaretha.

**Última actualización:** 2026-08-13 · **Stack:** Next.js + Supabase + API de Claude (`claude-opus-5`). Despliegue a Vercel en la Fase 10.

---

## Las diez fases

| # | Fase | Qué es | Estado |
|---|---|---|---|
| 01 | **Esqueleto** | La app Next.js conectada a Supabase y al motor verificado | ✅ |
| 02 | **Base de datos** | Las tablas de la entrevista en Supabase (4 tablas + RLS) | ✅ |
| 03 | **Landing y entrada** | Página pública; cualquiera empieza su diagnóstico | ✅ |
| 04 | **La entrevista que habla** | Chat que sigue el guion, pregunta a pregunta (`claude-opus-5`) | ✅ |
| 05 | **La entrevista que escucha** | Cada dato se guarda en `answers` con su etiqueta; ficha en vivo | ✅ |
| 06 | **Confirmación y cierre** | El cliente revisa su ficha y la corrige antes de calcular | 🔨 en curso |
| 07 | **Diagnóstico** | El motor calcula por primera vez; sale una probabilidad | ⬜ |
| 08 | **El plan en cristiano** | El modelo traduce los números a algo que se entiende | ⬜ |
| 09 | **El panel** | Login de verdad y todos los clientes de un vistazo | ⬜ |
| 10 | **Publicación** | De tu ordenador a una dirección de internet (Vercel) | ⬜ |

**Extra ya hecho:** app trilingüe (ES / SV / EN) con selector en landing y entrevista.

---

## Bloque 1 (Fases 1–5) — ✅ completado

Módulo 1 (entrevista → ficha) funcionando como web real: landing → crea entrevista → chat que sigue `plantilla-entrevista.md` → guarda cada respuesta con su etiqueta en Supabase, con la ficha rellenándose en vivo. Verificado end-to-end (el chat solo necesita saldo en la cuenta de Anthropic para conversar).

## Bloque 2 (Fases 6–10) — en marcha

- **06 Confirmación y cierre:** cuando la entrevista reúne las 13 variables, el cliente ve su ficha completa (valores + etiquetas), la corrige por el chat si hace falta, y pulsa **Confirmar** para cerrarla (`status = confirmada`). Es la puerta previa al cálculo.
- **07 Diagnóstico:** el Módulo 2 (motor, hoy en markdown: `informes/modulo-2-motor.md` + `reglas-recomendacion.md`) lee la ficha confirmada y calcula con Python: camino recorrido, proyección, gap, viabilidad. La salida es una probabilidad/veredicto.
- **08 El plan en cristiano:** `claude-opus-5` traduce el informe técnico a lenguaje claro para el cliente (sin jerga), respetando los límites de las reglas.
- **09 El panel:** autenticación real (asesor) y listado de todos los clientes/fichas/informes de un vistazo.
- **10 Publicación:** despliegue a Vercel + Supabase en producción; de localhost a una URL pública.

---

## Referencias

- `plantilla-entrevista.md` — guion de la entrevista (fuente única que lee el chat)
- `reglas-recomendacion.md` — política del motor y única fuente de rentabilidades
- `supuestos.md` — inflación, fiscalidad, umbrales
- `informes/modulo-2-motor.md` — especificación del motor (Fase 07)
