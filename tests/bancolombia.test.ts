import { describe, expect, it } from "vitest";
import {
  extractBancolombiaMovement,
  extractTransactionDate,
  htmlToText,
  isBancolombiaSender,
  normalizeCopAmount,
  senderEmail
} from "../supabase/functions/_shared/bancolombia.ts";

describe("Bancolombia parser", () => {
  it("normaliza remitentes con nombre visible", () => {
    const header = "Bancolombia <alertasynotificaciones@an.notificacionesbancolombia.com>";
    expect(senderEmail(header)).toBe("alertasynotificaciones@an.notificacionesbancolombia.com");
    expect(isBancolombiaSender(header)).toBe(true);
  });

  it("normaliza valores COP", () => {
    expect(normalizeCopAmount("$ 1.250.000")).toBe(1250000);
    expect(normalizeCopAmount("COP $1.250.000,00")).toBe(1250000);
    expect(normalizeCopAmount("$1,250,000.00")).toBe(1250000);
  });

  it("extrae un ingreso", () => {
    expect(extractBancolombiaMovement({
      subject: "Recibiste un pago",
      text: "Recibiste un pago de JUAN PEREZ por $ 85.000 el 16 de julio de 2026. Referencia: AB123456",
      receivedAt: "2026-07-16T18:00:00Z"
    })).toMatchObject({
      movement_type: "income",
      transaction_date: "2026-07-16",
      detail: "JUAN PEREZ",
      amount_cop: 85000,
      reference_text: "AB123456"
    });
  });

  it("extrae una transferencia", () => {
    expect(extractBancolombiaMovement({
      text: "Transferiste $120.000 desde tu cuenta *1234 a MARIA LOPEZ el 15/07/2026.",
      receivedAt: "2026-07-16T02:00:00Z"
    })).toMatchObject({ movement_type: "transfer", transaction_date: "2026-07-15", detail: "MARIA LOPEZ", amount_cop: 120000 });
  });

  it("extrae una compra", () => {
    expect(extractBancolombiaMovement({
      text: "Compraste $45.900 en SUPERMERCADO CENTRAL con tu tarjeta *7788 el 2026-07-14.",
      receivedAt: "2026-07-15T02:00:00Z"
    })).toMatchObject({ movement_type: "card_purchase", transaction_date: "2026-07-14", detail: "SUPERMERCADO CENTRAL", amount_cop: 45900 });
  });

  it("usa la fecha recibida como respaldo", () => {
    expect(extractTransactionDate("Sin fecha explícita", "2026-07-16T02:00:00Z")).toBe("2026-07-15");
  });

  it("convierte HTML básico", () => {
    expect(htmlToText("<p>Recibiste&nbsp;un pago</p><div>por $10.000</div>")).toBe("Recibiste un pago por $10.000");
  });
});
