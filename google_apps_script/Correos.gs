// ====================================================================
// SAHOCO API BACKEND - MÓDULO DE CORREOS HTML COMPLETO (`Correos.gs`)
// ====================================================================

// --- CONFIGURACIÓN DE ESTILOS Y PALETA DE COLORES ---
var SAHOCO_CORREO = {
  fondo: "#0f0f0f",
  tarjeta: "#1a1a1a",
  tarjetaAlt: "#1f1f1f",
  borde: "#2b2b2b",
  marca: "#f97316",
  marcaSuave: "#fb923c",
  critico: "#f87171",
  advertencia: "#fbbf24",
  exito: "#34d399",
  info: "#38bdf8",
  texto: "#f1f5f9",
  textoSecundario: "#cbd5e1",
  textoMuted: "#94a3b8",
  textoFaint: "#64748b"
};

var SAHOCO_CORREO_FUENTE = "'Inter','Outfit',-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
var SAHOCO_CORREO_FUENTE_DISPLAY = "'Outfit','Inter',-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

// --- DESTINATARIOS OFICIALES ---
function obtenerDestinatarios() {
  return ["soyzahirxd@gmail.com", "somebodycalledzahir@gmail.com"];
}

// --- FUNCIONES AUXILIARES DE RENDIMIENTO HTML ---
function sahocoCorreoEsc_(valor) {
  return String(valor === undefined || valor === null ? "" : valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sahocoCorreoHexARgba_(hex, alfa) {
  var limpio = String(hex).replace("#", "");
  var n = parseInt(limpio, 16);
  var r = (n >> 16) & 255;
  var g = (n >> 8) & 255;
  var b = n & 255;
  return "rgba(" + r + "," + g + "," + b + "," + alfa + ")";
}

function sahocoCorreoNum_(valor) {
  var n = Number(valor);
  if (isNaN(n)) return String(valor === undefined || valor === null ? "" : valor);
  return String(parseFloat(n.toFixed(2)));
}

function sahocoCorreoPildora_(texto, color) {
  return '<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:' + sahocoCorreoHexARgba_(color, 0.14) + ';border:1px solid ' + sahocoCorreoHexARgba_(color, 0.4) + ';font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:' + color + ';">' + sahocoCorreoEsc_(texto) + '</span>';
}

function sahocoCorreoFila_(etiqueta, valor, opciones) {
  var op = opciones || {};
  var color = op.color || SAHOCO_CORREO.texto;
  return '<tr>' +
    '<td class="sahoco-etiqueta" width="46%" style="padding:11px 0;border-bottom:1px solid ' + SAHOCO_CORREO.borde + ';font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:11px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:' + SAHOCO_CORREO.textoMuted + ';vertical-align:top;">' + sahocoCorreoEsc_(etiqueta) + '</td>' +
    '<td class="sahoco-valor" align="right" style="padding:11px 0;border-bottom:1px solid ' + SAHOCO_CORREO.borde + ';font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:14px;font-weight:700;color:' + color + ';">' + (op.html || sahocoCorreoEsc_(valor)) + '</td>' +
  '</tr>';
}

function sahocoCorreoHeroe_(monto, unidad, color, pieHtml) {
  return '<div style="margin-top:16px;padding:16px 20px;background:' + sahocoCorreoHexARgba_(color, 0.08) + ';border:1px solid ' + sahocoCorreoHexARgba_(color, 0.3) + ';border-radius:14px;">' +
    '<div style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:10px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:' + SAHOCO_CORREO.textoMuted + ';">Cantidad retirada</div>' +
    '<div class="sahoco-heroe-num" style="font-family:' + SAHOCO_CORREO_FUENTE_DISPLAY + ';font-size:36px;font-weight:900;line-height:1.15;color:' + color + ';padding-top:2px;">-' + sahocoCorreoEsc_(monto) + ' <span style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:14px;font-weight:800;color:' + SAHOCO_CORREO.textoMuted + ';">' + sahocoCorreoEsc_(unidad) + '</span></div>' +
    (pieHtml ? '<div style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:12px;color:' + SAHOCO_CORREO.textoSecundario + ';padding-top:4px;">' + pieHtml + '</div>' : '') +
  '</div>';
}

function sahocoCorreoNota_(titulo, texto, color) {
  return '<tr>' +
    '<td class="sahoco-pad" style="padding:8px 32px 0 32px;">' +
      '<div style="padding:13px 16px;background:' + SAHOCO_CORREO.tarjetaAlt + ';border:1px solid ' + SAHOCO_CORREO.borde + ';border-left:3px solid ' + (color || SAHOCO_CORREO.marca) + ';border-radius:12px;">' +
        '<div style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:10px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:' + SAHOCO_CORREO.textoMuted + ';padding-bottom:4px;">' + sahocoCorreoEsc_(titulo) + '</div>' +
        '<div style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:13px;line-height:1.6;color:' + SAHOCO_CORREO.textoSecundario + ';">' + sahocoCorreoEsc_(texto) + '</div>' +
      '</div>' +
    '</td>' +
  '</tr>';
}

function sahocoCorreoPlantilla_(opciones) {
  var op = opciones || {};
  var acento = op.acento || SAHOCO_CORREO.marca;
  var fecha = op.fecha || Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy hh:mm a");

  return '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'<meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width, initial-scale=1">' +
'<meta name="color-scheme" content="dark light">' +
'<title>' + sahocoCorreoEsc_(op.titulo || "SAHOCO") + '</title>' +
'<style>' +
  '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&family=Outfit:wght@700;800;900&display=swap");' +
  'body, table, td, a { font-family: ' + SAHOCO_CORREO_FUENTE + '; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }' +
  'table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }' +
  '@media only screen and (max-width: 480px) {' +
    '.sahoco-tarjeta { border-radius: 12px !important; }' +
    '.sahoco-pad { padding-left: 18px !important; padding-right: 18px !important; }' +
    '.sahoco-etiqueta { display: block !important; width: 100% !important; padding: 10px 0 0 0 !important; border-bottom: 0 !important; text-align: left !important; }' +
    '.sahoco-valor { display: block !important; width: 100% !important; padding: 2px 0 10px 0 !important; text-align: left !important; }' +
    '.sahoco-heroe-num { font-size: 30px !important; }' +
    '.sahoco-titulo { font-size: 19px !important; }' +
  '}' +
'</style>' +
'</head>' +
'<body style="margin:0;padding:0;background:' + SAHOCO_CORREO.fondo + ';font-family:' + SAHOCO_CORREO_FUENTE + ';">' +
'<div style="display:none;max-height:0;overflow:hidden;">' + sahocoCorreoEsc_(op.resumen || op.titulo || "Notificación de inventario SAHOCO") + '</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="' + SAHOCO_CORREO.fondo + '" style="background:' + SAHOCO_CORREO.fondo + ';">' +
  '<tr>' +
    '<td align="center" style="padding:28px 12px;">' +
      '<table role="presentation" class="sahoco-tarjeta" width="600" cellpadding="0" cellspacing="0" bgcolor="' + SAHOCO_CORREO.tarjeta + '" style="width:600px;max-width:100%;background:' + SAHOCO_CORREO.tarjeta + ';border:1px solid ' + SAHOCO_CORREO.borde + ';border-radius:16px;overflow:hidden;">' +
        '<tr><td style="height:6px;line-height:6px;font-size:0;background:' + acento + ';">&nbsp;</td></tr>' +
        '<tr>' +
          '<td class="sahoco-pad" style="padding:24px 32px 4px 32px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
              '<tr>' +
                '<td style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:12px;font-weight:800;letter-spacing:0.14em;color:' + SAHOCO_CORREO.textoMuted + ';">SAHOCO · INVENTARIO</td>' +
                '<td align="right">' + (op.pildora || "") + '</td>' +
              '</tr>' +
            '</table>' +
            '<div class="sahoco-titulo" style="font-family:' + SAHOCO_CORREO_FUENTE_DISPLAY + ';font-size:22px;font-weight:900;color:' + SAHOCO_CORREO.texto + ';padding-top:14px;">' + sahocoCorreoEsc_(op.titulo || "") + '</div>' +
            (op.subtitulo ? '<div style="font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:13px;color:' + SAHOCO_CORREO.textoMuted + ';padding-top:6px;">' + sahocoCorreoEsc_(op.subtitulo) + '</div>' : "") +
            (op.heroe || "") +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<td class="sahoco-pad" style="padding:12px 32px 6px 32px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + (op.filas || "") + '</table>' +
          '</td>' +
        '</tr>' +
        (op.nota || "") +
        '<tr>' +
          '<td class="sahoco-pad" style="padding:22px 32px 26px 32px;">' +
            '<div style="border-top:1px solid ' + SAHOCO_CORREO.borde + ';padding-top:14px;font-family:' + SAHOCO_CORREO_FUENTE + ';font-size:11px;line-height:1.7;color:' + SAHOCO_CORREO.textoFaint + ';">' +
              'Enviado automáticamente por <b style="color:' + SAHOCO_CORREO.textoMuted + ';">SAHOCO App</b> · ' + sahocoCorreoEsc_(fecha) + '<br>' +
              'Sistema de gestión y control operativo de cocina.' +
            '</div>' +
          '</td>' +
        '</tr>' +
      '</table>' +
    '</td>' +
  '</tr>' +
'</table>' +
'</body>' +
'</html>';
}

function sahocoCorreoEnviar_(asunto, html, texto) {
  var destinatarios = obtenerDestinatarios();
  if (!destinatarios || destinatarios.length === 0) return false;

  var lista = Array.isArray(destinatarios) ? destinatarios.join(",") : destinatarios;

  MailApp.sendEmail({
    to: lista,
    subject: asunto,
    body: texto,
    htmlBody: html,
    name: "SAHOCO Inventario"
  });
  return true;
}

// ====================================================================
// NOTIFICACIONES Y ALERTAS DEL SISTEMA
// ====================================================================

// 1. ALERTA INMEDIATA DE EMERGENCIA (Stock Bajo / Agotado / Prioritario)
function enviarCorreoAuditoria(usuario, articulo, anterior, nuevo, min, sugerido, esPrioritario) {
  var esCritico = nuevo <= min;
  var prioritario = esPrioritario === true;

  if (!esCritico && !prioritario) return;

  var fecha = Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy hh:mm a");
  var tipo = esCritico ? "Alerta Crítica de Cocina" : "Ajuste de Stock";

  var acento = prioritario ? SAHOCO_CORREO.critico : SAHOCO_CORREO.advertencia;
  var pildora = sahocoCorreoPildora_(esCritico ? "Agotado / Crítico" : "Stock Actualizado", acento);
  if (prioritario) {
    pildora += " " + sahocoCorreoPildora_("🔥 Prioridad Alta", SAHOCO_CORREO.critico);
  }

  var filas = [
    sahocoCorreoFila_("Producto", articulo),
    prioritario ? sahocoCorreoFila_("Prioridad", "🔥 Insumo clave de cocina", { color: SAHOCO_CORREO.critico }) : "",
    anterior !== null ? sahocoCorreoFila_("Stock Anterior", sahocoCorreoNum_(anterior), { color: SAHOCO_CORREO.textoSecundario }) : "",
    nuevo !== null ? sahocoCorreoFila_("Stock Nuevo", sahocoCorreoNum_(nuevo), { color: acento }) : "",
    sahocoCorreoFila_("Mínimo Requerido", sahocoCorreoNum_(min), { color: SAHOCO_CORREO.textoMuted }),
    (sugerido !== null && sugerido !== undefined && sugerido !== "")
      ? sahocoCorreoFila_("Cantidad Sugerida", sahocoCorreoNum_(sugerido), { color: SAHOCO_CORREO.marcaSuave }) : "",
    sahocoCorreoFila_("Realizado por", usuario)
  ].filter(function(f) { return f !== ""; }).join("");

  var html = sahocoCorreoPlantilla_({
    acento: acento,
    pildora: pildora,
    resumen: (prioritario ? "INSUMO CLAVE. " : "") + "Stock de " + articulo,
    titulo: prioritario ? tipo + " · INSUMO CLAVE" : tipo,
    subtitulo: articulo,
    filas: filas,
    nota: prioritario
      ? sahocoCorreoNota_("Máxima Prioridad", "Este insumo está marcado como indispensable en la cocina. Verificar y reponer a la brevedad.", SAHOCO_CORREO.critico)
      : sahocoCorreoNota_("Acción Requerida", "Gestionar reabastecimiento inmediato para evitar contratiempos.", SAHOCO_CORREO.advertencia),
    fecha: fecha
  });

  var texto = "🚨 SAHOCO INVENTARIO\n" +
              (prioritario ? "🚨 INSUMO CLAVE - MÁXIMA PRIORIDAD\n" : "") +
              "Producto: " + articulo + "\n" +
              "Stock Actual: " + nuevo + " (Mínimo: " + min + ")\n" +
              "Realizado por: " + usuario + "\n" +
              "Fecha: " + fecha;

  var prefijo = prioritario ? "🚨 [MÁXIMA PRIORIDAD - INSUMO CLAVE] " : "";
  var emoji = prioritario ? "🚨" : "⚠️";
  var asunto = prefijo + emoji + " SAHOCO | " + tipo + ": " + articulo;

  try {
    sahocoCorreoEnviar_(asunto, html, texto);
  } catch (e) {}
}

// 2. NOTIFICACIÓN DE COMISO / MERMA
function enviarCorreoComiso(usuario, articulo, cantidad, motivo, fechaVencimiento, esPrioritario) {
  var fecha = Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy hh:mm a");
  var prioritario = esPrioritario === true;

  var pildora = sahocoCorreoPildora_("Merma Registrada", SAHOCO_CORREO.critico);
  if (prioritario) {
    pildora += " " + sahocoCorreoPildora_("🔥 Prioridad Alta", SAHOCO_CORREO.critico);
  }

  var filas = [
    sahocoCorreoFila_("Producto Afectado", articulo),
    prioritario ? sahocoCorreoFila_("Prioridad", "🔥 Insumo clave de cocina", { color: SAHOCO_CORREO.critico }) : "",
    sahocoCorreoFila_("Motivo de la Merma", motivo, { color: SAHOCO_CORREO.advertencia }),
    fechaVencimiento ? sahocoCorreoFila_("Fecha de Vencimiento", fechaVencimiento) : "",
    sahocoCorreoFila_("Registrado por", usuario)
  ].filter(function(f) { return f !== ""; }).join("");

  var html = sahocoCorreoPlantilla_({
    acento: SAHOCO_CORREO.critico,
    pildora: pildora,
    resumen: (prioritario ? "INSUMO CLAVE. " : "") + "Merma registrada: " + cantidad + " de " + articulo,
    titulo: prioritario ? "Comiso / Merma registrado · INSUMO CLAVE" : "Comiso / Merma registrado",
    subtitulo: articulo,
    heroe: sahocoCorreoHeroe_(cantidad, "UND", SAHOCO_CORREO.critico, "Motivo: " + sahocoCorreoEsc_(motivo)),
    filas: filas,
    fecha: fecha
  });

  var texto = "⚠️ REGISTRO DE COMISO / MERMA - SAHOCO\n" +
              (prioritario ? "🚨 INSUMO CLAVE - MÁXIMA PRIORIDAD\n" : "") +
              "Producto: " + articulo + "\n" +
              "Cantidad retirada: " + cantidad + "\n" +
              "Motivo: " + motivo + "\n" +
              "Registrado por: " + usuario + "\n" +
              "Fecha: " + fecha;

  var prefijo = prioritario ? "🚨 [MÁXIMA PRIORIDAD - INSUMO CLAVE] " : "";
  var asunto = prefijo + "⚠️ SAHOCO | Merma registrada: " + articulo + " (-" + cantidad + ")";

  try {
    sahocoCorreoEnviar_(asunto, html, texto);
  } catch (e) {}
}

// 3. CORREO DE ELIMINACIÓN DE INSUMO
function enviarCorreoEliminacion(usuario, articulo) {
  var fecha = Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy hh:mm a");
  var asunto = "🗑️ [ELIMINACIÓN DE INSUMO] " + articulo + " - SAHOCO";

  var filas = [
    sahocoCorreoFila_("Producto Eliminado", articulo, { color: SAHOCO_CORREO.critico }),
    sahocoCorreoFila_("Acción", "Removido permanentemente de Google Sheets"),
    sahocoCorreoFila_("Borrado por", usuario)
  ].join("");

  var html = sahocoCorreoPlantilla_({
    acento: SAHOCO_CORREO.info,
    pildora: sahocoCorreoPildora_("Insumo Borrado", SAHOCO_CORREO.info),
    resumen: "Insumo eliminado: " + articulo,
    titulo: "Insumo Eliminado del Sistema",
    subtitulo: articulo,
    filas: filas,
    fecha: fecha
  });

  var texto = "🗑️ INSUMO ELIMINADO PERMANENTEMENTE\n" +
              "Producto: " + articulo + "\n" +
              "Borrado por: " + usuario + "\n" +
              "Fecha: " + fecha;

  try {
    sahocoCorreoEnviar_(asunto, html, texto);
  } catch (e) {}
}

// 4. RESUMEN DIARIO AUTOMÁTICO (11:30 PM)
function enviarResumenDiarioNocturno() {
  var fechaHoy = Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy");
  var asunto = "📊 [RESUMEN DIARIO DE INVENTARIO] - " + fechaHoy + " - SAHOCO";

  var filas = [
    sahocoCorreoFila_("Corte Operativo", fechaHoy),
    sahocoCorreoFila_("Estado Base de Datos", "Sincronizado en tiempo real"),
    sahocoCorreoFila_("Acceso a Google Sheets", "Disponible para auditoría nocturna")
  ].join("");

  var html = sahocoCorreoPlantilla_({
    acento: SAHOCO_CORREO.info,
    pildora: sahocoCorreoPildora_("Reporte Diario", SAHOCO_CORREO.info),
    resumen: "Corte diario de inventario SAHOCO",
    titulo: "Resumen General de Movimientos",
    subtitulo: "Corte diario de operaciones",
    filas: filas,
    nota: sahocoCorreoNota_("Corte de Jornada", "Aquí tienes el consolidado diario de movimientos y consumos del inventario operativo.", SAHOCO_CORREO.info),
    fecha: fechaHoy
  });

  var texto = "📊 RESUMEN DIARIO DE INVENTARIO - SAHOCO\n" +
              "Fecha: " + fechaHoy + "\n" +
              "Revisa la hoja de cálculo de Google Sheets para el desglose completo.";

  try {
    sahocoCorreoEnviar_(asunto, html, texto);
  } catch (e) {}
}

// 5. CORREO CONSOLIDADO DEL LOTE DE JORNADA (BATCHING DE STOCK)
function enviarCorreoLote(usuario, detalle, cambios) {
  var fecha = Utilities.formatDate(new Date(), "America/Santo_Domingo", "dd/MM/yyyy hh:mm a");
  var lista = Array.isArray(cambios) ? cambios : [];
  if (lista.length === 0) return;

  var prioritarios = lista.filter(function (c) { return c.esPrioritario === true; });
  var hayPrioridad = prioritarios.length > 0;

  var visibles = lista.slice(0, 40);
  var ocultos = lista.length - visibles.length;

  var filasCambios = visibles.map(function (c) {
    return sahocoCorreoFila_(
      (c.esPrioritario === true ? "🔥 " : "") + c.nombre,
      sahocoCorreoNum_(c.anterior) + " → " + sahocoCorreoNum_(c.nuevo),
      { color: c.esPrioritario === true ? SAHOCO_CORREO.critico : SAHOCO_CORREO.texto }
    );
  }).join("");

  if (ocultos > 0) {
    filasCambios += sahocoCorreoFila_("…y " + ocultos + " insumo(s) más", "Ver hoja de cálculo", { color: SAHOCO_CORREO.textoMuted });
  }

  var pildora = sahocoCorreoPildora_("Lote de jornada", SAHOCO_CORREO.marca);
  if (hayPrioridad) {
    pildora += " " + sahocoCorreoPildora_("🔥 Prioridad Alta", SAHOCO_CORREO.critico);
  }

  var acento = hayPrioridad ? SAHOCO_CORREO.critico : SAHOCO_CORREO.marca;
  var nota = hayPrioridad
    ? sahocoCorreoNota_("Máxima Prioridad", "Se ajustaron insumos clave: " + prioritarios.slice(0, 8).map(function (c) { return c.nombre; }).join(", ") + ". Verificar y reponer a la brevedad.", SAHOCO_CORREO.critico)
    : sahocoCorreoNota_("Acción Requerida", "Revisar el consolidado y gestionar el reabastecimiento de los insumos que quedaron bajos.", SAHOCO_CORREO.advertencia);

  var html = sahocoCorreoPlantilla_({
    acento: acento,
    pildora: pildora,
    resumen: (hayPrioridad ? "INSUMOS CLAVE. " : "") + lista.length + " insumos actualizados en el lote de jornada",
    titulo: hayPrioridad ? "Lote de jornada · INSUMOS CLAVE" : "Lote de jornada",
    subtitulo: detalle,
    filas: filasCambios,
    nota: nota,
    fecha: fecha
  });

  var texto = "📦 SAHOCO · LOTE DE JORNADA\n" +
              "------------------------------\n" +
              (hayPrioridad ? "🚨 INSUMOS CLAVE - MÁXIMA PRIORIDAD\n" : "") +
              "Detalle: " + detalle + "\n" +
              lista.map(function (c) {
                return "- " + (c.esPrioritario === true ? "🔥 " : "") + c.nombre + ": " + sahocoCorreoNum_(c.anterior) + " → " + sahocoCorreoNum_(c.nuevo);
              }).join("\n") + "\n" +
              "Sincronizado por: " + usuario + "\n" +
              "Fecha: " + fecha;

  var prefijo = hayPrioridad ? "🚨 [MÁXIMA PRIORIDAD - INSUMOS CLAVES] " : "";
  var asunto = prefijo + "📦 SAHOCO | Lote de jornada: " + lista.length + " insumos actualizados";

  try {
    sahocoCorreoEnviar_(asunto, html, texto);
  } catch (e) {}
}

// --- FUNCIÓN DE PRUEBA DESDE EL EDITOR DE APPS SCRIPT ---
function probarDisenoCorreo() {
  enviarCorreoAuditoria("Zahir", "Papas Fritas (Prueba PRIORIDAD)", 12, 3, 5, 20, true);
  enviarCorreoComiso("Zahir", "Leche Completa (Prueba Comiso)", 2, "Vencido", "2026-10-15", true);
  enviarCorreoLote("Zahir", "Lote de prueba de jornada", [
    { nombre: "Papas Fritas", anterior: 10, nuevo: 2, esPrioritario: true },
    { nombre: "Agua 500ml", anterior: 24, nuevo: 18, esPrioritario: false }
  ]);
}
