# Reglas de extracción heredadas

Estas reglas provienen del prototipo AppSheet + Google Sheets. Se conservarán como referencia para la Fase 3, pero se implementarán en Gmail API con identificación por `messageId` y trazabilidad en Supabase.

## Bancolombia

Remitente permitido:

```text
alertasynotificaciones@an.notificacionesbancolombia.com
```

### Ingreso recibido

- Activador: `recibiste un pago de`
- Detalle: `/recibiste un pago de (.*?) por \$/i`

### Transferencia enviada

- Activador: `transferiste`
- Detalle: `/desde tu cuenta \*\d+ a (.*?) el \d/i`

### Compra con tarjeta

- Activador: `Compraste`
- Detalle: `/Compraste\s+\$[\d.,]+\s+en\s+(.*?)\s+con\s+tu/i`

## Nequi

Remitentes permitidos:

```text
notificaciones@nequi.com.co
somos@nequi.com.co
```

### Dinero recibido

- Activador: `Recibiste`
- Regla: `/Recibiste ([\d.]+) de (.*?) el \d+/i`

### Envío a otro Nequi

- Activador: `Enviaste de manera exitosa`
- Regla: `/Enviaste de manera exitosa ([\d.]+) a la llave \d+ de (.*?) el/i`

### Pago de servicios

- Activadores: `Pagaste con Nequi` o `Listo tu pago`
- Detalle: `/Listo tu pago en (.*?) Pagaste/i`
- Valor principal: `/Valor:\s*\$\s*([\d.]+)/i`
- Valor alternativo: `/factura por\s*\$\s*([\d.]+)/i`

## Normalización

- Aplanar espacios con `.replace(/\s+/g, " ")`.
- Mantener cuerpo original y una copia en minúsculas.
- Convertir valores a pesos enteros.
- Usar la fecha del correo como respaldo.
- Guardar versión del extractor.

## Control de duplicados definitivo

La nueva aplicación no utilizará exclusivamente `fecha + tipo + detalle + valor`, porque dos movimientos legítimos podrían coincidir. El control principal será:

- `gmail_message_id`
- tipo de movimiento
- `attachment_id` para archivos
- CUFE o NIT + número para facturas
- huella secundaria para alertar posibles duplicados
