# Supabase — base de datos de la entrevista

Base de datos del **Módulo 1** (entrevista → ficha) del Asesor Financiero.

## Cómo aplicar el esquema

1. Entra a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor**.
2. Abre `migrations/0001_init.sql`, copia todo su contenido y pégalo.
3. Pulsa **Run**. Debería crear 4 tablas, 4 enums, 1 trigger e índices.

> Si usas la CLI de Supabase con el proyecto enlazado, también vale `supabase db push`.

## Modelo de datos

| Tabla | Qué guarda |
|---|---|
| `interviews` | Una fila por entrevista (una persona). Idioma, estado, puntero al guion, vínculo de pareja, token de sesión. |
| `answers` | Una fila por variable respondida (las 13 del guion), **cada una con su etiqueta** `confirmado / estimado / pendiente`. `UPSERT` por `(interview_id, variable)`. |
| `client_tasks` | Tareas para el cliente antes de la reunión (p. ej. consultar minPension.se). |
| `interview_notes` | Notas para el asesor: ambigüedades, contradicciones, contexto útil. |

Las 13 variables (enum `variable_key`) siguen el orden de `plantilla-entrevista.md`:
`edad · empleo_contrato · tjanstepension · akassa_inkomstforsakring · ingresos_netos · capacidad_ahorro · capital_actual · pension_proyectada · deudas · buffert · perfil_riesgo · pareja · meta`.

### Valores numéricos y desgloses

- `value_text` — el dato normalizado tal como irá en la ficha.
- `value_numeric` — el número cuando aplica: edad (años), kr, meses de buffert, importe de la meta.
- `details` (jsonb) — desgloses: deudas (`bolan/csn/consumo`), capital por envoltorio (`isk/kf/sparkonto`), año de la meta (`anio`).

## Seguridad (RLS)

RLS está **activado sin políticas públicas**: solo la clave `service_role` accede, es decir, el backend server-side de Next.js. El navegador nunca habla directo con Supabase. Si en la **Fase 03** se decide permitir acceso anónimo directo desde la landing, se añadirán políticas acotadas por `session_token`.

## Decisiones abiertas (confirmar con el asesor)

- **Nomenclatura de perfil**: el enum usa `dinamico` (vigente en `reglas-recomendacion.md`), no el antiguo `agresivo` de la plantilla. Falta unificar la plantilla.
- **Acceso anónimo vs. autenticado** en la landing — se cierra en la Fase 03.
