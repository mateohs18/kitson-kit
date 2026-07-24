// ============================================================================
// ADMINISTRADORES
//
// Soporta un admin único (ADMIN_EMAIL, como antes) o varios separados por
// coma (ADMIN_EMAILS=vos@x.com,socio@x.com) — así si perdés acceso a tu
// cuenta, no perdés el panel entero. Cualquiera de las dos variables sirve;
// si están las dos, se combinan.
// ============================================================================
export function listaAdmins(): string[] {
  const emails = [
    process.env.ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAILS || '').split(','),
  ]
    .map((e) => e?.trim().toLowerCase())
    .filter((e): e is string => Boolean(e));

  return Array.from(new Set(emails));
}

export function esEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  return listaAdmins().includes(email.trim().toLowerCase());
}
