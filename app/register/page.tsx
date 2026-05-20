"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "../../lib/api-client";
import { useGameStore } from "../../store/gameStore";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useGameStore((s) => s.setAuth);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await apiClient.register(form);
      const data = await apiClient.login({ username: form.username, password: form.password });
      setAuth(data.access_token, data.usuario_id, data.username);
      router.push("/lobby");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Parqués</h1>
          <p className="text-gray-400">Crea tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur rounded-2xl p-8 shadow-2xl border border-white/20 space-y-5">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-gray-300 text-sm mb-2">Usuario</label>
            <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              placeholder="tu_usuario" required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              placeholder="tu@email.com" required />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">Contraseña</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
              placeholder="••••••" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
          <p className="text-center text-gray-400 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
