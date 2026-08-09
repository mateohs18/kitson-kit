import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // AJUSTAR si tu ruta es distinta

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function esAdmin(session: any) {
  const email = session?.user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.includes(email);
}

// Comandos que este endpoint tiene permitido mandar. Es una whitelist
// doble: el Tecno también valida esto de su lado (ver
// SERVICIOS_PERMITIDOS en kitson-server/core/commands.js) — defensa en
// profundidad, no confiamos en un solo lado.
const COMANDOS_PERMITIDOS = [
  "ping",
  "restart_service",
  "fortnite_status",
  "fortnite_enviar_regalo",
  "fortnite_agregar_amigo",
];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!esAdmin(session)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { command, payload } = body;

  if (!COMANDOS_PERMITIDOS.includes(command)) {
    return NextResponse.json(
      { error: `Comando no permitido: '${command}'` },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("kitson_server_commands")
    .insert({ command, payload: payload || {}, status: "pending" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, comando: data });
}
