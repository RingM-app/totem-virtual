import React, { useEffect, useState } from "react";
import { Login } from "./components/Login";
import { CameraCard } from "./components/CameraCard";

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

function Viewer({ jwt, onLogout }) {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <button
          onClick={onLogout}
          className="text-sm text-white/50 hover:text-white/80 transition"
        >
          Cerrar sesión
        </button>
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
              <CameraCard key={camera.id} camera={camera} jwt={jwt} />
            ))}
          </div>
        )}
      </div>
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

  return <Viewer jwt={jwt} onLogout={() => setJwt(null)} />;
}

export default App;
