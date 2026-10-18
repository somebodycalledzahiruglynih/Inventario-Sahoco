/**
 * ==============================================================================
 * SAHOCO INVENTARIO & GESTIÓN MÓVIL - GOOGLE APPS SCRIPT
 * Archivo: Código.gs / Code.gs
 * ==============================================================================
 * CARGA COMPLETA DE LOS 131 PRODUCTOS DE LA HOJA "Inv."
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

      // 1. Detección dinámica de encabezados en Fila 2 (y Fila 1 como respaldo)
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
    // =========================================================================
    if (action === "update" && postData) {
      const rowIndex = Number(postData.rowIndex);
      const newActual = Number(postData.actual);
      const newSugerido = postData.sugerido !== undefined ? Number(postData.sugerido) : null;
      const usuario = postData.usuario || "Usuario Sahoco";
      const nombre = postData.nombre || "Insumo";

      if (rowIndex >= 3 && rowIndex <= sheet.getLastRow()) {
        // Actualiza Stock Actual (Columna 6 por defecto o columna detectada)
        sheet.getRange(rowIndex, 6).setValue(newActual);

        if (newSugerido !== null && !isNaN(newSugerido)) {
          sheet.getRange(rowIndex, 9).setValue(newSugerido);
        }

        // Columna 13 y 14: Fecha y Usuario
        if (sheet.getLastColumn() >= 13) {
          sheet.getRange(rowIndex, 13).setValue(new Date().toISOString());
        }
        if (sheet.getLastColumn() >= 14) {
          sheet.getRange(rowIndex, 14).setValue(usuario);
        }
      }

      logAudit(ss, "ACTUALIZACIÓN", `Stock de "${nombre}" ajustado a ${newActual} por ${usuario}`, usuario);

      return createJsonResponse({
        status: "success",
        message: `Stock de "${nombre}" actualizado a ${newActual}`,
        rowIndex: rowIndex,
        actual: newActual
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
