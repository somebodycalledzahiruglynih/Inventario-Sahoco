// ====================================================================
// SAHOCO API BACKEND - CONTROLADOR PRINCIPAL Y RUTAS (`Código.gs`)
// ====================================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function getSpreadsheet() {
  try {
    var activeSS = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSS) return activeSS;
  } catch (err) {}

  var files = DriveApp.getFilesByName("INVENTARIO SAHOCO");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  throw new Error("No se encontró la hoja 'INVENTARIO SAHOCO' en Google Drive.");
}

function handleRequest(e) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("Inv.") || ss.getSheets()[0];
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "get";
  var output = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);

  // 1. OBTENER TODO EL INVENTARIO (GET)
  if (action === "get" || (e && !e.postData && action === "get")) {
    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return output.setContent(JSON.stringify({ status: "error", message: "Hoja vacía" }));
    }

    var data = [];
    for (var i = 2; i < rows.length; i++) {
      var row = rows[i];
      if (!row[1] || String(row[1]).trim() === "") continue;

      var item = {
        rowIndex: i + 1,
        no: row[0] || (i - 1),
        articulo: String(row[1]).trim(),
        suplidor: row[2] ? String(row[2]).trim() : "General",
        unidad: row[3] ? String(row[3]).trim() : "UND",
        min: parseFloat(row[4]) || 0,
        max: parseFloat(row[5]) || 0,
        actual: isNaN(parseFloat(row[6])) ? 0 : parseFloat(row[6]),
        restante: parseFloat(row[7]) || 0,
        sugerido: row[8] !== "" && row[8] !== undefined ? parseFloat(row[8]) : Math.max(0, ((parseFloat(row[5]) || 0) - (parseFloat(row[6]) || 0))),
        vencimiento: row[9] ? String(row[9]) : "N/A",
        descripcion: row[10] || "",
        imagen: row[11] || ""
      };

      data.push(item);
    }

    return output.setContent(JSON.stringify({
      status: "success",
      totalItems: data.length,
      data: data
    }));
  }

  // 2. ACTUALIZACIÓN DE PRODUCTO / FICHA EDITABLE / COMISO (UPDATE - BLOQUE A)
  if (action === "update" && e.postData) {
    try {
      var req = JSON.parse(e.postData.contents);
      var rIndex = parseInt(req.rowIndex);
      var nActual = parseFloat(req.actual);
      var usuario = req.usuario || "SAHOCO";
      var sugCustom = req.sugerido !== undefined ? parseFloat(req.sugerido) : null;
      var esPrioritario = req.esPrioritario === true || req.nivelPrioridad === "Alta";

      if (rIndex && !isNaN(nActual)) {
        var nArt = sheet.getRange(rIndex, 2).getValue();
        var sAnt = sheet.getRange(rIndex, 7).getValue();
        var minV = parseFloat(sheet.getRange(rIndex, 5).getValue()) || 0;

        sheet.getRange(rIndex, 7).setValue(nActual);
        if (sugCustom !== null && !isNaN(sugCustom)) {
          sheet.getRange(rIndex, 9).setValue(sugCustom);
        }

        // Campos de la ficha editable (solo se actualizan si se modificaron en el formulario)
        var camposFicha = [
          ["nombre", 2],
          ["suplidor", 3],
          ["unidad", 4],
          ["stockMinimo", 5],
          ["stockMaximo", 6],
          ["fechaVencimiento", 10],
          ["descripcion", 11],
          ["foto", 12]
        ];

        for (var f = 0; f < camposFicha.length; f++) {
          if (req[camposFicha[f][0]] !== undefined && req[camposFicha[f][0]] !== null) {
            sheet.getRange(rIndex, camposFicha[f][1]).setValue(req[camposFicha[f][0]]);
          }
        }

        if (req.comiso) {
          var c = req.comiso;
          enviarCorreoComiso(usuario, nArt, c.cantidad || 0, c.motivo || "Otro", c.fechaVencimiento || "", esPrioritario);
        } else {
          enviarCorreoAuditoria(usuario, nArt, sAnt, nActual, minV, sugCustom, esPrioritario);
        }

        return output.setContent(JSON.stringify({
          status: "success",
          message: "Stock actualizado",
          rowIndex: rIndex,
          nuevoStock: nActual
        }));
      }
    } catch (err) {
      return output.setContent(JSON.stringify({ status: "error", message: err.toString() }));
    }
  }

  // 3. AGREGAR NUEVO INSUMO (ADD - BLOQUE B)
  if (action === "add" && e.postData) {
    try {
      var reqAdd = JSON.parse(e.postData.contents);
      var it = reqAdd.item;
      if (it) {
        var filaNueva = sheet.getLastRow() + 1;
        var actualNuevo = Number(it.stockActual) || 0;
        var minNuevo = Number(it.stockMinimo) || 0;
        var maxNuevo = Number(it.stockMaximo) || 0;
        var sugNuevo = Number(it.cantidadSugerida) || 0;

        if (sugNuevo === 0 && maxNuevo > actualNuevo) {
          sugNuevo = Math.max(0, maxNuevo - actualNuevo);
        }

        sheet.getRange(filaNueva, 1, 1, 12).setValues([[
          filaNueva - 2,
          it.nombre || "Nuevo Insumo",
          it.suplidor || "General",
          it.unidad || "UND",
          minNuevo,
          maxNuevo,
          actualNuevo,
          "",
          sugNuevo,
          it.fechaVencimiento || "",
          it.descripcion || "",
          it.foto || ""
        ]]);

        return output.setContent(JSON.stringify({
          status: "success",
          message: 'Producto "' + (it.nombre || "Nuevo Insumo") + '" agregado con éxito'
        }));
      }
    } catch (errAdd) {
      return output.setContent(JSON.stringify({ status: "error", message: errAdd.toString() }));
    }
  }

  // 4. OBTENER RECETAS (GET RECIPES - BLOQUE B)
  if (action === "get_recipes") {
    try {
      var hojaR = sahocoRecetasSheet_(ss);
      var lastRowR = hojaR.getLastRow();
      var recetas = [];

      if (lastRowR >= 2) {
        var filasR = hojaR.getRange(2, 1, lastRowR - 1, 6).getValues();
        for (var r = 0; r < filasR.length; r++) {
          var celdaJson = String(filasR[r][3] || "").trim();
          if (celdaJson) {
            try {
              recetas.push(JSON.parse(celdaJson));
              continue;
            } catch (eJson) {}
          }
          var nombreR = String(filasR[r][1] || "").trim();
          if (nombreR) {
            recetas.push({
              id: String(filasR[r][0] || ""),
              nombre: nombreR,
              categoria: String(filasR[r][2] || "Otros"),
              ingredientes: []
            });
          }
        }
      }

      return output.setContent(JSON.stringify({ status: "success", count: recetas.length, data: recetas }));
    } catch (errR) {
      return output.setContent(JSON.stringify({ status: "error", message: errR.toString() }));
    }
  }

  // 5. GUARDAR / ACTUALIZAR RECETA (SAVE RECIPE - BLOQUE B)
  if (action === "save_recipe" && e.postData) {
    try {
      var reqRec = JSON.parse(e.postData.contents);
      var receta = reqRec.recipe;
      if (receta) {
        var hojaG = sahocoRecetasSheet_(ss);
        var idRec = String(receta.id || "");
        var filaRec = [
          idRec,
          receta.nombre || "Receta",
          receta.categoria || "Otros",
          JSON.stringify(receta),
          receta.creadoPor || reqRec.usuario || "SAHOCO",
          new Date().toISOString()
        ];
        var actualizada = false;
        var lastRowG = hojaG.getLastRow();

        if (lastRowG >= 2 && idRec) {
          var idsG = hojaG.getRange(2, 1, lastRowG - 1, 1).getValues();
          for (var g = 0; g < idsG.length; g++) {
            if (String(idsG[g][0]).trim() === idRec) {
              hojaG.getRange(2 + g, 1, 1, 6).setValues([filaRec]);
              actualizada = true;
              break;
            }
          }
        }

        if (!actualizada) {
          hojaG.appendRow(filaRec);
        }

        return output.setContent(JSON.stringify({
          status: "success",
          message: actualizada ? "Receta actualizada en Google Sheets" : "Receta creada en Google Sheets"
        }));
      }
    } catch (errRec) {
      return output.setContent(JSON.stringify({ status: "error", message: errRec.toString() }));
    }
  }

  // 6. ELIMINAR RECETA (DELETE RECIPE - BLOQUE B)
  if (action === "delete_recipe" && e.postData) {
    try {
      var reqDelRec = JSON.parse(e.postData.contents);
      var idDelRec = String(reqDelRec.id || "");
      var hojaD = sahocoRecetasSheet_(ss);
      var borrada = false;
      var lastRowD = hojaD.getLastRow();

      if (lastRowD >= 2 && idDelRec) {
        var idsD = hojaD.getRange(2, 1, lastRowD - 1, 1).getValues();
        for (var d = 0; d < idsD.length; d++) {
          if (String(idsD[d][0]).trim() === idDelRec) {
            hojaD.deleteRow(2 + d);
            borrada = true;
            break;
          }
        }
      }

      return output.setContent(JSON.stringify({
        status: "success",
        message: 'Receta "' + (reqDelRec.nombre || "Receta") + '" eliminada',
        deleted: borrada
      }));
    } catch (errDelRec) {
      return output.setContent(JSON.stringify({ status: "error", message: errDelRec.toString() }));
    }
  }

  // 7. ACTUALIZACIÓN POR LOTE DE JORNADA (BULK UPDATE)
  if (action === "bulk_update" && e.postData) {
    try {
      var lote = JSON.parse(e.postData.contents);
      var usLote = lote.usuario || "SAHOCO";
      var cambios = Array.isArray(lote.changes) ? lote.changes : [];
      var lastRowLote = sheet.getLastRow();
      var aplicados = [];

      for (var k = 0; k < cambios.length; k++) {
        var ch = cambios[k];
        var filaLote = parseInt(ch.rowIndex);
        var nuevoLote = parseFloat(ch.actual);

        if (filaLote < 3 || filaLote > lastRowLote || isNaN(nuevoLote)) continue;

        var antLote = sheet.getRange(filaLote, 7).getValue();
        sheet.getRange(filaLote, 7).setValue(nuevoLote);

        if (ch.sugerido !== undefined && !isNaN(parseFloat(ch.sugerido))) {
          sheet.getRange(filaLote, 9).setValue(parseFloat(ch.sugerido));
        }

        aplicados.push({
          nombre: ch.nombre || sheet.getRange(filaLote, 2).getValue() || "Insumo",
          anterior: antLote,
          nuevo: nuevoLote,
          esPrioritario: ch.esPrioritario === true || ch.nivelPrioridad === "Alta"
        });
      }

      if (lote.notificar === true && aplicados.length > 0 && typeof enviarCorreoLote === "function") {
        enviarCorreoLote(usLote, lote.detalle || "Lote de cambios de jornada", aplicados);
      }

      return output.setContent(JSON.stringify({
        status: aplicados.length > 0 ? "success" : "error",
        message: aplicados.length > 0
          ? aplicados.length + " de " + cambios.length + " insumos sincronizados en un solo lote"
          : "No se pudo sincronizar ningún insumo",
        applied: aplicados.length
      }));
    } catch (errLote) {
      return output.setContent(JSON.stringify({ status: "error", message: errLote.toString() }));
    }
  }

  // 8. ELIMINACIÓN DE INSUMO (DELETE)
  if (action === "delete" && e.postData) {
    try {
      var reqDel = JSON.parse(e.postData.contents);
      var rowDel = parseInt(reqDel.rowIndex);
      var usDel = reqDel.usuario || "SAHOCO";

      if (rowDel && rowDel > 2) {
        var nBorrado = sheet.getRange(rowDel, 2).getValue();
        sheet.deleteRow(rowDel);
        enviarCorreoEliminacion(usDel, nBorrado);

        return output.setContent(JSON.stringify({
          status: "success",
          message: "Producto eliminado correctamente"
        }));
      }
    } catch (err) {
      return output.setContent(JSON.stringify({ status: "error", message: err.toString() }));
    }
  }

  return output.setContent(JSON.stringify({ status: "error", message: "Acción no válida" }));
}

// ====================================================================
// FUNCIONES AUXILIARES FUERA DE HANDLE_REQUEST (BLOQUE C)
// ====================================================================

function sahocoRecetasSheet_(ss) {
  var hoja = ss.getSheetByName("Recetas");
  if (!hoja) {
    hoja = ss.insertSheet("Recetas");
    hoja.appendRow(["ID", "Nombre", "Categoria", "JSON", "CreadoPor", "FechaActualizacion"]);
  }
  return hoja;
}
