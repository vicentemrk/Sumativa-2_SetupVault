# SetupVault Modal Mixto de Agregado y Edición
**Date**: 2026-05-14
**Status**: Draft ready for review
**Scope**: Reemplazar el formulario principal por un modal grande reutilizable para agregar y editar artículos, con panel lateral mixto de resumen + ayuda.

## Contexto
SetupVault ya cumple con una base visual sólida, pero el flujo de edición/agregado sigue siendo demasiado lineal. La siguiente mejora prioriza una interacción más limpia y profesional: un modal grande que concentre el formulario principal, mientras un panel lateral muestra contexto útil sin saturar la pantalla.

La intención es mantener el esquema actual de campos, porque ya cubre la rúbrica: texto, número y select con validaciones. No se agregan campos nuevos por ahora.

## Objetivo
Diseñar una experiencia de alta legibilidad que permita:
- Agregar artículos desde un modal amplio.
- Editar artículos usando el mismo modal.
- Mostrar un panel lateral mixto con resumen y ayuda.
- Mantener la interfaz limpia en mobile y desktop.
- Reforzar la evaluación académica con mejor modularidad, validación y claridad visual.

## Alcance Funcional

### Modal principal
- Un solo modal reutilizable para crear y editar.
- Título dinámico:
  - `Nuevo artículo` cuando se agrega.
  - `Editar artículo` cuando se modifica.
- Botón principal dinámico:
  - `Agregar artículo` en modo creación.
  - `Guardar cambios` en modo edición.
- Cierre con botón `Cancelar`, clic fuera del modal y tecla `Escape`.
- Prellenado de valores al editar.
- Limpieza total del formulario al abrir en modo creación.

### Campos del formulario
Se conservan solo los campos actuales:
- Nombre del artículo: texto.
- Precio estimado: número.
- Prioridad: select.

No se añaden campos extra porque no aportan a la rúbrica y complican la UI sin valor claro.

### Panel lateral mixto
El panel lateral tendrá dos bloques:
1. **Resumen útil**
   - Total gastado.
   - Presupuesto restante.
   - Cantidad de artículos.
   - Porcentaje usado, solo si existe presupuesto principal guardado.
2. **Ayuda breve**
   - Reglas de validación.
   - Formato esperado.
   - Recordatorio de sanitización y uso correcto del formulario.

## Comportamiento Visual

### Desktop
- Modal centrado, ancho amplio, con cuerpo dividido en dos columnas.
- Izquierda: formulario.
- Derecha: panel lateral.
- Footer fijo con acciones claras.

### Mobile
- Modal en una sola columna.
- Primero formulario, luego panel lateral.
- Botones grandes y accesibles.
- Panel lateral compacto para no competir con el formulario.

### Estilo
- Mantener la línea visual actual de SetupVault.
- Blur mínimo, solo como separación sutil de capas.
- Fondo oscuro consistente con la identidad actual.
- Jerarquía fuerte en el resumen y discreta en la ayuda.
- Sin recargar la pantalla con microdecoración innecesaria.

## Seguridad y Validación
La solución debe conservar y reforzar las buenas prácticas ya presentes:
- Validación de campos obligatorios.
- Regex para el nombre del artículo.
- Sanitización de entradas.
- Sin `innerHTML` para datos dinámicos.
- Uso de `textContent`, `createElement` y asignación segura de atributos.

## Arquitectura Deseada
La implementación futura debe apoyarse en funciones reutilizables y separadas:
- `openItemModal(mode, item)`.
- `closeItemModal()`.
- `prefillItemForm(item)`.
- `clearItemForm()`.
- `renderSummary()`.
- `validateItemForm()`.
- `saveItemFromModal()`.

El modal no debe contener lógica duplicada para agregar y editar. La diferencia debe resolverla un modo interno (`create` / `edit`).

## Opciones Consideradas

### Opción A: dos botones separados
- Un botón para agregar y otro para editar.
- Pros: explícito.
- Contras: duplica interfaz y da menos limpieza.

### Opción B: un solo modal con modo interno
- Un mismo componente cambia según el contexto.
- Pros: más consistente, más limpio, mejor reutilización.
- Contras: requiere estado interno bien definido.

### Opción C: panel lateral permanente y formulario inline
- No usar modal.
- Pros: acceso rápido.
- Contras: más ruido visual, menos control del foco, peor experiencia para edición puntual.

### Decisión
Se elige la **Opción B** porque ofrece la mejor relación entre legibilidad, reutilización y claridad visual.

## Criterios de Éxito
La mejora se considerará correcta si:
- El modal permite crear y editar con el mismo formulario.
- El panel lateral muestra resumen y ayuda sin saturar.
- El porcentaje usado solo aparece cuando existe presupuesto guardado.
- La UI se mantiene limpia en mobile y desktop.
- No se rompe la seguridad del renderizado ni la estructura basada en arreglos de objetos.
- La solución sigue ayudando a cumplir la rúbrica de evaluación.

## Riesgos
- Si el modal intenta hacer demasiado, puede perder claridad visual.
- Si el panel lateral ocupa demasiado, el formulario perderá foco.
- Si se duplica lógica entre crear y editar, la mantenibilidad se degrada.

## Fuera de Alcance
- Light mode.
- Nuevos campos de artículo.
- Dashboard avanzado completo.
- Filtros complejos o búsquedas avanzadas en esta fase.
- Reescritura total de la app.

## Resultado Esperado
Un modal grande, claro y reutilizable que convierta SetupVault en una interfaz más legible y profesional, sin abandonar el enfoque simple que ya encaja con la evaluación académica.