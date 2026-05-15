# SetupVault - Gestor Táctico de Hardware 🛡️

![SetupVault Banner](https://img.shields.io/badge/Status-Active-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla_JS-f7df1e)

SetupVault es una aplicación web de alto rendimiento y grado táctico diseñada para gestionar el presupuesto y planificación de hardware informático o "setups". Con una arquitectura sólida y un enfoque total en la ciberseguridad, esta herramienta permite priorizar adquisiciones, calcular estimaciones de presupuesto en tiempo real y almacenar el estado de manera persistente y segura en el navegador local.

## 🎯 Características Principales

- **Gestión Avanzada del DOM:** Arquitectura sin `innerHTML`, basada estrictamente en la creación y manipulación programática de nodos (`document.createElement`) para garantizar inmunidad total ante ataques XSS.
- **Interfaz Mobile-First & Glassmorphism:** Interfaz premium con tema "Tactical Steel", soporte dinámico de modo Claro/Oscuro y grilla responsive (1-2-4).
- **Lógica de Estado Robusta (IIFE):** Todo el manejo del ciclo de vida se realiza mediante una expresión de función ejecutada inmediatamente (IIFE) para encapsulamiento estricto.
- **Seguridad y Validación:** Validación exhaustiva a través de Expresiones Regulares (Regex) "Fail-Fast", coerción segura de tipos y mitigación proactiva contra datos corruptos.
- **Persistencia Confiable:** Almacenamiento optimizado y serialización segura en `localStorage`, incluyendo funcionalidad de "Hard Reset" con confirmación visual.
- **Algoritmos Estables:** Motor de filtrado y ordenamiento dinámico que re-renderiza la jerarquía utilizando el patrón Strategy (Urgente > Planificada > Deseo).
- **Compatibilidad i18n:** Soporte de locale dinámico en formato de divisas y en el ordenamiento alfabético (`localeCompare`).

## 🛠️ Tecnologías Utilizadas

Este proyecto se ha construido respetando estrictamente los estándares académicos sin dependencias masivas o empaquetadores:

* **HTML5:** Estructuras semánticas y accesibles.
* **CSS 5 (Tailwind CSS CDN):** Diseño modular basado en utilidades y variables CSS nativas.
* **Vanilla JavaScript (ES6+):** Lógica funcional, sin frameworks, empleando los últimos estándares (`crypto.randomUUID()`, `.reduce()`, Destructuring).
* **Lucide Icons:** Iconografía vectorial minimalista e inyectada mediante CDN.

## 🚀 Despliegue en GitHub Pages

Desplegar SetupVault es rápido y no requiere pasos de compilación.

1. **Haz un Fork o Clona el Repositorio:**
   ```bash
   git clone https://github.com/vicentemrk/Sumativa-2_SetupVault.git
   ```

2. **Sube tus cambios a GitHub:**
   Asegúrate de que los archivos `index.html`, `styles.css` y `app.js` se encuentren en la raíz (root) del repositorio `main`.

3. **Configura GitHub Pages:**
   * Dirígete a la pestaña **Settings** de tu repositorio en GitHub.
   * En la barra lateral izquierda, selecciona **Pages**.
   * Bajo *Source*, selecciona **Deploy from a branch**.
   * Bajo *Branch*, elige `main` y la carpeta `/(root)`.
   * Guarda (Click en **Save**).

4. **Acceso:**
   En uno o dos minutos, tu aplicación estará en vivo y recibirás una URL similar a `https://vicentemrk.github.io/Sumativa-2_SetupVault/`.

## 🤖 Uso de IA (Asistencia y Buenas Prácticas)

De acuerdo con los requisitos académicos, este proyecto ha utilizado herramientas de Inteligencia Artificial (IA) de manera estratégica para elevar la calidad del código, refactorizar lógica crítica y asegurar el cumplimiento de estrictos estándares de ciberseguridad (mitigación XSS). 

En el código fuente (específicamente en `app.js`), encontrarás comentarios explícitos etiquetados como **`[Asistencia IA]`** detallando el razonamiento detrás de las optimizaciones implementadas.

Para revisar los prompts exactos, el análisis de las sugerencias y las metodologías de seguridad aplicadas, por favor consulta el informe técnico detallado:
👉 **[Leer Informe de Uso de IA (USO_IA.md)](./USO_IA.md)**


5. 👤 Autor

- GitHub: [@vicentemrk](https://github.com/vicentemrk)
---
*Desarrollado con rigor arquitectónico para la asignatura Sumativa 2.*
