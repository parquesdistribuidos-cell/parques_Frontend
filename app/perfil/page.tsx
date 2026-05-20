"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "../../lib/api-client";
import { useGameStore } from "../../store/gameStore";

export default function PerfilPage() {
  const router = useRouter();
  const { token, usuarioId, username } = useGameStore();
  const [perfil, setPerfil] = useState<{ email: string; fecha_registro: string } | null>(null);
  const [partidas, setPartidas] = useState<unknown[]>([]);
  const [ranking, setRanking] = useState<unknown[]>([]);
  const [prob, setProb] = useState<{ partidas: number; victorias: number; probabilidad_pct: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    Promise.all([
      apiClient.me(),
      apiClient.misPartidas(),
      apiClient.ranking(),
      usuarioId ? apiClient.probabilidad(usuarioId) : Promise.resolve(null),
    ]).then(([me, mis, rank, p]) => {
      setPerfil(me);
      setPartidas((mis as { partidas: unknown[] }).partidas || []);
      setRanking((rank as { ranking: unknown[] }).ranking || []);
      if (p) setProb(p as { partidas: number; victorias: number; probabilidad_pct: number });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white animate-pulse">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">📊 Perfil</h1>
        <Link href="/lobby" className="px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-xl transition-colors text-sm">
          ← Lobby
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info del usuario */}
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">👤 Información</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Usuario</span>
              <span className="text-white font-medium">{username}</span>
            </div>
            {perfil && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email</span>
                  <span className="text-white">{perfil.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Miembro desde</span>
                  <span className="text-white">{new Date(perfil.fecha_registro).toLocaleDateString("es-CO")}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {prob && (
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-white mb-4">🏆 Mis estadísticas</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Partidas jugadas</span>
                <span className="text-white font-bold text-xl">{prob.partidas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Victorias</span>
                <span className="text-green-400 font-bold text-xl">{prob.victorias}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Probabilidad de ganar</span>
                <span className="text-yellow-400 font-bold text-xl">{prob.probabilidad_pct}%</span>
              </div>
              <div className="mt-4">
                <div className="bg-gray-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-yellow-400 h-3 rounded-full transition-all"
                    style={{ width: `${prob.probabilidad_pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking global */}
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">🥇 Ranking global</h2>
          {(ranking as Array<{ username: string; partidas: number }>).length === 0 ? (
            <p className="text-gray-500 text-sm">No hay datos aún</p>
          ) : (
            <div className="space-y-2">
              {(ranking as Array<{ username: string; partidas: number }>).slice(0, 8).map((r, i) => (
                <div key={r.username} className={`flex items-center gap-3 p-2 rounded-xl ${
                  r.username === username ? "bg-purple-600/20 border border-purple-500/30" : ""
                }`}>
                  <span className="text-lg w-8 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}.`}
                  </span>
                  <span className="text-white flex-1">{r.username}</span>
                  <span className="text-gray-400 text-sm">{r.partidas} partidas</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">📜 Últimas partidas</h2>
          {(partidas as Array<{ id: number; fecha: string; gane: boolean; color: string; estado: string }>).length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no has jugado ninguna partida</p>
          ) : (
            <div className="space-y-2">
              {(partidas as Array<{ id: number; fecha: string; gane: boolean; color: string; estado: string }>).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                  <span className={`text-lg ${p.gane ? "text-yellow-400" : "text-gray-500"}`}>
                    {p.gane ? "🏆" : "😔"}
                  </span>
                  <div className="flex-1">
                    <div className="text-white text-sm">{p.gane ? "Victoria" : "Derrota"}</div>
                    <div className="text-gray-500 text-xs">{new Date(p.fecha).toLocaleDateString("es-CO")}</div>
                  </div>
                  <div className="text-gray-400 text-sm capitalize">{p.color}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
