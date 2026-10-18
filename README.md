# 📱 SAHOCO • Aplicación Móvil de Inventario (Mobile & Tablet First)

Aplicación web de inventario en tiempo real diseñada exclusivamente con enfoque **Mobile & Tablet First** para el negocio **SAHOCO (Fast Food & Postres Synthia)**.

---

## 🎨 Paleta de Colores & Estilo Visual
- **Fondo Principal:** Blanco puro y Beige cálido (`#FDFBF7` / `#F5F0E6`).
- **Textos y Botones Principales:** Marrón café suave (`#5C3D2E` / `#3D2B1F`).
- **Acentos y Badges:** Dorado ámbar cálido (`#D97706` / `#F59E0B`).
- **Ergonomía Táctil:** Botones con área de contacto para pulgar (`btn-thumb` de 48px) y barra de navegación inferior fija (*Bottom Navigation Bar*).

---

## 🔒 Autenticación & Seguridad (Sin Registro Público)
La app inicia con una pantalla de inicio de sesión estética con acceso restringido para los 6 usuarios autorizados:

| Usuario | Rol / Posición | Avatar |
| :--- | :--- | :---: |
| **Zahir** | Gerencia General | 👨‍💼 |
| **Alba** | Administración & Compras | 👩‍💼 |
| **Elmy** | Supervisión de Calidad | 👩‍🍳 |
| **Hugo** | Jefe de Cocina | 👨‍🍳 |
| **Leo** | Operaciones & Despacho | 🧑‍🍳 |
| **Rosalia** | Repostería Synthia | 🍰 |

- **Contraseña Única:** `s4hoco2026`
- **Sesión Activa:** Se guarda en `localStorage` y muestra en la barra superior: *"Sesión activa: Zahir"* (o el usuario conectado).

---

## 📱 Vistas Principales & Navegación

### 1. Vista 1: Inventario Móvil (`app/page.tsx` & `components/ProductCard.tsx`)
- Tarjetas individuales con fotografía del producto.
- **Toma de fotos y subida de archivos:** Botón de cámara en cada tarjeta para capturar desde la cámara del celular o seleccionar de la galería (convertido a Base64).
- Nombre, Proveedor, Categoría (*Insumos & Salado, Postres & Repostería, Bebidas, Desechables*).
- **Fecha de vencimiento** con alerta automática si está próxima a vencer (≤ 7 días) o vencida.
- Cantidad actual y unidad (*Paquete, Unidad, Cajas, Libras, Galón*).
- **Campo de Cantidad Sugerida Editable** en la misma tarjeta.
- Botones de incremento `[ + ]` y `[ - ]` grandes para pulgar con actualización optimista inmediata.

### 2. Vista 2: Lista de Compras Estética (`components/ShoppingListView.tsx`)
- Ordenada automáticamente por **Proveedor** (*Sirena, PriceSmart, Synthia, Neno Distribuidora, etc.*).
- Filtra los artículos con `Stock Actual <= Stock Mínimo`.
- Cantidad actual y cantidad sugerida editable.
- **Botón "Copiar Pedido":** Copia el pedido formateado en texto limpio al portapapeles sin WhatsApp.
- Botón para marcar como recibido y reabastecer el inventario con confeti.

### 3. Vista 3: Historial y Notificaciones (`components/HistoryView.tsx`)
- Feed visual de los últimos cambios de stock y productos agregados.
- Registra el nombre del usuario responsable, la fecha/hora y la foto del producto.

### 4. Modal "Añadir Nuevo Producto" (`components/AddProductModal.tsx`)
- Captura de foto con cámara o archivo.
- Nombre, proveedor, categoría, descripción, cantidad inicial, unidad, stock mínimo, stock máximo, cantidad sugerida y fecha de vencimiento.

---

## 🔗 Integración Backend (Google Apps Script)

- **API Endpoint Oficial:**
  ```
  https://script.google.com/macros/s/AKfycbyg8SOTyfvp7jUnIPp1VFE3yNuIs-kR1lffDhXIskghKBh9JAky1t6j-Lnu1IkSIOnGrg/exec
  ```
- **Petición GET:** Carga el inventario inicial.
- **Petición POST (Ajuste):**
  ```json
  {
    "action": "update",
    "rowIndex": 2,
    "actual": 12,
    "sugerido": 25,
    "usuario": "Zahir",
    "nombre": "Papa Prefrita"
  }
  ```
  El script de Apps Script envía un correo automático de auditoría con la identidad del usuario que realizó la modificación.
- **Petición POST (Nuevo Producto):**
  ```json
  {
    "action": "add",
    "item": { ... },
    "usuario": "Alba"
  }
  ```

---

## 🚀 Cómo Ejecutar

```bash
# Iniciar servidor local
npm run dev
```
Accede desde tu celular o tablet en la misma red Wi-Fi o en tu computador a:
👉 `http://localhost:3000/`
