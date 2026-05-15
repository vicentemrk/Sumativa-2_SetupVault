# Uso de Inteligencia Artificial (IA) en SetupVault

Este documento detalla cómo se utilizaron herramientas de Inteligencia Artificial (como ChatGPT/Claude) durante el desarrollo del proyecto **SetupVault**, evidenciando los *prompts* utilizados y las mejoras aplicadas en el código para cumplir estrictamente con los criterios de evaluación.

## 1. Prevención de Vulnerabilidades XSS y Manipulación Segura del DOM

**Objetivo:** Evitar inyecciones de código malicioso en el inventario al renderizar los datos guardados.

* **Prompt utilizado:**
  > "Tengo una aplicación web que muestra tarjetas de artículos de un inventario. Actualmente uso `innerHTML` en un template string para inyectar los datos ingresados en el formulario directamente al DOM, pero sé que esto es inseguro contra XSS. ¿Cómo puedo refactorizar mi función de renderizado en JavaScript puro para usar métodos seguros como `document.createElement` y `textContent`, creando la misma estructura visual de Bootstrap?"

* **Mejora Aplicada:**
  La IA explicó los riesgos de `innerHTML` y sugirió reemplazarlo por una construcción programática. Se implementó la función `createItemCard()` en `app.js`, donde cada elemento del DOM (`article`, `div`, `h3`, `button`) se crea paso a paso y el texto del usuario se inyecta de forma inofensiva:
  ```javascript
  const title = document.createElement('h3');
  title.className = 'h6 fw-semibold text-white mb-0 text-break';
  title.textContent = item.name; // Protegido contra XSS
  ```

## 2. Generación de Validaciones Complejas (Regex) y Sanitización

**Objetivo:** Garantizar que los nombres de los artículos ingresados sean válidos y uniformes, evitando espacios en blanco innecesarios.

* **Prompt utilizado:**
  > "Necesito una función en JavaScript que valide el nombre de un artículo de hardware ingresado en un formulario. Debe aceptar letras (incluyendo acentos y 'ñ'), números, espacios, guiones medios y guiones bajos (por ejemplo 'RTX 4060-Ti'). También necesito una función pura para sanitizar ese texto, quitando los espacios extra al principio, al final y dobles espacios entre palabras."

* **Mejora Aplicada:**
  Se integraron las funciones `validateName` (con expresiones regulares avanzadas) y `sanitizeText` dentro del flujo de `validateItemForm()` en `app.js`.
  ```javascript
  const sanitizeText = (value) => value.trim().replace(/\s+/g, ' ');
  const validateName = (value) => /^[a-zA-Z0-9\s\-_áéíóúÁÉÍÓÚñÑ]+$/.test(value);
  ```

## 3. Sugerencias de Estructura de Datos (Filtros y Ordenamiento)

**Objetivo:** Permitir buscar, filtrar y ordenar el arreglo de objetos de forma eficiente sin mutar los datos originales guardados en `localStorage`.

* **Prompt utilizado:**
  > "Mi aplicación guarda un arreglo de objetos de artículos (con propiedades como id, name, price, priority, createdAt). Necesito refactorizar mi código para obtener la lista de artículos visibles considerando: 1. Un texto de búsqueda (que ignore acentos y mayúsculas), 2. Un filtro por nivel de prioridad, y 3. Un selector de ordenamiento (reciente, alfabético, precio o prioridad). ¿Cómo puedo escribir este pipeline siguiendo un enfoque funcional y modular?"

* **Mejora Aplicada:**
  La IA introdujo el uso del patrón de diseño *Strategy* para el ordenamiento y técnicas de normalización de cadenas de texto (`normalize('NFD')`). Se implementó la función `getVisibleItems()`, que es robusta, fácil de mantener y cumple con buenas prácticas:
  ```javascript
  const comparators = {
      priceAsc: (left, right) => left.price - right.price,
      nameAsc: (left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }),
      // Uso de localeCompare para manejo correcto de acentos al ordenar alfabéticamente
  };
  ```

## 4. Refactorización Estructural (Módulo IIFE)

**Objetivo:** Ocultar el estado interno y evitar la contaminación del entorno global de la ventana (Window), mejorando la seguridad y legibilidad del código.

* **Prompt utilizado:**
  > "Todo mi código de JavaScript está suelto en el archivo `app.js`. ¿Puedes guiarme sobre cómo encapsular la lógica usando el patrón de Módulo Autoejecutable (IIFE) para proteger las variables de estado (como el array de `items` y el presupuesto) y solo exponer una función pública `init()`?"

* **Mejora Aplicada:**
  Todo el archivo `app.js` fue refactorizado dentro de una estructura `const app = (() => { ... })();`. Esto aseguró que `state` y `elements` sean privados, logrando un código con acoplamiento mínimo y máxima claridad estructural, demostrando dominio de conceptos avanzados de JS solicitados en la rúbrica.
