import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // AJUSTAR si tu ruta es distinta

// service_role key: SOLO se usa acá, del lado del servidor. Nunca en
// código de cliente/navegador.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lista de emails admin, separados por coma, en una env var.
// Ej: ADMIN_EMAILS=vos@gmail.com,otroadmin@gmail.com
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function esAdmin(session: any) {
  const email = session?.user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.includes(email);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!esAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: status, error: errorStatus } = await supabaseAdmin
    .from("kitson_server_status")
    .select("*")
    .eq("id", "tecno-spark-30c")
    .maybeSingle();

  const { data: comandos, error: errorComandos } = await supabaseAdmin
    .from("kitson_server_commands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (errorStatus || errorComandos) {
    const mensaje = errorStatus?.message || errorComandos?.message || "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }

  // Consideramos "online" si mandó un heartbeat en los últimos 90s
  // (3 veces el intervalo esperado de 30s, con margen).
  const online =
    status && Date.now() - new Date(status.updated_at).getTime() < 90_000;

  return NextResponse.json({ status, online, comandosRecientes: comandos });
}
