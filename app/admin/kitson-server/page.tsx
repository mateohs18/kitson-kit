"use client";

import { useEffect, useState, useCallback } from "react";

type EstadoServidor = {
  cpu_percent: number;
  ram_used_mb: number;
  ram_total_mb: number;
  storage_percent: number;
  uptime_seconds: number;
  updated_at: string;
};

type Comando = {
  id: string;
  command: string;
  status: "pending" | "done" | "failed";
  result: string | null;
  created_at: string;
};

export default function KitsonServerDashboard() {
  const [status, setStatus] = useState<EstadoServidor | null>(null);
  const [online, setOnline] = useState(false);
  const [comandos, setComandos] = useState<Comando[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviandoComando, setEnviandoComando] = useState<string | null>(null);

  const cargarEstado = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/kitson-server/status");
      const data = await res.json();
      setStatus(data.status);
      setOnline(data.online);
      setComandos(data.comandosRecientes || []);
    } catch (e) {
      console.error("Error cargando estado de Kitson Server:", e);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
    // Refresca solo cada 10s — el heartbeat del Tecno manda cada 30s,
    // no hace falta pedir más seguido que eso.
    const intervalo = setInterval(cargarEstado, 10_000);
    return () => clearInterval(intervalo);
  }, [cargarEstado]);

  async function mandarComando(command: string, payload: Record<string, unknown> = {}) {
    setEnviandoComando(command);
    try {
      const res = await fetch("/api/admin/kitson-server/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, payload }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
      // Esperamos un toque y recargamos para ver el resultado
      setTimeout(cargarEstado, 2000);
    } catch (e) {
      alert("Error de red mandando el comando.");
    } finally {
      setEnviandoComando(null);
    }
  }

  function formatUptime(segundos: number) {
    const dias = Math.floor(segundos / 86400);
    const horas = Math.floor((segundos % 86400) / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    return `${dias}d ${horas}h ${minutos}m`;
  }

  if (cargando) {
    return <div className="p-6 text-gray-400">Cargando estado de Kitson Server...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Kitson Server</h1>
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            online ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {online ? "🟢 Online" : "🔴 Offline"}
        </span>
      </div>

      {status ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">CPU</div>
            <div className="text-xl font-semibold">{status.cpu_percent}%</div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">RAM</div>
            <div className="text-xl font-semibold">
              {status.ram_used_mb} / {status.ram_total_mb} MB
            </div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">Storage</div>
            <div className="text-xl font-semibold">{status.storage_percent}%</div>
          </div>
          <div className="bg-neutral-800 rounded-lg p-4 col-span-3">
            <div className="text-sm text-gray-400">Uptime del teléfono</div>
            <div className="text-xl font-semibold">{formatUptime(status.uptime_seconds)}</div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">Sin datos todavía — ¿está corriendo el Tecno?</div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => mandarComando("restart_service", { service: "kitson-server" })}
          disabled={enviandoComando !== null}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-md text-sm font-medium"
        >
          {enviandoComando === "restart_service" ? "Reiniciando..." : "Reiniciar Servidor"}
        </button>
        <button
          onClick={() => mandarComando("restart_service", { service: "fortnite-bot" })}
          disabled={enviandoComando !== null}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-md text-sm font-medium"
        >
          Reiniciar Bot de Fortnite
        </button>
        <button
          onClick={() => mandarComando("fortnite_status")}
          disabled={enviandoComando !== null}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 rounded-md text-sm font-medium"
        >
          Ver estado del bot
        </button>
        <button
          onClick={() => mandarComando("ping")}
          disabled={enviandoComando !== null}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 rounded-md text-sm font-medium"
        >
          Ping
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Comandos recientes</h2>
        <div className="space-y-2">
          {comandos.map((c) => (
            <div key={c.id} className="bg-neutral-800 rounded-md p-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-mono">{c.command}</span>
                <span
                  className={
                    c.status === "done"
                      ? "text-green-400"
                      : c.status === "failed"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }
                >
                  {c.status}
                </span>
              </div>
              {c.result && (
                <div className="text-gray-400 mt-1 break-all">{c.result}</div>
              )}
            </div>
          ))}
          {comandos.length === 0 && (
            <div className="text-gray-500 text-sm">Sin comandos todavía.</div>
          )}
        </div>
      </div>
    </div>
  );
}
