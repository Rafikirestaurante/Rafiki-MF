import { describe, expect, it } from "vitest";
import { buildMonthCalendar, monthRange, shiftMonth } from "../src/utils/calendar.js";

describe("Calendario del panel Inicio", () => {
  it("calcula el rango mensual sin depender del mes actual", () => {
    expect(monthRange("2026-07")).toEqual({ start: "2026-07-01", nextStart: "2026-08-01" });
  });

  it("cambia correctamente de diciembre a enero", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("genera seis semanas y conserva los días de julio de 2026", () => {
    const days = buildMonthCalendar("2026-07");
    expect(days).toHaveLength(42);
    expect(days.filter((day) => day.inMonth)).toHaveLength(31);
    expect(days.find((day) => day.dateKey === "2026-07-24")?.day).toBe(24);
  });
});
