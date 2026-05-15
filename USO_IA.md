# Informe técnico de cambios y refactorizaciones

Este documento describe las refactorizaciones, correcciones de seguridad y decisiones arquitectónicas aplicadas durante la evolución del proyecto. Está redactado desde la perspectiva del equipo de desarrollo para facilitar la revisión por parte de evaluadores y futuros colaboradores.

## 1. Refactorización de seguridad (prevención XSS)

Se eliminó el uso de `innerHTML` para renderizar tarjetas del inventario. La sustitución por una construcción de DOM programática con `document.createElement()` y `textContent` garantiza que los valores del usuario se traten como texto plano y no como HTML.

## 2. Logo y recursos vectoriales

El logo se implementa como SVG inline para asegurar adaptación a modos claro/oscuro y mantener escalabilidad sin rasterización.

## 3. Lógica de negocio y pipelines

Se aplicó un pipeline funcional y un patrón de comparadores (Strategy) para el ordenamiento del inventario. Los cálculos de presupuesto utilizan funciones puras (`getTotalSpent`) para facilitar pruebas unitarias.

## 4. Accesibilidad y microinteracciones

Se añadieron atributos ARIA relevantes (`aria-label`, `role="dialog"`, `aria-hidden`) y se ajustaron microinteracciones (hover/animations) para mejorar la experiencia.

## 5. Correcciones visuales y QA

Se corrigen enlaces rotos y conflictos de especificidad en CSS que causaban artefactos visuales.

## 6. Gestión de temas

La preferencia de tema se persiste en `localStorage` y el switching se implementa mediante `html[data-theme]` para minimizar efectos de pantalla completa al recargar.

---
*Informe preparado por el equipo de desarrollo.*
