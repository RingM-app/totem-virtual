# Totem Virtual — RingM

Frontend web del sistema de monitoreo de porterías. Permite a guardias y administradores ver en tiempo real las cámaras de cada portería del condominio.

---

## Stack

| Componente | Tecnología |
|---|---|
| Framework | React 19 |
| Estilos | Tailwind CSS |
| Video | LiveKit Client SDK |
| Auth | JWT (decodificado en cliente) |
| Backend | Node.js + Express (`totem-backend` en EC2) |

---

## Roles

| Rol | Acceso |
|---|---|
| `guardia` | Monitor con sus cámaras asignadas |
| `admin` | Monitor con todas las cámaras + panel de gestión |

---

## Funcionalidades

- Login con usuario y contraseña
- Auto-conexión a todas las cámaras asignadas al entrar
- Grid adaptable (1, 2 o 3+ cámaras)
- Click en cámara → fullscreen (cerrar con Esc)
- Botón "Conectar todas / Desconectar todas"
- Panel admin con tabs: Usuarios, Cámaras, Asignaciones
- Admin puede alternar entre monitor y panel de gestión

---

## Correr en desarrollo

```bash
npm install
npm start
```

La app corre en `http://localhost:3000`. El backend está en `http://18.190.159.57:3000` (EC2 totem).

---

## Build producción

```bash
npm run build
```

Genera la carpeta `/build` lista para deploy.

---

## Variables de entorno

No requiere `.env` — la URL del backend está hardcodeada en `src/hooks/useLiveKit.js` y `src/components/`.
Cuando se tenga dominio propio, centralizar en `.env`:

```env
REACT_APP_BACKEND_URL=https://totem.ringm.cl
REACT_APP_LIVEKIT_URL=wss://totem.ringm.cl:7880
```

---

## Estructura

```
src/
├── App.jsx                  # Router principal, modal fullscreen
├── components/
│   ├── Login.jsx            # Pantalla de login
│   ├── CameraCard.jsx       # Card de cámara con player LiveKit
│   └── AdminPanel.jsx       # Panel admin (Usuarios / Cámaras / Asignaciones)
└── hooks/
    └── useLiveKit.js        # Conexión LiveKit por sala
```

---

## Documentación completa

Ver `docs/totem.md` en el repositorio principal para arquitectura, backend, configuración de Raspberry Pi y TODOs.
