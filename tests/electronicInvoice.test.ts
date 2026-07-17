import { describe, expect, it } from "vitest";
import { guessInvoiceFromEmail, parseElectronicInvoiceXml } from "../supabase/functions/_shared/electronicInvoice.ts";

const xml = `<?xml version="1.0"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"><cbc:ID>FEV1234</cbc:ID><cbc:UUID>CUFE123</cbc:UUID><cbc:IssueDate>2026-07-17</cbc:IssueDate><cbc:DueDate>2026-08-17</cbc:DueDate><cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode><cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>PROVEEDOR SAS</cbc:Name></cac:PartyName><cac:PartyTaxScheme><cbc:RegistrationName>PROVEEDOR SAS</cbc:RegistrationName><cbc:CompanyID>900123456</cbc:CompanyID></cac:PartyTaxScheme></cac:Party></cac:AccountingSupplierParty><cac:TaxTotal><cbc:TaxAmount>19000.00</cbc:TaxAmount></cac:TaxTotal><cac:LegalMonetaryTotal><cbc:LineExtensionAmount>100000.00</cbc:LineExtensionAmount><cbc:PayableAmount>119000.00</cbc:PayableAmount></cac:LegalMonetaryTotal></Invoice>`;

describe("Electronic invoice parser", () => {
  it("extracts Colombian UBL invoice fields", () => {
    expect(parseElectronicInvoiceXml(xml)).toMatchObject({ invoice_number: "FEV1234", cufe: "CUFE123", supplier_name: "PROVEEDOR SAS", supplier_tax_id: "900123456", invoice_date: "2026-07-17", subtotal_cop: 100000, tax_cop: 19000, total_cop: 119000, document_status: "pending" });
  });
  it("reads an invoice wrapped in AttachedDocument CDATA", () => {
    const wrapped = `<AttachedDocument><![CDATA[${xml}]]></AttachedDocument>`;
    expect(parseElectronicInvoiceXml(wrapped)).toMatchObject({ invoice_number: "FEV1234", total_cop: 119000 });
  });
  it("creates an incomplete PDF fallback", () => {
    expect(guessInvoiceFromEmail({ subject: "Factura electrónica FEV9988 por valor total $250.000", filename: "FEV9988.pdf", from: "Proveedor Uno <facturas@proveedor.com>", receivedAt: "2026-07-17T10:00:00Z" })).toMatchObject({ invoice_number: "FEV9988", total_cop: 250000, supplier_name: "Proveedor Uno", document_status: "incomplete" });
  });
});
