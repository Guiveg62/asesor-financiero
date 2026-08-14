# Reglas de recomendación — criterio del asesor

Política que el motor de análisis y recomendación aplica **sin interpretar**. Toda decisión no cubierta aquí se devuelve al asesor como "pendiente de criterio"; el motor nunca la improvisa.

**Última revisión:** 2026-08-07 · **Aprobado por:** el asesor · **Revisión mínima:** anual o cuando cambie el criterio

## 0. Jerarquía de fuentes

1. `reglas-recomendacion.md` (este archivo) — política de recomendación y **única fuente de rentabilidades esperadas** para todo el sistema.
2. `supuestos.md` — inflación, fiscalidad, umbrales de deuda y convenciones de cálculo. Su antigua tabla de rentabilidad por perfil queda **derogada** por la sección 5 de este archivo.
3. `ficha-[nombre].md` — datos del cliente con etiquetas confirmado / estimado / pendiente.

Ante conflicto entre archivos, manda el orden anterior. El motor lee fichas y escribe `informes/informe-[nombre].md` dirigido al asesor (tercera persona, tecnicismos permitidos). **Nunca conversa con el cliente ni le entrega el informe directamente.**

## 1. Orden de prioridades

Prelación fija: **mini-buffert → deuda cara → buffert completo → inversión.**

| Situación del cliente | Destino del flujo libre |
|---|---|
| Sin ningún ahorro líquido | 70 % mini-buffert · 30 % deuda cara, hasta reunir ~1 mes de gastos esenciales |
| Mini-buffert cubierto, deuda cara pendiente | 80–100 % deuda cara · 0–20 % buffert (método avalancha: mayor interés primero) |
| Sin deuda cara, buffert incompleto | 100 % a completar el buffert |
| Deuda cara saldada y buffert completo | Inversión hacia la meta |

- **Deuda cara:** interés > 6 % (umbral de `supuestos.md`). Los pagos mínimos de *todas* las deudas se mantienen siempre; los atrasos se evitan en cualquier escenario.
- **Buffert completo:** 2–3 meses de gastos esenciales; 3–6 meses si ingresos variables, actividad autónoma, familia a cargo, vivienda propia o mayor riesgo de desempleo. Siempre líquido (sparkonto) y separado de la inversión.
- **Única excepción a la prelación:** una aportación mínima que desbloquee una contribución equivalente del empleador puede mantenerse aunque exista deuda cara.
- Mientras exista deuda cara, la inversión nueva se pospone; el informe lo señala como condicionante previo.

## 2. Aportación mensual propuesta

1. Calcular la **aportación necesaria** para cerrar el gap: capital faltante frente a la meta, al plazo restante, con la rentabilidad de la sección 5 (capitalización mensual).
2. Compararla con la **capacidad libre real** de la ficha.
3. **Tope prudente: 80–90 % del flujo libre** — se deja siempre un 10–20 % como margen mensual para imprevistos. Con buffert incompleto, aplicar el extremo bajo del rango o menos.
4. Nunca se usan cifras estándar por nivel de ingresos: la referencia es siempre el flujo libre individual.
5. Si la aportación necesaria supera el tope → la meta no es viable a ritmo actual → aplicar la política de inviabilidad (sección 4). **El motor nunca propone aportar por encima del tope.**

## 3. Distribución de la inversión

### 3.1 Carteras por perfil de riesgo

| Perfil | Renta variable | Renta fija | Liquidez / sparkonto |
|---|---|---|---|
| Conservador | 30 % | 60 % | 10 % |
| Moderado | 60 % | 35 % | 5 % |
| Dinámico | 85–90 % | 10–15 % | 0–5 % |

(Nomenclatura unificada: "dinámico" sustituye a "agresivo" en todo el sistema.)

### 3.2 El horizonte manda sobre el perfil

Para cada meta concreta, el tiempo hasta la fecha limita la renta variable, por encima de lo que diga el perfil:

| Tiempo hasta la meta | Máximo en renta variable |
|---|---|
| Más de 10 años | Según perfil |
| 5–10 años | 40–50 % |
| 3–5 años | 20–30 % |
| Menos de 3 años | 0–10 % |
| Menos de 12 meses | 0 % para el capital necesario |

- **Senda decreciente:** la renta variable se reduce progresivamente al acercarse la fecha (orientativo: 40 % a 5 años, 25 % a 3, 10 % a 1, 0 % al llegar).
- **Carteras separadas por meta:** el capital destinado a una meta próxima sigue esta tabla; el capital de objetivos posteriores puede mantener la distribución del perfil.
- Esta regla no es garantía ni porcentaje universal: se modula por la importancia de la meta, su flexibilidad, la estabilidad de ingresos y la posibilidad de retrasar la fecha — matices que decide el asesor, no el motor.

### 3.3 Parejas

- **Informe conjunto** solo si la meta es realmente común: ambos participan, aportan y han acordado la financiación. Aun así, las fichas individuales se mantienen siempre.
- **Informes separados** si la meta es principalmente de uno, hay objetivos independientes, patrimonios/deudas diferenciados, o perfiles y horizontes tan distintos que una recomendación única confundiría.
- En el cálculo común entran **solo** el capital y ahorro expresamente destinados a la meta compartida; el patrimonio propio queda fuera salvo aportación individual identificada. La aportación de cada uno según el criterio acordado (50/50, proporcional a ingresos u otro explícito).
- En la parte común **manda el perfil más prudente** de los dos, además de la regla de horizonte (3.2).

## 4. Política de inviabilidad

Cuando la aportación necesaria supera el tope prudente:

1. **Escenario base primero:** cuánto falta exactamente para que la meta sea viable a ritmo actual.
2. **Palancas por separado, cuantificadas:** (a) ampliar plazo — cuántos años; (b) reducir meta — cuántas kr; (c) aumentar aportación — solo dentro del tope, típicamente vía revisión de gastos.
3. **2–3 combinaciones realistas**, por ejemplo: mantener meta ampliando plazo / mantener plazo reduciendo meta / combinada (algo de cada, dentro del tope).
4. **Una opción se marca como recomendada** según este orden de preferencia: ampliación moderada de plazo y revisión razonable de gastos, antes que recorte fuerte de meta, y siempre antes que más riesgo. Se presenta con ventajas, inconvenientes y condiciones; la decisión final es del asesor con el cliente en la reunión.
5. **Subir el perfil de riesgo nunca es palanca principal.** Solo puede aparecer como alternativa secundaria si el horizonte es largo y el cliente comprende y acepta expresamente las pérdidas posibles — y esa conversación es del asesor, no del motor.
6. Si ninguna palanca cuadra: el informe deja **constancia expresa de que la meta no es viable** bajo los supuestos actuales. No se maquilla.

## 5. Rentabilidades esperadas — única fuente del sistema

### 5.1 Perfiles estándar (nominal, anual, antes de costes)

| Perfil | Central oficial | Banda para rangos * |
|---|---|---|
| Conservador | 2,0 % | 1,0–3,5 % |
| Moderado | 4,5 % | 2,5–6,0 % |
| Dinámico | 6,5 % | 4,0–8,5 % |

Estas cifras **sustituyen** a las de `supuestos.md` (3,5/5,5/7,0) y a cualquier valor provisional anterior.

*\* Bandas propuestas por el motor, pendientes de aprobación del asesor.*

### 5.2 Carteras intermedias (regla de horizonte)

Se proyectan por **ponderación por clase de activo**:

| Clase | Hipótesis nominal anual * |
|---|---|
| Renta variable | 7,0 % |
| Renta fija | 2,0 % |
| Liquidez / sparkonto | 1,0 % |

R = w_RV·7,0 % + w_RF·2,0 % + w_liq·1,0 %

*\* Recalibradas a la baja respecto a la primera propuesta (7,0/3,0/1,5), pendientes de aprobación del asesor.*

**Nota de coherencia (deliberada):** el 2,0 % central del perfil conservador está por debajo de lo que su propia cartera generaría por ponderación (~3,4 %). Es un margen de prudencia intencionado del asesor para el perfil estándar, no un error; las carteras intermedias usan la ponderación sin ajustar.

### 5.3 Reglas de presentación

- Toda proyección se presenta en **tres escenarios**: prudente (banda baja), central y favorable (banda alta). Nunca una cifra única como certeza — menos aún en horizontes cortos.
- Las proyecciones y el cálculo de viabilidad se hacen **en neto**: se resta schablonskatt (ISK/KF sobre el exceso del umbral) y el 30 % sobre intereses de sparkonto, según `supuestos.md`. El bruto puede mostrarse como columna de referencia.
- Todo cálculo se ejecuta con código (Python). Las etiquetas de la ficha se propagan: con insumos *estimados*, resultados en rangos; con un imprescindible *pendiente* (meta, capital, ahorro mensual o perfil), no se proyecta — informe parcial con lista de faltantes.
- Resultados redondeados a miles de kr.

## 6. Envoltorio del ahorro nuevo

- **Renta variable y fondos:** ISK/KF, incluso por encima del umbral de 300 000 kr, comparando coste fiscal frente a rentabilidad esperada y flexibilidad. El umbral es por persona y suma ISK+KF.
- **Renta fija y liquidez a corto plazo (≤3 años o capital que debe preservarse):** sparkonto o instrumentos de muy bajo riesgo.
- El umbral fiscal nunca es criterio único: pesan horizonte, riesgo, liquidez y protección del capital.
- El buffert vive siempre en sparkonto, fuera de la cartera de inversión.

## 7. Lo que el motor no hace nunca

- Garantizar rentabilidades o presentar proyecciones como certezas.
- Recomendar productos concretos (fondos o valores con nombre): se queda en clases de activo y envoltorios.
- Ascender un *estimado* a *confirmado* o rellenar datos faltantes.
- Proponer aportaciones por encima del tope prudente, o más riesgo para cuadrar una meta.
- Opinar sobre timing de mercado.
- Dar consejo fiscal o legal específico, ni decidir sobre pensión irreversible (momento de cobro de tjänstepension, återbetalningsskydd): se señalan al asesor.
- Conversar con el cliente o entregarle el informe: el informe llega al cliente a través del asesor.
- Calcular de cabeza: todo con código, citando supuesto y etiqueta de cada cifra.

## 8. Pendientes de decisión del asesor

- [ ] Aprobar las bandas por perfil (5.1) y las hipótesis por clase (5.2).
- [ ] Frecuencia de revisión del informe (¿anual? ¿semestral?) y disparadores de revisión anticipada (cambio de ingresos, de meta, desviación sobre lo proyectado…).
