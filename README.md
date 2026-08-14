# Asesor Financiero — Alberto y Margaretha

Proyecto de asesoría financiera personal.

## Estructura

- `fichas/` — datos de cada persona u objetivo, etiquetados como confirmado / estimado / pendiente
- `informes/` — análisis y recomendaciones generados a partir de las fichas
- `supuestos.md` — supuestos fijos del motor (rentabilidad esperada por perfil, inflación)

## Flujo

1. Entrevista → escribe `fichas/ficha-[nombre].md`
2. Motor de análisis → lee la ficha y genera `informes/informe-[nombre].md`
