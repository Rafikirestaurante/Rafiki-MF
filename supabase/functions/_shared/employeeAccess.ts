import type { SupabaseClient } from "npm:@supabase/supabase-js@2.106.2";

export const EMPLOYEE_ACCESS_KEY = "employees";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type EmployeeAccessSettings = {
  access_key: string;
  username: string;
  password_salt: string;
  password_hash: string;
  password_iterations: number;
  token_secret: string;
  enabled: boolean;
  session_duration_minutes: number;
  session_version: number;
};

export type EmployeeSession = {
  username: string;
  version: number;
  issued_at: number;
  expires_at: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlEncodeText(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlDecodeText(value: string): string {
  return decoder.decode(base64UrlToBytes(value));
}

export function randomSecret(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function normalizeAccessUsername(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

async function derivePassword(password: string, salt: string, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    hash: "SHA-256",
    salt: base64UrlToBytes(salt),
    iterations
  }, keyMaterial, 256);
  return bytesToBase64Url(new Uint8Array(bits));
}

export async function createPasswordRecord(password: string, iterations = 120000): Promise<{ salt: string; hash: string; iterations: number }> {
  const salt = randomSecret(18);
  return { salt, hash: await derivePassword(password, salt, iterations), iterations };
}

export async function verifyPassword(password: string, settings: EmployeeAccessSettings): Promise<boolean> {
  const derived = await derivePassword(password, settings.password_salt, settings.password_iterations);
  const expected = encoder.encode(settings.password_hash);
  const actual = encoder.encode(derived);
  if (expected.length !== actual.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ actual[index];
  return mismatch === 0;
}

async function hmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usages);
}

export async function signEmployeeSession(settings: EmployeeAccessSettings): Promise<{ token: string; expires_at: string }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: EmployeeSession = {
    username: settings.username,
    version: settings.session_version,
    issued_at: now,
    expires_at: now + settings.session_duration_minutes * 60
  };
  const encodedPayload = base64UrlEncodeText(JSON.stringify(payload));
  const key = await hmacKey(settings.token_secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  return {
    token: `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`,
    expires_at: new Date(payload.expires_at * 1000).toISOString()
  };
}

export async function loadEmployeeAccessSettings(client: SupabaseClient): Promise<EmployeeAccessSettings | null> {
  const { data, error } = await client.from("employee_public_access_settings").select("access_key,username,password_salt,password_hash,password_iterations,token_secret,enabled,session_duration_minutes,session_version").eq("access_key", EMPLOYEE_ACCESS_KEY).maybeSingle();
  if (error) throw new Error(`No se pudo consultar el acceso público: ${error.message}`);
  return data as EmployeeAccessSettings | null;
}

export async function requireEmployeeSession(request: Request, client: SupabaseClient): Promise<{ session: EmployeeSession; settings: EmployeeAccessSettings }> {
  const token = String(request.headers.get("x-employee-access-token") || "").trim();
  if (!token) throw new Error("La sesión de empleados no existe o venció.");
  const settings = await loadEmployeeAccessSettings(client);
  if (!settings?.enabled) throw new Error("El acceso para empleados está desactivado.");

  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) throw new Error("La sesión de empleados no es válida.");
  const key = await hmacKey(settings.token_secret, ["verify"]);
  const validSignature = await crypto.subtle.verify("HMAC", key, base64UrlToBytes(encodedSignature), encoder.encode(encodedPayload));
  if (!validSignature) throw new Error("La sesión de empleados no es válida.");

  let session: EmployeeSession;
  try {
    session = JSON.parse(base64UrlDecodeText(encodedPayload)) as EmployeeSession;
  } catch {
    throw new Error("La sesión de empleados no es válida.");
  }
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at <= now) throw new Error("La sesión de empleados venció. Ingresa nuevamente.");
  if (session.version !== settings.session_version || session.username !== settings.username) throw new Error("La configuración cambió. Ingresa nuevamente.");
  return { session, settings };
}

export async function clientKeyFromRequest(request: Request): Promise<string> {
  const raw = String(request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || request.headers.get("user-agent") || "unknown")
    .split(",")[0]
    .trim()
    .slice(0, 300);
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(raw));
  return bytesToBase64Url(new Uint8Array(digest));
}
