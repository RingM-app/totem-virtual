import React, { useEffect, useState } from "react";

const BACKEND_URL = "http://18.190.159.57:3000";

function authHeaders(jwt) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` };
}

// ─── USUARIOS ────────────────────────────────────────────────────────────────

function UsersTab({ jwt }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", role: "guardia" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/users`, { headers: authHeaders(jwt) });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Usuario creado correctamente");
      setForm({ username: "", password: "", role: "guardia" });
      fetchUsers();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Formulario crear */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Crear usuario</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Usuario</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="nombre de usuario"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Contraseña</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Rol</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            >
              <option value="guardia">Guardia</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: "#505cfc" }}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear"}
          </button>
        </form>
        {msg && <p className={`text-sm mt-3 ${msg.includes("correctamente") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin usuarios</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{u.id}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CÁMARAS ─────────────────────────────────────────────────────────────────

function CamerasTab({ jwt }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", room_id: "", location: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function fetchCameras() {
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/cameras/all`, { headers: authHeaders(jwt) });
    const data = await res.json();
    setCameras(data);
    setLoading(false);
  }

  useEffect(() => { fetchCameras(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/cameras`, {
        method: "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Cámara creada correctamente");
      setForm({ name: "", room_id: "", location: "" });
      fetchCameras();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Crear cámara</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: Portería Norte"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Room ID (LiveKit)</label>
            <input
              required
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              placeholder="Ej: sala_1"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Ubicación</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Opcional"
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: "#505cfc" }}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear"}
          </button>
        </form>
        {msg && <p className={`text-sm mt-3 ${msg.includes("correctamente") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Room ID</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
            ) : cameras.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin cámaras</td></tr>
            ) : cameras.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400">{c.id}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                <td className="px-4 py-3 font-mono text-slate-500 text-xs">{c.room_id}</td>
                <td className="px-4 py-3 text-slate-400">{c.location || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ASIGNACIONES ─────────────────────────────────────────────────────────────

function AssignmentsTab({ jwt }) {
  const [users, setUsers] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [form, setForm] = useState({ user_id: "", camera_id: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function fetchAll() {
      const [uRes, cRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/users`, { headers: authHeaders(jwt) }),
        fetch(`${BACKEND_URL}/api/cameras/all`, { headers: authHeaders(jwt) }),
      ]);
      const [uData, cData] = await Promise.all([uRes.json(), cRes.json()]);
      setUsers(uData);
      setCameras(cData);
    }
    fetchAll();
  }, [jwt]);

  async function fetchAssignments(userId) {
    setSelectedUser(userId);
    setAssignments([]);
    if (!userId) return;
    const res = await fetch(`${BACKEND_URL}/api/assignments/by-user/${userId}`, {
      headers: authHeaders(jwt),
    });
    const data = await res.json();
    setAssignments(data);
  }

  async function handleAssign(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/assignments`, {
        method: "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify({ user_id: Number(form.user_id), camera_id: Number(form.camera_id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg("Asignación guardada");
      if (selectedUser === form.user_id) fetchAssignments(selectedUser);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Asignar */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Asignar cámara a guardia</h3>
        <form onSubmit={handleAssign} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Usuario</label>
            <select
              required
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            >
              <option value="">Seleccionar…</option>
              {users.filter(u => u.role === "guardia").map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Cámara</label>
            <select
              required
              value={form.camera_id}
              onChange={(e) => setForm({ ...form, camera_id: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc]"
            >
              <option value="">Seleccionar…</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.room_id}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: "#505cfc" }}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Asignar"}
          </button>
        </form>
        {msg && <p className={`text-sm mt-3 ${msg.includes("guardada") ? "text-green-600" : "text-red-500"}`}>{msg}</p>}
      </div>

      {/* Ver asignaciones por usuario */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Ver asignaciones por guardia</h3>
        <select
          value={selectedUser}
          onChange={(e) => fetchAssignments(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] mb-4"
        >
          <option value="">Seleccionar guardia…</option>
          {users.filter(u => u.role === "guardia").map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>

        {selectedUser && (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Cámara</th>
                <th className="px-4 py-3 text-left">Room ID</th>
                <th className="px-4 py-3 text-left">Permisos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin asignaciones</td></tr>
              ) : assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{a.camera_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.camera_id}</td>
                  <td className="px-4 py-3 text-slate-400">{a.permissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── PANEL PRINCIPAL ──────────────────────────────────────────────────────────

const TABS = [
  { id: "users", label: "Usuarios" },
  { id: "cameras", label: "Cámaras" },
  { id: "assignments", label: "Asignaciones" },
];

export function AdminPanel({ jwt, onLogout }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="py-6 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold opacity-90">RingM — Admin</h1>
          <p className="text-white/40 text-sm mt-0.5">Panel de administración</p>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-white/50 hover:text-white/80 transition"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white text-[#505cfc] shadow"
                  : "text-white/60 hover:text-white/90"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && <UsersTab jwt={jwt} />}
        {activeTab === "cameras" && <CamerasTab jwt={jwt} />}
        {activeTab === "assignments" && <AssignmentsTab jwt={jwt} />}
      </div>
    </div>
  );
}
