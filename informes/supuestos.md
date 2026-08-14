# Supuestos del motor de diagnóstico

Valores fijos que usa el agente en toda proyección. Los revisa y aprueba el asesor. Revisión mínima: anual (enero) o cuando cambie la normativa.

**Última revisión:** 2026-08-07 · **Aprobado por:** pendiente de revisión del asesor

## Rentabilidad esperada

**Derogado en este archivo.** Desde 2026-08-07, la única fuente de rentabilidades esperadas (perfiles estándar, hipótesis por clase de activo y bandas) es `reglas-recomendacion.md`, sección 5. Nomenclatura de perfiles: conservador / moderado / **dinámico** (antes "agresivo").

## Inflación

- Objetivo del Riksbank: **2,0 % anual**. Las metas a largo plazo se contrastan también en kr reales.

## Fiscalidad del ahorro (2026)

- **ISK / kapitalförsäkring:** libres de impuesto hasta **300 000 kr por persona** (suma de todos los ISK y KF). Por encima, schablonskatt del **1,065 %** anual sobre el exceso.
- **Sparkonto:** 30 % sobre intereses recibidos.
- Regla práctica del motor: el ahorro nuevo destinado a inversión se modela como ISK salvo indicación contraria; el detalle por tipo de activo y horizonte está en `reglas-recomendacion.md`, sección 6.
- Las proyecciones se presentan en neto (ver `reglas-recomendacion.md`, sección 5.3); la fiscalidad puede cambiar y el cálculo es hipótesis de planificación, no liquidación fiscal.

## Deudas — umbrales de clasificación

- Interés > 6 %: deuda cara (típicamente consumo/tarjeta) — se señala siempre en el diagnóstico como condicionante previo.
- Bolån: amortización obligatoria según reglas de abril 2026 (1 % con LTV 50–70 %, 2 % con LTV > 70 %) — se trata como gasto fijo, no como capacidad de ahorro.
- CSN: no se considera deuda cara.

## Buffert de referencia

- 2–3 meses de gastos fijos (hasta 6 si ingresos variables o sin a-kassa). Solo referencia descriptiva en el diagnóstico; la prelación operativa (mini-buffert, avalancha, etc.) está en `reglas-recomendacion.md`, sección 1.

## Otras convenciones

- Horizonte de proyección: desde hoy hasta el año de la meta, capitalización mensual del ahorro periódico.
- Pensión: la proyección de minPension.se se toma como dato externo, nunca se recalcula.
- Todo resultado se redondea a miles de kr — precisión aparente es falsa precisión.
