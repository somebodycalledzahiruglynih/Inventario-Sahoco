---
name: SAHOCO Inventario
description: Control de inventario en tiempo real sobre Google Sheets: mundo oscuro de carbón, una sola llama naranja, densidad táctil.
colors:
  # Negros carbón (escalera de superficie)
  carbon: "#0f0f0f"
  brasa: "#141414"
  ceniza: "#1a1a1a"
  ceniza-clara: "#1f1f1f"
  humo: "#242424"
  filo: "rgba(255,255,255,0.08)"
  # La llama (acento único de marca)
  llama: "#f97316"
  llama-viva: "#fb923c"
  llama-profunda: "#ea580c"
  tinte-llama: "rgba(249,115,22,0.15)"
  # Texto
  texto: "#f1f5f9"
  texto-suave: "#94a3b8"
  texto-tenue: "#64748b"
  # Señales operativas
  senal-roja: "#ef4444"
  senal-ambar: "#f59e0b"
  senal-esmeralda: "#10b981"
  senal-cielo: "#38bdf8"
  senal-violeta: "#a855f7"
typography:
  display:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.1
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.llama}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "14px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.llama-profunda}"
  button-secondary:
    backgroundColor: "{colors.ceniza-clara}"
    textColor: "#cbd5e1"
    rounded: "{rounded.2xl}"
    padding: "12px 16px"
    height: "48px"
  button-destructive:
    backgroundColor: "#dc2626"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "14px 16px"
    height: "48px"
  button-success:
    backgroundColor: "#059669"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "12px 16px"
  fab-add:
    backgroundColor: "{colors.llama-profunda}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    size: "48px"
  input:
    backgroundColor: "{colors.ceniza-clara}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "14px 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.humo}"
    textColor: "{colors.texto-suave}"
    rounded: "{rounded.2xl}"
    padding: "8px 14px"
  chip-selected:
    backgroundColor: "{colors.llama}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.ceniza}"
    textColor: "{colors.texto}"
    rounded: "{rounded.3xl}"
    padding: "16px"
  badge-critical:
    backgroundColor: "rgba(239,68,68,0.15)"
    textColor: "#f87171"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "rgba(245,158,11,0.15)"
    textColor: "#fbbf24"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "rgba(16,185,129,0.15)"
    textColor: "#34d399"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.texto-tenue}"
    rounded: "{rounded.xl}"
  nav-item-active:
    backgroundColor: "{colors.tinte-llama}"
    textColor: "{colors.llama-viva}"
    rounded: "{rounded.xl}"
---

# Design System: SAHOCO Inventario

## Overview

**Creative North Star: "El Libro de Fuego"**

SAHOCO es un libro contable vivo que brilla en la oscuridad. La hoja de Google Sheets es la única fuente de verdad, y la app la viste como lo que es: un registro nocturno de cocina donde cada movimiento — consumo, comiso, reposición, receta — queda escrito con nombre y hora. El fondo es carbón casi negro (#0f0f0f); las superficies suben en pasos mínimos de ceniza; y una sola llama naranja (#f97316) marca todo lo que exige acción o atención. El naranja no decora: señala.

El sistema es de densidad operativa, no de exhibición. La información se organiza como una estación de trabajo: numerales grandes en Outfit 800 que se leen de un vistazo, micro-etiquetas susurradas en mayúsculas de 9–10px, y semáforos rojo/ámbar/esmeralda que nacen del estado real del inventario, nunca de la paleta decorativa. Todo se resuelve con el pulgar: controles de 48px mínimo, esquinas de 16–24px, lavados translúcidos del color de la señal sobre fondos carbón.

El brillo es un verbo. Las sombras son cálidas y oscuras (nunca hay luz blanca en este mundo), y el glow naranja/rojo/esmeralda aparece únicamente cuando algo es accionable o urgente: un botón primario, un insumo agotado, un lote pendiente de sincronizar. La alternativa clara y beige del prototipo anterior quedó retirada; este mundo es nocturno, premium y directo.

**Key Characteristics:**
- Una sola llama: acento naranja #f97316 sobre una escalera estricta de negros carbón.
- Densidad de cocina: micro-etiquetas 9–10px en mayúsculas sobre numerales Outfit 800.
- Ergonomía de pulgar: nada interactivo por debajo de 48px (`btn-thumb`), radios 16–24px.
- Filos de humo: hairline blanco al 6–8 %; jamás un borde sólido claro.
- Profundidad tonal + glow con propósito, reservado a acciones y alertas.
- Señales semánticas (rojo/ámbar/esmeralda/cielo/violeta) asignadas por estado del inventario, no por decoración.

## Colors

Paleta de un solo acento cálido sobre una escalera de negros cohesiva: el color cuenta el estado del inventario, no embellece la pantalla.

### Primary
- **Llama de Servicio** (#f97316): el único acento de marca. Botones primarios, chips seleccionados, numerales de stock en estados sanos, foco de inputs, badge de prioridad alta. Es la luz del libro.
- **Llama Viva** (#fb923c): la versión luminosa para texto e iconos sobre fondo oscuro (tab activo, iconos de acción, etiquetas de marca como "Inventario Operativo").
- **Llama Profunda** (#ea580c): base de gradientes CTA (con Llama hacia Llama Viva) y aterrizaje del hover en botones sólidos.
- **Tinte de Llama** (rgba(249,115,22,0.15)): el lavado canónico de énfasis — fondo de iconos en badges de sección, pastilla activa de navegación, estados seleccionados sobre superficie.

### Secondary
Las señales operativas son semánticas; cada una pertenece a un estado real del flujo de inventario:
- **Rojo Merma** (#ef4444): agotado, comiso/pérdida, eliminación. Enlaces y botones destructivos usan el paso 600 (#dc2626) con glow rojo.
- **Ámbar Vencimiento** (#f59e0b): stock bajo, producto próximo a vencer.
- **Esmeralda Reposición** (#10b981): saludable, entrada de stock registrada, pedido recibido. El botón "Reponer" usa el paso 600 (#059669).
- **Cielo Registro** (#38bdf8): información, edición de ficha.
- **Violeta Receta** (#a855f7): recetas creadas, editadas o eliminadas en la auditoría.

### Neutral
- **Carbón** (#0f0f0f): fondo de la app; el vacío sobre el que todo flota. También `themeColor` del navegador.
- **Brasa** (#141414): chrome fijo — cabecera sticky, barra inferior, paneles de modal.
- **Ceniza** (#1a1a1a): superficie estándar de tarjetas y secciones.
- **Ceniza Clara** (#1f1f1f): fondos de campos, botones secundarios y controles anidados.
- **Humo** (#242424): controles elevados — chips inactivos, botones ±, pastillas de conteo, menú de usuario.
- **El Filo** (rgba(255,255,255,0.08)): hairline único para bordes y divisores (rango usado 0.05–0.08 según jerarquía).
- **Marfil** (#f1f5f9, slate-100): texto principal.
- **Pizarra** (#94a3b8, slate-400) y **Niebla** (#64748b, slate-500): texto secundario, metadatos, iconos en reposo.

### Named Rules
**La Regla de una Sola Llama.** El naranja es el único color de marca; nunca se introduce un segundo acento. Las señales roja/ámbar/esmeralda/cielo/violeta no son paleta alternativa: sólo aparecen cuando el estado del inventario las exige.

**La Regla del Lavado y el Filo.** Los colores semánticos viven como tinte al 15 % + borde al 25 % + texto del paso claro del mismo color (rojo-400, ámbar-400, esmeralda-400). Ningún estado pinta fondos sólidos saturados, salvo los CTA destructivos y de reposición.

**La Regla del Filo de Humo.** Ningún borde blanco sólido: todo contorno es rgba(255,255,255,0.05–0.08). La estructura la dibuja la luz, no la línea.

## Typography

**Display Font:** Outfit (con Inter, sans-serif)
**Body Font:** Inter (con system-ui, sans-serif)
**Label/Mono Font:** Inter (las micro-etiquetas en mayúsculas cumplen el rol de "mono")

**Character:** Inter lleva la carga operativa con pesos 500–700 y tamaños pequeños (12–14px) que favorecen la densidad; Outfit 800–900 aparece sólo en los momentos de lectura a distancia — numerales de stock, KPIs y el wordmark. La escala es compacta y funcional: nada de titulares decorativos.

### Hierarchy
- **Display** (Outfit 800–900, 24–30px, lh 1.1): numerales de stock, KPIs de analítica y cifras de titulares. Segundo nivel: 18–20px (`font-display font-extrabold`) para títulos de marca y confirmaciones.
- **Headline** (Inter 700, 16–18px, lh 1.3): encabezados de sección y de modal.
- **Title** (Inter 700, 14px, lh 1.4): nombres de insumos, proveedores, títulos de tarjeta.
- **Body** (Inter 500–600, 12–14px, lh 1.5): descripciones, metadatos y detalle de auditoría; textos de apoyo bajan a 10–11px (slate-400/500).
- **Label** (Inter 700–800, 9–10px, letter-spacing amplio, MAYÚSCULAS): micro-etiquetas de campo ("STOCK ACTUAL", "SUGERIDO COMPRA", "SESIÓN") y etiquetas de navegación (9px).

### Named Rules
**La Regla del Número Protagonista.** La cifra es el héroe: stock, cantidades y KPIs siempre en Outfit 800+ y en blanco marfil o el color de señal que corresponda. Todo lo demás en la tarjeta es contexto y se apaga (slate-400/500).

**La Regla de la Etiqueta Susurrada.** Las micro-etiquetas nunca gritan: 9–10px, mayúsculas, tracking amplio, slate-400/500. Si una etiqueta compite con su número, está mal.

## Layout

Modelo de columna única centrada, mobile & tablet first: contenido en `max-w-xl` (576px), cabecera hasta `max-w-4xl` (896px) y barra inferior `max-w-lg` (512px). El ritmo vertical usa `space-y-3/4` (12/16px) y el padding de tarjeta `p-4 sm:p-5` (16→20px); el ritmo de espaciado canónico es 8/12/16/20/24px. Las separaciones internas se hacen con divisores hairline (`divide-white/[0.06]`), no con aire excesivo.

Grillas operativas: KPIs en 2 columnas que suben a 4 en `lg`; pares de tarjetas (proveedores, distribución + top 5) en 1 columna que suben a 2 en `lg`; acciones rápidas del dashboard en 1→2 columnas (`sm`). El contenido de la primera pantalla es siempre la acción: buscador, chips de categoría, y de inmediato las tarjetas.

El body reserva espacio inferior con `pb-safe-bottom` (`calc(5.5rem + env(safe-area-inset-bottom))`) para que nada quede bajo la navegación fija. El aluvión de datos vive en el pulgar: las acciones críticas (+, −, comiso, reponer) están en la mitad inferior de cada tarjeta.

### Named Rules
**La Regla del Pulgar.** Todo control interactivo mide mínimo 48×48px (`btn-thumb`), con `user-select: none` y `touch-action: manipulation`. Si no cabe para el pulgar con una mano, no pertenece a esta app.

**La Regla del Ancho de Bolsillo.** La columna de trabajo nunca supera 576px (`max-w-xl`); la app se sostiene con una mano en cocina, no en un escritorio.

## Elevation & Depth

Profundidad por capas tonales más brillo con propósito: no hay sombras "en blanco" ni luz ambiental clara. Las tarjetas flotan sobre el carbón mediante pasos tonales (#0f0f0f → #141414 → #1a1a1a → #1f1f1f → #242424) y sombras negras cálidas; el glow de color se reserva para lo accionable (CTA primarios, esmeralda de reposición, rojo de merma) y para alertas que merecen pulso. Las tarjetas en reposo llevan una sombra suave y difusa; al hover, el borde se enciende al 20–25 % de llama con un resplandor naranja muy tenue. Sobre fondos, los overlays de modal combinan `bg-black/75–80` con `backdrop-blur-md`; el desenfoque vive sólo en overlays y chrome fijo (barra inferior `bg-[#141414]/95 backdrop-blur-xl`, cabeceras sticky de modal).

### Shadow Vocabulary
- **Reposo de tarjeta** (`box-shadow: 0 4px 20px -2px rgba(0,0,0,0.4)`): superficie estándar (`dark-card`); las tarjetas inline usan variantes 0.25–0.3.
- **Hover de tarjeta** (`0 6px 24px -4px rgba(249,115,22,0.12)`): acompañado de borde llama/25; es el único hover que colorea sombra.
- **Paneles flotantes** (`0 24px 60px rgba(0,0,0,0.8)` modales; `0 16px 50px rgba(0,0,0,0.7)` menús desplegables).
- **Chrome fijo** (`0 4px 20px rgba(0,0,0,0.5)` cabecera; `0 -4px 24px rgba(0,0,0,0.5)` barra inferior).
- **Glow de acción** (`0 0 20px -3px rgba(249,115,22,0.35)` llama; `0 0 15px rgba(16,185,129,0.3)` esmeralda; `0 0 18px rgba(239,68,68,0.35)` rojo): sólo en botones primarios/CTA y en iconos de alerta crítica.

### Named Rules
**La Regla del Brillo con Propósito.** Nada brilla por decoración. El glow aparece sólo si el elemento es accionable (CTA) o si una alerta exige acción (insumo crítico, comiso, lote pendiente). Sin luz blanca, jamás.

**La Regla del Cristal Fijo.** `backdrop-blur` se reserva a lo que queda anclado — overlays, cabecera de modal y barra inferior. Las tarjetas del flujo nunca llevan vidrio.

## Shapes

Lenguaje de formas redondas y contundentes, sin esquina viva: el radio mínimo es 12px (`rounded-xl`) y se reserva para controles pequeños (miniaturas, iconos, ítems de menú). El radio de trabajo es 16px (`rounded-2xl`): botones, inputs, chips, botones ± y FAB. Las tarjetas y contenedores usan 24px (`rounded-3xl`), y en móvil los modales nacen como bottom sheets con `rounded-t-3xl`. Los badges y pastillas de conteo son círculos completos (`rounded-full`). Las fotos de insumo conservan su propio radio (12–16px) con el filo hairline alrededor; nunca son círculos.

### Named Rules
**La Regla de las Esquinas Gemelas.** Botón, input y chip comparten el mismo radio de 16px: si un control nuevo no puede emparejar con esa familia, está fuera del sistema.

## Components

### Buttons
Táctiles y contundentes: zonas de 48px mínimo, radio 16px, texto `text-xs/sm font-bold` y feedback físico (`active:scale-95` o `scale-[0.99]`).
- **Shape:** 16px (`rounded-2xl`); píldoras sólo para ± circulares de 48–56px.
- **Primary:** Llama de Servicio sólida (#f97316) o gradiente Llama Profunda→Llama (`from-orange-600 to-orange-500`) para el CTA principal de pantalla (login, FAB, guardar); sombra de glow naranja; padding 12–14px × 16px.
- **Hover / Focus:** hover a Llama Profunda (600) en CTAs planos o Llama Viva (400) en los ±; `active:scale-95`; `disabled:opacity-30–40`.
- **Secondary:** Ceniza Clara (#1f1f1f) con filo hairline y texto slate-300; mismo radio y altura.
- **Destructive:** rojo 600 (#dc2626) + glow rojo; siempre con confirmación (checkbox obligatorio en borrado).
- **Success / Reposición:** esmeralda 600 (#059669) + glow esmeralda; es el botón "Reponer"/"Guardar Entrada".
- **FAB central:** 48×48px con gradiente `from-orange-600 to-orange-400`, glow naranja y elevación física (`-mt-5` sobre la barra inferior); el único elemento que rompe la línea de la nav.

### Chips
- **Style:** inactivos en superficie (Ceniza/Humo #1a1a1a–#242424) con filo hairline y texto slate-400; activos en llama sólida (o gradiente Llama→Ámbar 600 en la lista de compras) con texto blanco y glow naranja.
- **State:** cada chip lleva conteo interno en pastilla (`bg-white/20` activo / tinte llama inactivo); fila horizontal con scroll, sin wrap. Los motivos de comiso usan el patrón de lavado 10 % + borde 40 % + emoji identificador.

### Badges de estado (signature)
El semáforo del inventario: píldora completa con tinte 15 % + borde 25 % + texto claro del color de señal — **Agotado** (rojo), **Stock Bajo** (ámbar), **Saludable** (esmeralda), **🔥 Clave** (llama, insumo prioritario). Texto 10px extrabold con icono Lucide de 12px. Caso extremo: **VENCIDO** se rompe a fondo rojo sólido con `animate-pulse` — la única alerta que grita. Los badges de auditoría (historial) usan discos sólidos 600 con icono blanco montados sobre la miniatura.

### Cards / Containers
- **Corner Style:** 24px (`rounded-3xl`).
- **Background:** Ceniza (#1a1a1a) sobre fondo Carbón (#0f0f0f); las tarjetas anidadas suben a Ceniza Clara/Humo.
- **Shadow Strategy:** ver Elevation — sombra negra suave en reposo; hover con borde llama/25 + glow tenue (patrón `dark-card-hover`).
- **Border:** filo hairline rgba(255,255,255,0.07–0.08); tarjetas de alerta cambian el filo al color de señal (rojo/30, naranja/30).
- **Internal Padding:** 16px móvil / 20px `sm` (`p-4 sm:p-5`); encabezado de card con `pb-2.5` y `border-b` hairline antes del contenido.

### Inputs / Fields
- **Style:** fondo Ceniza Clara (#1f1f1f; el buscador sobre superficie usa Ceniza #1a1a1a), filo hairline, radio 16px, altura ≥48px (`py-3–3.5`), texto blanco 13–14px, placeholder slate-600. Buscadores llevan icono Lucide a la izquierda (slate-500).
- **Focus:** borde llama/50 + `ring-2` tinte llama/15–20; en contextos destructivos el foco se vuelve rojo/50 con ring rojo.
- **Error / Disabled:** error = borde rojo-500 + `ring-2 ring-red-500/25` + mensaje 12px rojo-400; disabled = `opacity-40`.

### Navigation
- **Top Header:** sticky, fondo Brasa (#141414), borde inferior hairline, sombra de chrome. Logo SAHOCO a la izquierda + micro-etiqueta "INVENTARIO OPERATIVO" (10px tracking-widest, Llama Viva) y punto esmeralda `animate-pulse` con el conteo de productos. A la derecha: pastilla de sincronización (Humo, icono RefreshCw que gira al sincronizar) y pastilla de sesión con avatar emoji + menú desplegable (rounded-2xl, sombra profunda, ítems hover Humo, salir en rojo).
- **Bottom Nav:** fija, `bg-[#141414]/95 backdrop-blur-xl`, borde superior hairline, 5 tabs + FAB central elevado. Tab activo en Llama Viva con lavado tinte llama/15 en el icono (rounded-xl); inactivo slate-500 → hover slate-300. Etiquetas de 9px; el badge de compras es un disco rojo con `animate-pulse`.
- **Modales:** bottom sheet en móvil (`items-end`, `rounded-t-3xl`), centrado desde `sm` (`rounded-3xl`); panel Brasa con sombra 0.8, cabecera sticky con icono en badge de tinte + título y subtítulo 11px slate-400; acciones al pie con Cancelar (secondary) + CTA `flex-[1.6]` en el color del flujo (naranja guardar, esmeralda reponer, rojo comiso).

### [Signature] ProductCard
La unidad fundamental del sistema. Foto 80–96px rounded-2xl con botón cámara flotante (tinte llama + borde llama/30), fila de badges de estado, nombre en Title blanco, proveedor con icono de edificio en Llama Viva, numeral de stock en Display 24px que cambia a rojo/ámbar según estado, bloque "SUGERIDO COMPRA" editable en Ceniza Clara con borde llama/20, par de botones ± de 48px (rojo lavado para −, llama sólida con glow para +) y botón ancho de Comiso/Merma en lavado rojo. Es el lienzo donde vive toda la Regla del Pulgar.

### [Signature] Banners de lote (batching)
Avisos flotantes que cuentan el estado de sincronización: el pendiente vive sobre la nav (`fixed bottom-24`, panel Brasa con borde llama/30, icono reloj en tinte, botón "Sincronizar ahora") y el confirmado entra desde arriba (`fixed top-20`, borde esmeralda/30, texto esmeralda, animación framer-motion y→0). Son los únicos elementos que interrumpen el flujo, y siempre por una razón operativa.

## Do's and Don'ts

### Do:
- **Do** mantener el fondo Carbón (#0f0f0f) y las superficies estrictamente en la escalera #141414 → #1a1a1a → #1f1f1f → #242424; la jerarquía es tonal antes que sombreada.
- **Do** reservar la Llama (#f97316) para acciones, estados seleccionados, numerales vivos y énfasis; concentrarla, no esparcirla.
- **Do** construir estados nuevos con el patrón de señal: tinte 15 % + borde 25 % + texto del paso claro del mismo color.
- **Do** usar Outfit 800+ sólo para cifras y momentos de marca; Inter 500–700 para todo el resto.
- **Do** conservar mínimo 48px de zona táctil (`btn-thumb`) y radios de 16/24px en toda creación nueva.
- **Do** mantener la interfaz en español (es-DO), con tono directo de cocina; los emojis solos se reservan a categorías, motivos y estados (🍟🍰🥤📦, 🔥, 🚨).
- **Do** mostrar siempre el estado real: caché con aviso ante fallo, ceros honestos, badges sólo cuando el dato existe.

### Don't:
- **Don't** introducir un segundo color de marca ni un tema claro; el mundo beige/marrón del prototipo anterior quedó retirado (src/ es legado, no referencia visual).
- **Don't** pintar fondos grandes con colores saturados: los colores vivos viven en tintes /15, bordes /25 y sombras de glow; la única excepción son los CTA sólidos y el gradiente de chips seleccionados (Llama→Ámbar 600).
- **Don't** usar gradientes fuera de las dos familias sancionadas: CTA naranja (`from-orange-600 to-orange-500/400`) y el lavado de insumos críticos (`from-red-500/[0.12] via-orange-500/[0.07]`).
- **Don't** añadir bordes blancos sólidos ni superar ~8 % de blanco en filos y divisores.
- **Don't** usar sombras con luz clara, ni `backdrop-blur` fuera de overlays y chrome fijo.
- **Don't** cuadrar esquinas (mínimo 12px) ni crear controles por debajo de 44px.
- **Don't** fabricar estados visuales que no existen en el inventario: si el dato no está, se muestra el vacío o el error con instrucciones — nunca un badge, stock o producto inventado.
