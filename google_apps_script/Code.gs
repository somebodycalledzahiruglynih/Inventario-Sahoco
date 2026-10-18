/**
 * ==============================================================================
 * SAHOCO INVENTARIO & GESTIÓN MÓVIL - GOOGLE APPS SCRIPT
 * Archivo: Código.gs / Code.gs
 * ==============================================================================
 * CARGA COMPLETA DE LOS 131 PRODUCTOS DE LA HOJA "Inv."
 *
 * ACCIONES SOPORTADAS:
 *  - get / get_inventory ........ Lee el inventario completo de "Inv."
 *  - update ..................... Actualiza stock, sugerido y campos de ficha.
 *                                 Si incluye "comiso" → auditoría + correo.
 *  - add / delete ............... Crear y eliminar insumos.
 *  - bulk_update ................ Descuento en lote (preparación de platos).
 *  - get_recipes / save_recipe / delete_recipe .. Recetas en pestaña "Recetas".
 *
 * NOTIFICACIONES POR CORREO:
 *  Configura la lista SAHOCO_EMAIL_NOTIFICACIONES (abajo) con los correos que
 *  deben recibir las alertas de comisos/mermas. Si está vacía, no se envía
 *  correo y el sistema sigue funcionando igual.
 *
 * INSTRUCCIONES DE INSTALACIÓN EN GOOGLE SHEETS:
 * 1. En tu hoja de cálculo de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra el código existente y pega este archivo completo.
 * 3. Si tu Apps Script está vinculado a la hoja (Extensiones > Apps Script),
 *    no necesitas modificar GOOGLE_SHEET_ID. Si es un script independiente,
 *    coloca el ID de tu hoja en GOOGLE_SHEET_ID abajo.
 * 4. Haz clic en "Implementar" > "Gestionar implementaciones" > Edita la activa
 *    (o crea "Nueva implementación" > Tipo: "Aplicación web"):
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquiera" (Anyone)
 * 5. Haz clic en "Implementar" y copia la URL terminada en /exec.
 * ==============================================================================
 */

// Opcional: Solo si el script NO está vinculado directamente a la hoja de cálculo.
const GOOGLE_SHEET_ID = "";

// Nombres posibles para la pestaña de inventario (prioridad a "Inv.")
const TARGET_SHEET_NAMES = ["Inv.", "Inv", "Inventario", "INVENTARIO", "INV."];
const SHEET_AUDITORIA = "Auditoria";

// ── EXPANSIÓN SAHOCO: Comisos / Recetas / Notificaciones ──
// Agrega aquí los correos que deben recibir las alertas de comisos/mermas.
// Si la lista está vacía, no se envía correo (el resto del sistema sigue igual).
const SAHOCO_EMAIL_NOTIFICACIONES = [];
const SAHOCO_SHEET_COMISOS = "Comisos";
const SAHOCO_SHEET_RECETAS = "Recetas";

/**
 * Obtiene la hoja de cálculo activa o por ID
 */
function getTargetSpreadsheet() {
  if (GOOGLE_SHEET_ID && GOOGLE_SHEET_ID.trim().length > 10) {
    return SpreadsheetApp.openById(GOOGLE_SHEET_ID.trim());
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error("No se encontró la hoja de cálculo activa. Vincula el script desde Extensiones > Apps Script o define GOOGLE_SHEET_ID.");
}

/**
 * Encuentra la hoja de inventario (buscando 'Inv.' prioritariamente)
 */
function getInventorySheet(ss) {
  for (let i = 0; i < TARGET_SHEET_NAMES.length; i++) {
    const sheet = ss.getSheetByName(TARGET_SHEET_NAMES[i]);
    if (sheet) return sheet;
  }
  // Si no encuentra con los nombres esperados, toma la primera pestaña visible
  const allSheets = ss.getSheets();
  if (allSheets && allSheets.length > 0) {
    return allSheets[0];
  }
  throw new Error("No se encontró ninguna pestaña en la hoja de cálculo.");
}

/**
 * Normaliza textos para búsqueda de encabezados
 */
function cleanHeader(val) {
  if (!val) return "";
  return String(val)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Auto-clasifica categoría según el nombre del insumo
 */
function autoClassify(nombre, existingCat) {
  const cat = cleanHeader(existingCat);
  const n = cleanHeader(nombre);

  if (cat.indexOf("postre") !== -1 || cat.indexOf("reposter") !== -1 || cat.indexOf("synthia") !== -1 ||
      n.indexOf("tres leches") !== -1 || n.indexOf("cheesecake") !== -1 || n.indexOf("flan") !== -1 ||
      n.indexOf("gelatina") !== -1 || n.indexOf("bizcocho") !== -1 || n.indexOf("oreo") !== -1 || n.indexOf("torta") !== -1) {
    return "Postres & Repostería";
  }

  if (cat.indexOf("bebida") !== -1 || cat.indexOf("jugo") !== -1 || cat.indexOf("refresco") !== -1 || cat.indexOf("topping") !== -1 ||
      n.indexOf("coca") !== -1 || n.indexOf("agua") !== -1 || n.indexOf("syrup") !== -1 ||
      n.indexOf("nutella") !== -1 || n.indexOf("soda") !== -1 || n.indexOf("jugo") !== -1 || n.indexOf("sirope") !== -1) {
    return "Bebidas";
  }

  if (cat.indexOf("desechable") !== -1 || cat.indexOf("empaque") !== -1 || cat.indexOf("envase") !== -1 ||
      n.indexOf("vaso") !== -1 || n.indexOf("caja") !== -1 || n.indexOf("funda") !== -1 ||
      n.indexOf("tenedor") !== -1 || n.indexOf("cuchara") !== -1 || n.indexOf("tapa") !== -1 ||
      n.indexOf("servilleta") !== -1 || n.indexOf("plato") !== -1 || n.indexOf("bolsa") !== -1) {
    return "Desechables & Empaques";
  }

  return "Insumos & Salado";
}

/**
 * Detecta el mapa de columnas (0-based) de la hoja de inventario.
 * Se utiliza tanto en "get" como en "update"/"bulk_update" para mantener
 * simetría exacta entre lectura y escritura.
 */
function detectColumnMap(sheet, lastCol) {
  const headerRow2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
  const headerRow1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let colId = -1;
  let colNombre = -1;
  let colCategoria = -1;
  let colSuplidor = -1;
  let colUnidad = -1;
  let colActual = -1;
  let colMin = -1;
  let colMax = -1;
  let colSugerido = -1;
  let colDescripcion = -1;
  let colVencimiento = -1;
  let colFoto = -1;

  for (let c = 0; c < lastCol; c++) {
    const h = cleanHeader(headerRow2[c]) || cleanHeader(headerRow1[c]);
    if (!h) continue;

    if (colId === -1 && (h === "id" || h === "codigo" || h === "item" || h === "#" || h === "no.")) colId = c;
    if (colNombre === -1 && (h.indexOf("nombre") !== -1 || h.indexOf("articulo") !== -1 || h.indexOf("producto") !== -1 || h.indexOf("descripcion del producto") !== -1 || h === "insumo")) colNombre = c;
    if (colCategoria === -1 && (h.indexOf("categoria") !== -1 || h.indexOf("seccion") !== -1 || h.indexOf("tipo") !== -1)) colCategoria = c;
    if (colSuplidor === -1 && (h.indexOf("suplidor") !== -1 || h.indexOf("proveedor") !== -1 || h.indexOf("origen") !== -1)) colSuplidor = c;
    if (colUnidad === -1 && (h.indexOf("unidad") !== -1 || h.indexOf("medida") !== -1 || h.indexOf("presentacion") !== -1)) colUnidad = c;
    if (colActual === -1 && (h.indexOf("actual") !== -1 || h.indexOf("restante") !== -1 || h.indexOf("existencia") !== -1 || h.indexOf("stock actual") !== -1 || h.indexOf("conteo") !== -1)) colActual = c;
    if (colMin === -1 && (h.indexOf("minimo") !== -1 || h === "min" || h.indexOf("stock min") !== -1)) colMin = c;
    if (colMax === -1 && (h.indexOf("maximo") !== -1 || h === "max" || h.indexOf("stock max") !== -1)) colMax = c;
    if (colSugerido === -1 && (h.indexOf("sugerid") !== -1 || h.indexOf("a pedir") !== -1 || h.indexOf("pedido") !== -1 || h.indexOf("compra") !== -1)) colSugerido = c;
    if (colDescripcion === -1 && (h === "descripcion" || h.indexOf("detalle") !== -1 || h.indexOf("nota") !== -1)) colDescripcion = c;
    if (colVencimiento === -1 && (h.indexOf("vencimiento") !== -1 || h.indexOf("caducidad") !== -1 || h.indexOf("fecha") !== -1)) colVencimiento = c;
    if (colFoto === -1 && (h.indexOf("foto") !== -1 || h.indexOf("imagen") !== -1 || h.indexOf("url") !== -1)) colFoto = c;
  }

  // Índices estándar por defecto si no se detectaron en encabezados
  if (colId === -1) colId = 0;
  if (colNombre === -1) colNombre = 1;
  if (colCategoria === -1) colCategoria = 2;
  if (colSuplidor === -1) colSuplidor = 3;
  if (colUnidad === -1) colUnidad = 4;
  if (colActual === -1) colActual = 5;
  if (colMin === -1) colMin = 6;
  if (colMax === -1) colMax = 7;
  if (colSugerido === -1) colSugerido = 8;
  if (colDescripcion === -1) colDescripcion = 9;
  if (colVencimiento === -1) colVencimiento = 10;
  if (colFoto === -1) colFoto = 11;

  return {
    id: colId,
    nombre: colNombre,
    categoria: colCategoria,
    suplidor: colSuplidor,
    unidad: colUnidad,
    actual: colActual,
    min: colMin,
    max: colMax,
    sugerido: colSugerido,
    descripcion: colDescripcion,
    vencimiento: colVencimiento,
    foto: colFoto
  };
}

/**
 * Registra un comiso en la pestaña "Comisos" (si no existe, la crea).
 * Nunca interrumpe la operación principal si falla.
 */
function sahocoRegistrarComiso_(ss, detalle) {
  try {
    let sheetC = ss.getSheetByName(SAHOCO_SHEET_COMISOS);
    if (!sheetC) {
      sheetC = ss.insertSheet(SAHOCO_SHEET_COMISOS);
      sheetC.appendRow([
        "Fecha", "Producto", "Cantidad", "Unidad", "Motivo",
        "Fecha Vencimiento", "Notas", "Usuario", "Stock Anterior", "Stock Nuevo"
      ]);
    }
    sheetC.appendRow([
      new Date(),
      detalle.producto || "",
      detalle.cantidad || 0,
      detalle.unidad || "",
      detalle.motivo || "",
      detalle.fechaVencimiento || "",
      detalle.notas || "",
      detalle.usuario || "",
      detalle.stockAnterior || 0,
      detalle.stockNuevo || 0
    ]);
  } catch (e) {
    // Silencioso: la app no debe fallar si la hoja de comisos no está disponible
  }
}

/**
 * Envía la notificación por correo de un comiso/merma.
 * Se desactiva automáticamente si SAHOCO_EMAIL_NOTIFICACIONES está vacío.
 * Función exclusiva de esta expansión para no colisionar con Correos.gs existente.
 */
function sahocoNotificarComiso_(detalle) {
  try {
    if (!SAHOCO_EMAIL_NOTIFICACIONES || SAHOCO_EMAIL_NOTIFICACIONES.length === 0) {
      return;
    }
    const asunto = "🚨 SAHOCO | Comiso/Merma registrado: " + (detalle.producto || "Insumo");
    const cuerpo = [
      "COMISO / MERMA REGISTRADO EN SAHOCO",
      "--------------------------------------",
      "Producto: " + (detalle.producto || ""),
      "Cantidad retirada: " + (detalle.cantidad || 0) + " " + (detalle.unidad || ""),
      "Motivo: " + (detalle.motivo || ""),
      "Fecha de vencimiento: " + (detalle.fechaVencimiento || "No aplica"),
      "Notas: " + (detalle.notas || "Sin observaciones"),
      "Stock anterior: " + (detalle.stockAnterior || 0),
      "Stock nuevo: " + (detalle.stockNuevo || 0),
      "Registrado por: " + (detalle.usuario || ""),
      "Fecha del registro: " + new Date().toLocaleString("es-DO")
    ].join("\n");

    MailApp.sendEmail({
      to: SAHOCO_EMAIL_NOTIFICACIONES.join(","),
      subject: asunto,
      body: cuerpo
    });
  } catch (e) {
    // Si el correo falla, el comiso ya quedó registrado: no romper la respuesta
  }
}

/**
 * Obtiene (o crea) la hoja de recetas.
 */
function sahocoGetRecipesSheet_(ss) {
  let sheetR = ss.getSheetByName(SAHOCO_SHEET_RECETAS);
  if (!sheetR) {
    sheetR = ss.insertSheet(SAHOCO_SHEET_RECETAS);
    sheetR.appendRow(["ID", "Nombre", "Categoria", "JSON", "CreadoPor", "FechaActualizacion"]);
  }
  return sheetR;
}

/**
 * Manejador principal unificado para peticiones GET y POST
 */
function handleRequest(e) {
  try {
    let action = "get";
    let postData = null;

    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (postData && postData.action) {
          action = postData.action;
        }
      } catch (parseErr) {
        // En caso de que no sea JSON válido en POST
      }
    }

    const ss = getTargetSpreadsheet();
    const sheet = getInventorySheet(ss);

    // =========================================================================
    // ACCIÓN: OBTENER TODOS LOS PRODUCTOS (action === "get" o "get_inventory")
    // =========================================================================
    if (action === "get" || action === "get_inventory" || action === "test" || action === "read") {
      const lastRow = sheet.getLastRow();
      const lastCol = Math.max(sheet.getLastColumn(), 14);

      // Si no hay datos suficientes para llegar a la fila 3
      if (lastRow < 3) {
        return createJsonResponse({
          status: "success",
          count: 0,
          total: 0,
          sheet: sheet.getName(),
          data: []
        });
      }

      // 1. Detección dinámica de encabezados (lógica compartida con update/bulk_update)
      const cols = detectColumnMap(sheet, lastCol);
      const colId = cols.id;
      const colNombre = cols.nombre;
      const colCategoria = cols.categoria;
      const colSuplidor = cols.suplidor;
      const colUnidad = cols.unidad;
      const colActual = cols.actual;
      const colMin = cols.min;
      const colMax = cols.max;
      const colSugerido = cols.sugerido;
      const colDescripcion = cols.descripcion;
      const colVencimiento = cols.vencimiento;
      const colFoto = cols.foto;

      // 2. Lectura Completa del Rango: Desde Fila 3 hasta sheet.getLastRow()
      const startRow = 3;
      const numRows = lastRow - startRow + 1;
      const allRows = sheet.getRange(startRow, 1, numRows, lastCol).getValues();

      const items = [];

      // 3. Recorrido sin retorno prematuro: NINGÚN producto se descarta
      for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const currentRowNumber = startRow + i;

        // Comprobación de fila completamente vacía (solo omitir si absolutamente todas las celdas están vacías)
        let isCompletelyEmpty = true;
        for (let k = 0; k < row.length; k++) {
          if (row[k] !== "" && row[k] !== null && row[k] !== undefined) {
            isCompletelyEmpty = false;
            break;
          }
        }
        if (isCompletelyEmpty) {
          continue; // No romper el bucle con break, solo continuar con la siguiente fila
        }

        // Extracción de datos
        let rawId = row[colId];
        let rawNombre = row[colNombre];

        // Si la columna Nombre está vacía, revisar si el nombre está en la columna ID o viceversa
        if (!rawNombre && rawId && isNaN(Number(rawId))) {
          rawNombre = rawId;
          rawId = "PRD-" + currentRowNumber;
        }

        const nombre = rawNombre ? String(rawNombre).trim() : ("Insumo Fila " + currentRowNumber);
        const id = rawId ? String(rawId).trim() : ("PRD-" + currentRowNumber);

        // Extracción numérica segura (valores por defecto 0 si están vacíos, NaN o null)
        const parseStockValue = function(val, defaultVal) {
          if (val === "" || val === null || val === undefined) return defaultVal;
          const cleaned = String(val).replace(/,/g, ".").replace(/[^0-9.-]/g, "").trim();
          const num = Number(cleaned);
          return isNaN(num) ? defaultVal : num;
        };

        const stockActual = parseStockValue(row[colActual], 0);
        const stockMinimo = parseStockValue(row[colMin], 0);
        const stockMaximo = parseStockValue(row[colMax], 0);
        let cantidadSugerida = parseStockValue(row[colSugerido], 0);

        if (cantidadSugerida === 0 && stockMaximo > stockActual) {
          cantidadSugerida = Math.max(0, stockMaximo - stockActual);
        }

        const suplidor = row[colSuplidor] ? String(row[colSuplidor]).trim() : "Proveedor General";
        const unidad = row[colUnidad] ? String(row[colUnidad]).trim() : "Unidad";
        const categoria = autoClassify(nombre, row[colCategoria]);
        const descripcion = row[colDescripcion] ? String(row[colDescripcion]).trim() : "";
        const fechaVencimiento = row[colVencimiento] ? String(row[colVencimiento]).trim() : "";
        const foto = row[colFoto] ? String(row[colFoto]).trim() : "";

        items.push({
          id: id,
          rowIndex: currentRowNumber,
          nombre: nombre,
          categoria: categoria,
          suplidor: suplidor,
          unidad: unidad,
          stockActual: stockActual,
          stockMinimo: stockMinimo,
          stockMaximo: stockMaximo,
          cantidadSugerida: cantidadSugerida,
          descripcion: descripcion,
          fechaVencimiento: fechaVencimiento,
          foto: foto,
          ultimaModificacion: new Date().toISOString(),
          modificadoPor: "Google Sheets"
        });
      }

      return createJsonResponse({
        status: "success",
        count: items.length,
        total: items.length,
        sheet: sheet.getName(),
        startRow: startRow,
        lastRow: lastRow,
        data: items
      });
    }

    // =========================================================================
    // ACCIÓN: ACTUALIZAR EXISTENCIAS (POST { action: "update", rowIndex, actual })
    // Compatible con el formato anterior + campos opcionales de ficha (foto, mín/máx, etc.)
    // y detalles de comiso (auditoría + correo).
    // =========================================================================
    if (action === "update" && postData) {
      const rowIndex = Number(postData.rowIndex);
      const newActual = Number(postData.actual);
      const newSugerido = postData.sugerido !== undefined ? Number(postData.sugerido) : null;
      const usuario = postData.usuario || "Usuario Sahoco";
      const nombre = postData.nombre || "Insumo";
      const lastCol = Math.max(sheet.getLastColumn(), 14);
      const cols = detectColumnMap(sheet, lastCol);

      if (rowIndex >= 3 && rowIndex <= sheet.getLastRow()) {
        // Stock actual (columna detectada, respaldo estándar: columna 6)
        if (!isNaN(newActual)) {
          sheet.getRange(rowIndex, cols.actual + 1).setValue(newActual);
        }

        // Cantidad sugerida (columna detectada, respaldo estándar: columna 9)
        if (newSugerido !== null && !isNaN(newSugerido)) {
          sheet.getRange(rowIndex, cols.sugerido + 1).setValue(newSugerido);
        }

        // Campos opcionales enviados por la ficha de edición rápida
        const optionalFields = [
          ["nombre", cols.nombre],
          ["suplidor", cols.suplidor],
          ["categoria", cols.categoria],
          ["unidad", cols.unidad],
          ["stockMinimo", cols.min],
          ["stockMaximo", cols.max],
          ["descripcion", cols.descripcion],
          ["fechaVencimiento", cols.vencimiento],
          ["foto", cols.foto]
        ];
        for (let f = 0; f < optionalFields.length; f++) {
          const key = optionalFields[f][0];
          const colIndex = optionalFields[f][1];
          if (postData[key] !== undefined && postData[key] !== null && colIndex >= 0) {
            sheet.getRange(rowIndex, colIndex + 1).setValue(postData[key]);
          }
        }

        // Columnas 13 y 14: Fecha y Usuario (si existen)
        if (sheet.getLastColumn() >= 13) {
          sheet.getRange(rowIndex, 13).setValue(new Date().toISOString());
        }
        if (sheet.getLastColumn() >= 14) {
          sheet.getRange(rowIndex, 14).setValue(usuario);
        }
      }

      // ── Comiso / Merma: auditoría dedicada + notificación por correo ──
      let esComiso = false;
      let mensajeComiso = "";
      if (postData.comiso) {
        try {
          const c = postData.comiso;
          const detalleComiso = {
            producto: nombre,
            cantidad: Number(c.cantidad) || 0,
            unidad: c.unidad || "",
            motivo: c.motivo || "Otro",
            fechaVencimiento: c.fechaVencimiento || "",
            notas: c.notas || "",
            usuario: usuario,
            stockAnterior: c.stockAnterior !== undefined ? Number(c.stockAnterior) : "",
            stockNuevo: c.stockNuevo !== undefined ? Number(c.stockNuevo) : newActual
          };
          logAudit(ss, "COMISO", `Comiso/Merma de "${nombre}": -${detalleComiso.cantidad} ${detalleComiso.unidad} | Motivo: ${detalleComiso.motivo} | Venció: ${detalleComiso.fechaVencimiento || "N/A"} | Notas: ${detalleComiso.notas || "Sin observaciones"}`, usuario);
          sahocoRegistrarComiso_(ss, detalleComiso);
          sahocoNotificarComiso_(detalleComiso);
          esComiso = true;
          mensajeComiso = `Comiso de "${nombre}" registrado: -${detalleComiso.cantidad} ${detalleComiso.unidad} (${detalleComiso.motivo})`;
        } catch (comisoErr) {
          // El stock ya fue actualizado: un fallo de auditoría/correo no debe romper la respuesta
        }
      }

      if (!esComiso) {
        logAudit(ss, "ACTUALIZACIÓN", `Stock de "${nombre}" ajustado a ${newActual} por ${usuario}`, usuario);
      }

      return createJsonResponse({
        status: "success",
        message: esComiso ? mensajeComiso : `Stock de "${nombre}" actualizado a ${newActual}`,
        rowIndex: rowIndex,
        actual: newActual
      });
    }

    // =========================================================================
    // ACCIÓN: DESCUENTO EN LOTE / PREPARACIÓN DE PLATOS (POST { action: "bulk_update", changes: [...] })
    // Cada insumo se procesa de forma aislada: si uno falla, los demás se mantienen.
    // =========================================================================
    if (action === "bulk_update" && postData && Array.isArray(postData.changes)) {
      const usuario = postData.usuario || "Usuario Sahoco";
      const detalle = postData.detalle || "Actualización en lote";
      const lastCol = Math.max(sheet.getLastColumn(), 14);
      const cols = detectColumnMap(sheet, lastCol);
      const results = [];
      let applied = 0;
      const lastRow = sheet.getLastRow();

      for (let i = 0; i < postData.changes.length; i++) {
        const change = postData.changes[i];
        try {
          const rowIndex = Number(change.rowIndex);
          const newActual = Number(change.actual);
          if (rowIndex < 3 || rowIndex > lastRow || isNaN(newActual)) {
            results.push({ rowIndex: rowIndex, nombre: change.nombre || "", status: "skipped" });
            continue;
          }
          sheet.getRange(rowIndex, cols.actual + 1).setValue(newActual);
          if (change.sugerido !== undefined && !isNaN(Number(change.sugerido))) {
            sheet.getRange(rowIndex, cols.sugerido + 1).setValue(Number(change.sugerido));
          }
          if (sheet.getLastColumn() >= 13) {
            sheet.getRange(rowIndex, 13).setValue(new Date().toISOString());
          }
          if (sheet.getLastColumn() >= 14) {
            sheet.getRange(rowIndex, 14).setValue(usuario);
          }
          applied++;
          results.push({ rowIndex: rowIndex, nombre: change.nombre || "", status: "success" });
        } catch (rowErr) {
          results.push({ rowIndex: change.rowIndex, nombre: change.nombre || "", status: "error", message: String(rowErr) });
        }
      }

      logAudit(ss, "PREPARACION", `${detalle} | ${applied} de ${postData.changes.length} insumos descontados`, usuario);

      return createJsonResponse({
        status: applied > 0 ? "success" : "error",
        message: applied > 0
          ? `${applied} de ${postData.changes.length} insumos sincronizados`
          : "No se pudo sincronizar ningún insumo",
        applied: applied,
        results: results
      });
    }

    // =========================================================================
    // ACCIÓN: AGREGAR PRODUCTO (POST { action: "add", item })
    // =========================================================================
    if (action === "add" && postData && postData.item) {
      const item = postData.item;
      const usuario = postData.usuario || "Usuario Sahoco";

      sheet.appendRow([
        item.id || ("PRD-" + (sheet.getLastRow() + 1)),
        item.nombre || "Nuevo Insumo",
        item.categoria || "Insumos & Salado",
        item.suplidor || "Proveedor General",
        item.unidad || "Unidad",
        Number(item.stockActual) || 0,
        Number(item.stockMinimo) || 0,
        Number(item.stockMaximo) || 0,
        Number(item.cantidadSugerida) || 0,
        item.descripcion || "",
        item.fechaVencimiento || "",
        item.foto || "",
        new Date().toISOString(),
        usuario
      ]);

      logAudit(ss, "NUEVO_PRODUCTO", `Nuevo producto añadido: ${item.nombre}`, usuario);

      return createJsonResponse({
        status: "success",
        message: `Producto "${item.nombre}" agregado con éxito`,
        total: sheet.getLastRow() - 2
      });
    }

    // =========================================================================
    // ACCIÓN: ELIMINAR PRODUCTO (POST { action: "delete", rowIndex, id })
    // =========================================================================
    if (action === "delete" && postData) {
      const rowIndex = Number(postData.rowIndex);
      const id = String(postData.id || "");
      const nombre = postData.nombre || "Insumo";
      const usuario = postData.usuario || "Usuario Sahoco";

      let deleted = false;
      if (id) {
        const lastRow = sheet.getLastRow();
        const ids = sheet.getRange(3, 1, Math.max(1, lastRow - 2), 1).getValues();
        for (let r = 0; r < ids.length; r++) {
          if (String(ids[r][0]).trim() === id) {
            sheet.deleteRow(3 + r);
            deleted = true;
            break;
          }
        }
      }

      if (!deleted && rowIndex >= 3 && rowIndex <= sheet.getLastRow()) {
        sheet.deleteRow(rowIndex);
        deleted = true;
      }

      logAudit(ss, "ELIMINACION", `Insumo "${nombre}" eliminado por ${usuario}`, usuario);

      return createJsonResponse({
        status: "success",
        message: `Insumo "${nombre}" eliminado correctamente`,
        deleted: deleted
      });
    }

    // =========================================================================
    // ACCIÓN: OBTENER RECETAS (action === "get_recipes")
    // =========================================================================
    if (action === "get_recipes") {
      const sheetR = sahocoGetRecipesSheet_(ss);
      const lastRowR = sheetR.getLastRow();
      const recetas = [];

      if (lastRowR >= 2) {
        const rows = sheetR.getRange(2, 1, lastRowR - 1, 6).getValues();
        for (let i = 0; i < rows.length; i++) {
          const jsonCell = String(rows[i][3] || "").trim();
          if (jsonCell) {
            try {
              recetas.push(JSON.parse(jsonCell));
              continue;
            } catch (parseErr) {
              // JSON dañado: se reconstruye desde las columnas visibles
            }
          }
          const nombre = String(rows[i][1] || "").trim();
          if (nombre) {
            recetas.push({
              id: String(rows[i][0] || ""),
              nombre: nombre,
              categoria: String(rows[i][2] || "Otros"),
              ingredientes: []
            });
          }
        }
      }

      return createJsonResponse({
        status: "success",
        count: recetas.length,
        sheet: sheetR.getName(),
        data: recetas
      });
    }

    // =========================================================================
    // ACCIÓN: GUARDAR RECETA (POST { action: "save_recipe", recipe })
    // =========================================================================
    if (action === "save_recipe" && postData && postData.recipe) {
      const recipe = postData.recipe;
      const usuario = postData.usuario || "Usuario Sahoco";
      const sheetR = sahocoGetRecipesSheet_(ss);
      const id = String(recipe.id || "");

      const rowData = [
        id,
        recipe.nombre || "Receta",
        recipe.categoria || "Otros",
        JSON.stringify(recipe),
        recipe.creadoPor || usuario,
        new Date().toISOString()
      ];

      let updated = false;
      const lastRowR = sheetR.getLastRow();
      if (lastRowR >= 2 && id) {
        const ids = sheetR.getRange(2, 1, lastRowR - 1, 1).getValues();
        for (let r = 0; r < ids.length; r++) {
          if (String(ids[r][0]).trim() === id) {
            sheetR.getRange(2 + r, 1, 1, 6).setValues([rowData]);
            updated = true;
            break;
          }
        }
      }
      if (!updated) {
        sheetR.appendRow(rowData);
      }

      logAudit(ss, "RECETA", (updated ? "Receta actualizada: " : "Receta creada: ") + rowData[1], usuario);

      return createJsonResponse({
        status: "success",
        message: updated ? "Receta actualizada en Google Sheets" : "Receta creada en Google Sheets"
      });
    }

    // =========================================================================
    // ACCIÓN: ELIMINAR RECETA (POST { action: "delete_recipe", id })
    // =========================================================================
    if (action === "delete_recipe" && postData) {
      const id = String(postData.id || "");
      const nombre = postData.nombre || "Receta";
      const usuario = postData.usuario || "Usuario Sahoco";
      const sheetR = sahocoGetRecipesSheet_(ss);
      let deleted = false;

      const lastRowR = sheetR.getLastRow();
      if (lastRowR >= 2 && id) {
        const ids = sheetR.getRange(2, 1, lastRowR - 1, 1).getValues();
        for (let r = 0; r < ids.length; r++) {
          if (String(ids[r][0]).trim() === id) {
            sheetR.deleteRow(2 + r);
            deleted = true;
            break;
          }
        }
      }

      logAudit(ss, "RECETA_ELIMINADA", `Receta eliminada: ${nombre}`, usuario);

      return createJsonResponse({
        status: "success",
        message: `Receta "${nombre}" eliminada`,
        deleted: deleted
      });
    }

    return createJsonResponse({
      status: "error",
      message: "Acción no reconocida: " + action
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString(),
      stack: err.stack || ""
    });
  }
}

/**
 * Entrada estándar GET de Google Apps Script
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Entrada estándar POST de Google Apps Script
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Helper para registrar en auditoría
 */
function logAudit(ss, action, detail, usuario) {
  try {
    let sheetAud = ss.getSheetByName(SHEET_AUDITORIA);
    if (!sheetAud) {
      sheetAud = ss.insertSheet(SHEET_AUDITORIA);
      sheetAud.appendRow(["Fecha / Hora", "Acción", "Detalle", "Usuario"]);
    }
    sheetAud.appendRow([new Date(), action, detail, usuario]);
  } catch(e) {
    // Si falla la auditoría, no interrumpir la acción principal
  }
}

/**
 * Retorna salida JSON con cabeceras CORS correctas
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
