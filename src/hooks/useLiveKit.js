import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent } from "livekit-client";

const BACKEND_URL = "http://18.190.159.57:3000";
const LIVEKIT_URL = "ws://18.190.159.57:7880";
const ROOM_NAME = "sala_1";

export function useLiveKit(videoRef, jwt) {
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const roomRef = useRef(null);

  const connect = useCallback(async () => {
    if (roomRef.current) return;
    setStatus("connecting");

    try {
      // Obtener token LiveKit con el JWT ya disponible
      const tokenRes = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ room_name: ROOM_NAME }),
      });
      if (!tokenRes.ok) throw new Error("No se pudo obtener token LiveKit");
      const { token } = await tokenRes.json();

      // Conectar a la sala
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "video" && videoRef.current) {
          track.attach(videoRef.current);
          setStatus("connected");
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        roomRef.current = null;
      });

      await room.connect(LIVEKIT_URL, token);

      // Tracks ya publicados al conectar
      room.participants.forEach((participant) => {
        participant.tracks.forEach((pub) => {
          if (pub.track?.kind === "video" && videoRef.current) {
            pub.track.attach(videoRef.current);
            setStatus("connected");
          }
        });
      });

      if (status !== "connected") setStatus("connecting");
    } catch (err) {
      console.error("LiveKit error:", err);
      setStatus("error");
      roomRef.current = null;
    }
  }, [videoRef, jwt]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
  }, [videoRef]);

  return { status, connect, disconnect };
}
