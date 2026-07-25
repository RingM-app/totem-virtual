import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";

function authHeaders(jwt) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` };
}

// Envuelve fetch para que el panel se comporte como el monitor: un 401 cierra la
// sesión en vez de dejar la acción fallando en silencio. Devuelve el JSON parseado
// y lanza Error con el mensaje del backend si la respuesta no es ok.
async function apiFetch(url, options, onAuthError) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Sin conexión con el servidor");
  }

  if (res.status === 401) {
    onAuthError?.();
    throw new Error("Sesión expirada");
  }

  // Un DELETE puede responder 204 sin cuerpo, y un 500 puede devolver HTML.
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { /* respuesta no-JSON */ }
  }

  if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
  return data;
}

function DeleteButton({ onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <button onClick={onConfirm} className="text-xs text-red-600 font-medium hover:underline">Confirmar</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-slate-400 hover:underline">Cancelar</button>
      </span>
    );
  }
  return (
    <button onClick={() => setConfirming(true)} className="text-slate-300 hover:text-red-500 transition" title="Eliminar">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function EditButton({ onClick }) {
  return (
    <button onClick={onClick} className="text-slate-300 hover:text-[#505cfc] transition" title="Editar">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  );
}

// ─── USUARIOS ────────────────────────────────────────────────────────────────

function UsersTab({ jwt, onAuthError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ username: "", password: "", role: "guardia" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await apiFetch(`${BACKEND_URL}/api/users`, { headers: authHeaders(jwt) }, onAuthError);
      setUsers(Array.isArray(data) ? data : []);
      setLoadError("");
    } catch (err) {
      setUsers([]);
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  function startEdit(u) {
    setEditingId(u.id);
    setForm({ username: u.username, password: "", role: u.role });
    setMsg({ text: "", ok: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ username: "", password: "", role: "guardia" });
    setMsg({ text: "", ok: false });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg({ text: "", ok: false });
    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `${BACKEND_URL}/api/users/${editingId}` : `${BACKEND_URL}/api/users/create`;
      await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify(form),
      }, onAuthError);
      cancelEdit();
      setMsg({ text: isEdit ? "Usuario actualizado correctamente" : "Usuario creado correctamente", ok: true });
      fetchUsers();
    } catch (err) { setMsg({ text: err.message, ok: false }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`${BACKEND_URL}/api/users/${id}`, { method: "DELETE", headers: authHeaders(jwt) }, onAuthError);
      setMsg({ text: "Usuario eliminado correctamente", ok: true });
      fetchUsers();
    } catch (err) { setMsg({ text: err.message, ok: false }); }
  }

  const isEdit = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">{isEdit ? "Editar usuario" : "Crear usuario"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Usuario</label>
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="nombre de usuario" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">{isEdit ? "Contraseña (dejar vacío = sin cambio)" : "Contraseña"}</label>
            <input required={!isEdit} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Rol</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800">
              <option value="guardia">Guardia</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: "#505cfc" }} className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
          </button>
          {isEdit && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition">
              Cancelar
            </button>
          )}
        </form>
        {msg.text && <p className={`text-sm mt-3 ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Creado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-red-500">{loadError}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin usuarios</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50 ${editingId === u.id ? "bg-indigo-50" : ""}`}>
                <td className="px-4 py-3 text-slate-400">{u.id}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <EditButton onClick={() => startEdit(u)} />
                    <DeleteButton onConfirm={() => handleDelete(u.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CÁMARAS ─────────────────────────────────────────────────────────────────

function CamerasTab({ jwt, onAuthError }) {
  const [cameras, setCameras] = useState([]);
  const [onlineRooms, setOnlineRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ name: "", room_id: "", location: "" });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  async function fetchCameras() {
    try {
      const [cameraList, status] = await Promise.all([
        apiFetch(`${BACKEND_URL}/api/cameras/all`, { headers: authHeaders(jwt) }, onAuthError),
        apiFetch(`${BACKEND_URL}/api/livekit/status`, { headers: authHeaders(jwt) }, onAuthError),
      ]);
      setCameras(Array.isArray(cameraList) ? cameraList : []);
      setOnlineRooms(status?.online || []);
      setLoadError("");
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 15000);
    return () => clearInterval(interval);
  }, []);

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ name: c.name, room_id: c.room_id, location: c.location || "" });
    setMsg({ text: "", ok: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", room_id: "", location: "" });
    setMsg({ text: "", ok: false });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setMsg({ text: "", ok: false });
    try {
      const isEdit = editingId !== null;
      const url = isEdit ? `${BACKEND_URL}/api/cameras/${editingId}` : `${BACKEND_URL}/api/cameras`;
      await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify(form),
      }, onAuthError);
      cancelEdit();
      setMsg({ text: isEdit ? "Cámara actualizada correctamente" : "Cámara creada correctamente", ok: true });
      fetchCameras();
    } catch (err) { setMsg({ text: err.message, ok: false }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await apiFetch(`${BACKEND_URL}/api/cameras/${id}`, { method: "DELETE", headers: authHeaders(jwt) }, onAuthError);
      setMsg({ text: "Cámara eliminada correctamente", ok: true });
      fetchCameras();
    } catch (err) { setMsg({ text: err.message, ok: false }); }
  }

  const isEdit = editingId !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">{isEdit ? "Editar cámara" : "Crear cámara"}</h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Nombre</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Portería Norte" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Room ID (LiveKit)</label>
            <input required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} placeholder="Ej: cam-01" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Ubicación</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Opcional" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800" />
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: "#505cfc" }} className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50">
            {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
          </button>
          {isEdit && (
            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition">
              Cancelar
            </button>
          )}
        </form>
        {msg.text && <p className={`text-sm mt-3 ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loadError && !loading && (
          <p className="px-4 py-2 text-xs text-red-500 bg-red-50 border-b border-red-100">{loadError}</p>
        )}
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Room ID</th>
              <th className="px-4 py-3 text-left">Ubicación</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Cargando…</td></tr>
            ) : cameras.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Sin cámaras</td></tr>
            ) : cameras.map((c) => {
              const online = onlineRooms.includes(c.room_id);
              return (
                <tr key={c.id} className={`hover:bg-slate-50 ${editingId === c.id ? "bg-indigo-50" : ""}`}>
                  <td className="px-4 py-3 text-slate-400">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-xs">{c.room_id}</td>
                  <td className="px-4 py-3 text-slate-400">{c.location || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${online ? "text-green-600" : "text-slate-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-slate-300"}`} />
                      {online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton onClick={() => startEdit(c)} />
                      <DeleteButton onConfirm={() => handleDelete(c.id)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ASIGNACIONES ─────────────────────────────────────────────────────────────

function AssignmentsTab({ jwt, onAuthError }) {
  const [users, setUsers] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [form, setForm] = useState({ user_id: "", camera_id: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", ok: false });

  useEffect(() => {
    async function fetchAll() {
      try {
        const [userList, cameraList] = await Promise.all([
          apiFetch(`${BACKEND_URL}/api/users`, { headers: authHeaders(jwt) }, onAuthError),
          apiFetch(`${BACKEND_URL}/api/cameras/all`, { headers: authHeaders(jwt) }, onAuthError),
        ]);
        setUsers(Array.isArray(userList) ? userList : []);
        setCameras(Array.isArray(cameraList) ? cameraList : []);
      } catch (err) {
        setMsg({ text: err.message, ok: false });
      }
    }
    fetchAll();
  }, [jwt]);

  async function fetchAssignments(userId) {
    setSelectedUser(userId);
    setAssignments([]);
    if (!userId) return;
    try {
      const data = await apiFetch(`${BACKEND_URL}/api/assignments/by-user/${userId}`, { headers: authHeaders(jwt) }, onAuthError);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setSaving(true); setMsg({ text: "", ok: false });
    try {
      await apiFetch(`${BACKEND_URL}/api/assignments`, {
        method: "POST",
        headers: authHeaders(jwt),
        body: JSON.stringify({ user_id: Number(form.user_id), camera_id: Number(form.camera_id) }),
      }, onAuthError);
      setMsg({ text: "Asignación guardada", ok: true });
      if (selectedUser === form.user_id) fetchAssignments(selectedUser);
    } catch (err) { setMsg({ text: err.message, ok: false }); }
    finally { setSaving(false); }
  }

  async function handleDeleteAssignment(id) {
    try {
      await apiFetch(`${BACKEND_URL}/api/assignments/${id}`, { method: "DELETE", headers: authHeaders(jwt) }, onAuthError);
      setMsg({ text: "Asignación eliminada", ok: true });
      fetchAssignments(selectedUser);
    } catch (err) { setMsg({ text: err.message, ok: false }); }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Asignar cámara a guardia</h3>
        <form onSubmit={handleAssign} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Guardia</label>
            <select required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800">
              <option value="">Seleccionar…</option>
              {users.filter(u => u.role !== "admin").map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Cámara</label>
            <select required value={form.camera_id} onChange={(e) => setForm({ ...form, camera_id: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800">
              <option value="">Seleccionar…</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.room_id}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ backgroundColor: "#505cfc" }} className="px-5 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition disabled:opacity-50">
            {saving ? "Guardando…" : "Asignar"}
          </button>
        </form>
        {msg.text && <p className={`text-sm mt-3 ${msg.ok ? "text-green-600" : "text-red-500"}`}>{msg.text}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4">Ver asignaciones por guardia</h3>
        <select value={selectedUser} onChange={(e) => fetchAssignments(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#505cfc] text-slate-800 mb-4">
          <option value="">Seleccionar guardia…</option>
          {users.filter(u => u.role !== "admin").map((u) => (
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin asignaciones</td></tr>
              ) : assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{a.camera_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{a.room_id}</td>
                  <td className="px-4 py-3 text-slate-400">{a.permissions}</td>
                  <td className="px-4 py-3 text-right"><DeleteButton onConfirm={() => handleDeleteAssignment(a.id)} /></td>
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

export function AdminPanel({ jwt, onLogout, onSwitchToMonitor }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen text-white">
      <div className="py-6 px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold opacity-90">
            Portero Virtual <span className="text-sm font-normal opacity-50">by RingM</span>
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Panel de administración</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onSwitchToMonitor} className="text-sm text-white/60 hover:text-white transition border border-white/20 px-3 py-1.5 rounded-lg">
            Ver monitor
          </button>
          <button onClick={onLogout} className="text-sm text-white/50 hover:text-white/80 transition">
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="px-6 max-w-6xl mx-auto">
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.id ? "bg-white text-[#505cfc] shadow" : "text-white/60 hover:text-white/90"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "users"       && <UsersTab       jwt={jwt} onAuthError={onLogout} />}
        {activeTab === "cameras"     && <CamerasTab     jwt={jwt} onAuthError={onLogout} />}
        {activeTab === "assignments" && <AssignmentsTab jwt={jwt} onAuthError={onLogout} />}
      </div>
    </div>
  );
}
