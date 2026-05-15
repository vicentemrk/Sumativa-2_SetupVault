# Informe de Integración de Inteligencia Artificial (SetupVault)

Este documento documenta la estrategia de adopción de herramientas de Inteligencia Artificial (IA) generativa como instrumentos de pair-programming y revisión de arquitectura durante el desarrollo de **SetupVault**. El objetivo fue acelerar el desarrollo garantizando el cumplimiento de los estándares más estrictos de ciberseguridad, arquitectura de software frontend y mantenibilidad de código.

## 1. Estrategia de Adopción (Pair-Programming)

Las herramientas de IA no se utilizaron como "generadores de código" aislados, sino que se integraron en el flujo de trabajo como asistentes de validación arquitectónica. La dirección técnica se mantuvo enfocada en tres pilares:
1.  **Defensa en Profundidad (Security-First):** Validación de patrones defensivos contra vulnerabilidades OWASP (ej. XSS).
2.  **Paradigmas Funcionales:** Refactorización de algoritmos imperativos hacia pipelines declarativos de ES6+ (`reduce`, `sort`).
3.  **Sistema de Diseño:** Traducción eficiente de directrices visuales ("Midnight Forest") a una arquitectura CSS modular escalable.

## 2. Implementaciones Arquitectónicas Asistidas

A continuación, se detallan las decisiones arquitectónicas implementadas mediante la asistencia e iteración con herramientas de IA.

### A. Prevención Activa de Cross-Site Scripting (XSS)

*   **Requerimiento Arquitectónico:** Renderizado dinámico de la lista de inventario sin comprometer la seguridad del DOM. Prohibición estricta de `innerHTML` o `insertAdjacentHTML`.
*   **Implementación Asistida:** A través de la revisión del código con IA, se estructuró la función `renderItems()` utilizando exclusivamente el API nativo del DOM (`document.createElement()`, `textContent` y `setAttribute`). Todo el contenido ingresado por el usuario se trata estrictamente como texto plano, aislando y neutralizando por diseño cualquier vector de inyección XSS.

### B. Expresiones Regulares (Regex) para Sanitización Preemptiva

*   **Requerimiento Arquitectónico:** Validación y sanitización del input en la capa de interfaz antes de la persistencia del estado, garantizando la integridad de los datos.
*   **Implementación Asistida:** Se iteró con la IA para definir la función `sanitizeText(str)` y el patrón Regex `/^[a-zA-Z0-9\s\-_]+$/`.
    *   *Impacto Técnico:* El formulario ahora rechaza preventivamente símbolos de escape y operadores peligrosos (ej. `<, >, {, }, ;`), permitiendo solo alfanuméricos y separadores seguros. Los espacios múltiples se colapsan dinámicamente (`.trim().replace(/\s+/g, ' ')`), limpiando anomalías antes de almacenarlas.

### C. Refactorización Funcional y Rendimiento (`.reduce`)

*   **Requerimiento Arquitectónico:** Agregación de métricas financieras (presupuesto total) minimizando los re-renders reactivos y evitando mutaciones de estado no controladas.
*   **Implementación Asistida:** Se reemplazaron las iteraciones imperativas (bucles `for` tradicionales y variables acumuladoras mutables) por paradigmas de programación funcional:
    ```javascript
    const getTotalSpent = () => state.items.reduce((sum, item) => sum + item.price, 0);
    ```
    *   *Impacto Técnico:* El cálculo ahora es una función pura, inmutable y testeable, logrando una arquitectura más predecible y performante durante el ciclo de vida de la SPA.

### D. Evolución del Sistema de Diseño (CSS Architecture)

*   **Requerimiento Arquitectónico:** Implementar un tema visual cohesivo ("Midnight Forest") con soporte multi-modo, estructurado mediante variables CSS y con alta legibilidad.
*   **Implementación Asistida:** Durante las sesiones de pair-programming, se delegó a la IA la tarea de calcular y unificar la escala de color HSL base. Se migró de colores estáticos (HEX) a variables semánticas (`hsl(160, 25%, 5%)` para fondos y `hsl(155, 60%, 32%)` para acentos), consolidando un token-system inicial escalable para la aplicación.

## 3. Conclusión

La incorporación de herramientas de IA generativa en el ciclo de desarrollo demostró ser un poderoso multiplicador de productividad. Al establecer directrices arquitectónicas rigurosas y restricciones de seguridad precisas ("guardrails"), la IA funcionó eficazmente como un ingeniero adjunto. Esto permitió que el liderazgo del proyecto se mantuviera enfocado en la arquitectura general, el modelo de dominio y la integridad de la aplicación, logrando un código limpio, performante y preparado para escalar a nivel de producción.
