# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

8 usuarios autorizados comparten la app con **los mismos permisos** (decisión confirmada 2026: sin roles ni restricciones por rol; la confianza y la auditoría por correo bastan): Zahir, Alba, Elmy, Hugo, Leo, Rosalia, Cecilio y el pseudo-usuario SAHOCO del sistema.

Cada uno la usa desde **su propio celular o tablet, en distintos momentos del día**: cocina y despacho registran consumos y comisos durante el servicio, repostería controla insumos Synthia, y administración revisa faltantes, edita fichas y arma pedidos. El trabajo a realizar: mantener el inventario real de la cocina al día en segundos, saber qué comprar y que cada cambio quede auditado con responsable y hora.

## Product Purpose

Control de inventario en tiempo real para **SAHOCO (Fast Food & Postres Synthia)**, un único local. La app lee y escribe directamente la hoja de cálculo real del negocio ("INVENTARIO SAHOCO", pestaña "Inv.") mediante Google Apps Script, y acompaña cada movimiento con correos HTML de auditoría al dueño.

Éxito significa: la hoja siempre refleja la verdad de la cocina, los pedidos a suplidores salen de la lista de compras automática, las mermas tienen motivo y responsable, y las recetas descuentan insumos con precisión quirúrgica.

## Positioning

La app corre sobre las herramientas que el negocio ya vive: **Google Sheets como única fuente de verdad y Gmail para notificar**, sin servidor propio, base de datos ni cuentas nuevas. Los 8 usuarios la abren desde el navegador del celular (Next.js + Tailwind, desplegable en Vercel).

Mecanismos que un producto vecino no podría copiar de forma veraz: deducción quirúrgica por receta/plato insumo por insumo, registro de comisos/mermas con motivo, insumos prioritarios que escalan los correos a máxima prioridad, y batching de jornada que consolida los correos de auditoría en un solo envío.

## Operating Context

- **Un solo local**, en República Dominicana; los correos usan la zona `America/Santo_Domingo`.
- La conexión es confiable; la caché en `localStorage`, la cola de cambios pendientes y el reenvío automático son **red de seguridad, no escenario diario** (confirmado 2026).
- Los insumos se organizan en 4 categorías: *Insumos & Salado, Postres & Repostería, Bebidas, Desechables*; las unidades usan *Paquete, Unidad, Cajas, Libras, Galón*.
- Los pedidos se agrupan por suplidor (Sirena, PriceSmart, Synthia, Neno Distribuidora, etc.) y se copian al portapapeles como texto para enviar por fuera de la app.
- Las fotos de productos se toman con la cámara del celular o la galería y viajan como Base64 a la hoja.
- Rituales operativos: **lote de jornada** (los cambios de stock se acumulan y sincronizan en un solo envío cuando pasa la ventana sin cambios, o al pulsar "Sincronizar ahora"), resumen diario automático (11:30 PM) y correos de auditoría al dueño.
- Toda la interfaz y los correos están en **español (es-DO)**.

## Capabilities and Constraints

Capacidades actuales:

- Tarjetas de insumos con foto, suplidor, categoría, alerta de vencimiento (≤ 7 días / vencido), stock actual con controles `+ / -` táctiles y cantidad sugerida editable en la misma tarjeta.
- Lista de compras automática (stock ≤ mínimo) ordenada por suplidor, con botón "Copiar Pedido" y "marcar como recibido" que reabastece con confeti.
- Historial/auditoría visual con usuario, fecha/hora y foto; añadir/editar/eliminar insumos; ficha editable completa.
- **Comisos/Mermas** con motivos (Vencimiento, Daño físico, Error de preparación, Otro), cantidad, notas y correo.
- **Recetas** con ingredientes ligados al inventario y modo "Preparar Plato" que descuenta cada insumo de forma tolerante a fallos y audita por ingrediente.
- Dashboard de analítica con KPIs de operación.
- **Prioridad de insumos** (Alta/Media/Baja) que escala los correos de alerta a máxima prioridad.
- Auth sin registro público: selección entre los 8 usuarios autorizados + contraseña compartida; sesión persistida en `localStorage`.
- Enfoque **Mobile & Tablet First** documentado como requisito: uso con una mano, botones grandes para pulgar y barra de navegación inferior fija.

Restricciones y contrato técnico:

- Backend: Google Apps Script atado a la hoja "INVENTARIO SAHOCO", pestaña "Inv." (datos desde la fila 3); API por acciones `get / update / add / delete / bulk_update / get_recipes / save_recipe / delete_recipe`; el endpoint se configura en `NEXT_PUBLIC_APPS_SCRIPT_URL` y se proxya por `/api/inventory` para evitar CORS.
- Regla de datos: **cero datos ficticios**. Si el backend falla nunca se vacía el inventario: se muestra la caché real con aviso; si no hay backend ni caché, se muestra el error con instrucciones en lugar de productos inventados.
- `src/` (prototipo Vite anterior) es **legado** (confirmado 2026): la única verdad es la app Next.js en `app/`, `components/` y `lib/`; `src/` queda fuera de todo trabajo futuro y puede retirarse.
- Decidido explícitamente: sin permisos por rol y sin multi-local (un solo local). No diseñar asumiendo restricciones ni escenarios multi-sucursal.

## Brand Commitments

- Nombre: **SAHOCO** (Fast Food & Postres Synthia). Logo en `public/Logo.png`.
- Idioma de producto: español. Los correos firman "SAHOCO Inventario" / "SAHOCO App" con tono cercano, directo y uso de emoji de estado (🚨 crítica, ⚠️ advertencia, 📦 lote, 🗑️ eliminación, 🔥 prioridad).
- Superficies de marca existentes: la app y los correos HTML de auditoría (plantilla propia en `google_apps_script/Correos.gs`).

## Evidence on Hand

- Hoja de cálculo viva "INVENTARIO SAHOCO" (el inventario operativo real, ~131 productos referenciados en la UI).
- `google_apps_script/Code.gs` y `Correos.gs`: espejo del backend desplegado (controlador + módulo de correos completo, sincronizado con producción).
- `public/Logo.png` como único asset de marca.
- `README.md` está **parcialmente desactualizado** (habla de 6 usuarios y de una estética anterior; el código tiene 8 usuarios y otra dirección visual): verificar contra el código antes de citarlo.
- No existen testimonios, clientes, precios ni benchmarks: el trabajo futuro **no debe fabricarlos**.

## Product Principles

1. **La hoja es la única fuente de verdad.** Nunca datos ficticios; ante fallos, caché real con aviso — jamás vaciar el inventario.
2. **Registro táctil de segundos.** Cada ajuste de stock, comiso o preparación se completa desde el celular con el pulgar, con actualización optimista y auditoría automática (usuario + hora).
3. **Cada cambio deja rastro.** Historial local + correo HTML al dueño; el lote de jornada consolida para no saturar el correo.
4. **Infraestructura del negocio, no nueva.** Sheets, Gmail y Next.js son las herramientas; sin servidores, bases de datos ni cuentas nuevas.
5. **Confianza compartida con control por auditoría.** Todos los usuarios son iguales por decisión; el control no viene de restringir, viene de registrar quién hizo qué.
