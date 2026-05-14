# SetupVault

**Gestor Táctico de Presupuesto para Hardware**

SetupVault es una aplicación web enfocada en la gestión eficiente y visual de presupuestos para hardware, periféricos y herramientas de setup. Diseñada bajo un enfoque riguroso de ciberseguridad, arquitectura limpia y una estética "Midnight Forest", esta herramienta permite a los usuarios organizar sus compras futuras basándose en su prioridad e impacto en el presupuesto.

## Características Principales

*   **Arquitectura Frontend Sólida:** Construida íntegramente con HTML5 semántico, CSS3 moderno (Variables y CSS Grid) y Vanilla JavaScript (Módulo IIFE).
*   **Gestión de Estado y Persistencia:** Almacenamiento local mediante `localStorage` para que la bóveda de hardware no pierda sus datos al recargar la página.
*   **Cálculo en Tiempo Real:** Totalizador dinámico de presupuesto utilizando el método `.reduce()` para un cálculo funcional y libre de mutaciones innecesarias.
*   **Seguridad Frontend Estricta (Anti-XSS):** Prevención activa de inyección de código mediante el uso exclusivo de `document.createElement()`, `textContent` y `setAttribute`. El uso de `innerHTML` o `insertAdjacentHTML` está completamente prohibido para la inserción de datos dinámicos.
*   **Validaciones Robustas:** Sanitización de inputs y uso de expresiones regulares (Regex) para garantizar que los nombres de los artículos sean seguros y los precios matemáticamente válidos.
*   **Interfaz de Alto Impacto:** Paleta de colores "Midnight Forest" oscura con acentos tácticos, tipografía Inter y diseño Mobile-First adaptable (1-2-4 columnas).
*   **Gestión de Emergencia (Hard Reset):** Funcionalidad de purgado seguro del estado con validación modal (A11y friendly).

## Tecnologías Utilizadas

*   **HTML5:** Etiquetas semánticas y atributos WAI-ARIA para accesibilidad.
*   **CSS3:** Variables CSS (`:root`), Flexbox, CSS Grid y Media Queries.
*   **Vanilla JavaScript (ES6+):** Arrow functions, Spread operator, UUID nativo (`crypto.randomUUID()`) y métodos de arreglos avanzados (`reduce`, `sort`, `filter`).
*   **Phosphor Icons / Google Fonts:** Recursos de UI livianos y modernos.

## Instrucciones de Despliegue en GitHub Pages

Para publicar este proyecto de forma gratuita y rápida utilizando GitHub Pages, sigue estos pasos:

1.  **Inicializar y Subir a GitHub:**
    *   Abre tu terminal en la carpeta del proyecto.
    *   Ejecuta los siguientes comandos:
        ```bash
        git init
        git add .
        git commit -m "Initial commit: SetupVault"
        git branch -M main
        git remote add origin https://github.com/tu-usuario/Sumativa-2_SetupVault.git
        git push -u origin main
        ```
2.  **Configurar GitHub Pages:**
    *   Ve al repositorio de tu proyecto en GitHub.
    *   Navega a **Settings** (Configuración) > **Pages** (Páginas) en la barra lateral izquierda.
    *   Bajo la sección **Build and deployment**, asegúrate de que el "Source" esté configurado en **Deploy from a branch**.
    *   En "Branch", selecciona **main** (o master) y el directorio **/(root)**.
    *   Haz clic en **Save**.
3.  **Visualizar el Proyecto:**
    *   Tras unos minutos, GitHub te proporcionará el enlace de tu sitio web activo (usualmente `https://tu-usuario.github.io/Sumativa-2_SetupVault/`).

## Autor

Desarrollado para el proyecto académico Sumativa 2 - [vicentemrk](https://github.com/vicentemrk).
