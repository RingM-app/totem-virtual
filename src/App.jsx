import React, { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { CameraCard } from "./components/CameraCard";
import { AdminPanel } from "./components/AdminPanel";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

const BACKEND_URL = "http://18.190.159.57:3000";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#090836]" />
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full blur-3xl opacity-20"
        style={{ background: "#4E58FD" }}
      />
    </div>
  );
}

function FullscreenModal({ camera, jwt, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold text-lg">{camera.name}</h2>
            {camera.location && <p className="text-white/40 text-sm">{camera.location}</p>}
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-sm">
            ✕ Cerrar (Esc)
          </button>
        </div>
        <CameraCard camera={camera} jwt={jwt} autoConnect={true} />
      </div>
    </div>
  );
}

function Viewer({ jwt, onLogout, isAdmin = false, onSwitchToAdmin }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCamera, setExpandedCamera] = useState(null);
  const [connectAll, setConnectAll] = useState(true);

  useEffect(() => {
    async function fetchCameras() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/cameras`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error("Error al obtener cámaras");
        const data = await res.json();
        setCameras(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCameras();
  }, [jwt]);

  return (
    <div className="min-h-screen text-white">
      <Background />

      {/* Header */}
      <div className="py-6 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold opacity-90">RingM — Portero</h1>
        <div className="flex items-center gap-4">
          {cameras.length > 1 && (
            <button
              onClick={() => setConnectAll((v) => !v)}
              className="text-sm text-white/60 hover:text-white transition border border-white/20 px-3 py-1.5 rounded-lg"
            >
              {connectAll ? "Desconectar todas" : "Conectar todas"}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={onSwitchToAdmin}
              style={{ backgroundColor: "#505cfc" }}
              className="text-sm text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
            >
              Panel admin
            </button>
          )}
          <button
            onClick={onLogout}
            className="text-sm text-white/50 hover:text-white/80 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-6 pb-10 max-w-7xl mx-auto">
        {loading && (
          <p className="text-white/50 text-center mt-20">Cargando cámaras…</p>
        )}
        {!loading && error && (
          <p className="text-red-400 text-center mt-20">{error}</p>
        )}
        {!loading && !error && cameras.length === 0 && (
          <p className="text-white/50 text-center mt-20">
            No tienes cámaras asignadas.
          </p>
        )}
        {!loading && !error && cameras.length > 0 && (
          <div
            className={`grid gap-6 ${
              cameras.length === 1
                ? "grid-cols-1 max-w-2xl mx-auto"
                : cameras.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {cameras.map((camera) => (
              <CameraCard
                key={`${camera.id}-${connectAll}`}
                camera={camera}
                jwt={jwt}
                autoConnect={connectAll}
                onExpand={() => setExpandedCamera(camera)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal fullscreen */}
      {expandedCamera && (
        <FullscreenModal
          camera={expandedCamera}
          jwt={jwt}
          onClose={() => setExpandedCamera(null)}
        />
      )}
    </div>
  );
}

function App() {
  const [jwt, setJwt] = useState(null);

  if (!jwt) {
    return (
      <>
        <Background />
        <Login onLogin={setJwt} />
      </>
    );
  }

  const { role } = parseJwt(jwt);
  const [adminView, setAdminView] = useState("monitor"); // "monitor" | "admin"

  if (role === "admin") {
    return (
      <>
        <Background />
        {adminView === "admin" ? (
          <AdminPanel
            jwt={jwt}
            onLogout={() => setJwt(null)}
            onSwitchToMonitor={() => setAdminView("monitor")}
          />
        ) : (
          <Viewer
            jwt={jwt}
            onLogout={() => setJwt(null)}
            isAdmin
            onSwitchToAdmin={() => setAdminView("admin")}
          />
        )}
      </>
    );
  }

  return <Viewer jwt={jwt} onLogout={() => setJwt(null)} />;
}

export default App;
