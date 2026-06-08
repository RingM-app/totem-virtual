import { useCallback, useRef, useState } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import { BACKEND_URL, LIVEKIT_URL } from "../config";

export function useLiveKit(videoRef, jwt, roomName, onAuthError) {
  // status = conexión AL ROOM: idle | connecting | connected | error
  const [status, setStatus] = useState("idle");
  const [hasVideo, setHasVideo] = useState(false);   // hay track de video de la cámara
  const [hasDevice, setHasDevice] = useState(false); // hay un participante del dispositivo (pi-*) en el room
  const [error, setError] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const roomRef = useRef(null);
  const audioElRef = useRef(null);

  const getOrCreateAudioEl = useCallback(() => {
    if (!audioElRef.current) {
      const el = document.createElement("audio");
      el.autoplay = true;
      document.body.appendChild(el);
      audioElRef.current = el;
    }
    return audioElRef.current;
  }, []);

  // ¿Hay una Pi conectada al room? (los dispositivos se identifican pi-*; el guardia con su username)
  const refreshDevice = useCallback(() => {
    const room = roomRef.current;
    if (!room) { setHasDevice(false); return; }
    const participants = room.remoteParticipants ?? room.participants;
    let device = false;
    participants?.forEach((p) => {
      if ((p.identity || "").startsWith("pi-")) device = true;
    });
    setHasDevice(device);
  }, []);

  const connect = useCallback(async () => {
    if (roomRef.current) return;
    setStatus("connecting");
    setError(null);

    try {
      const tokenRes = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ room_name: roomName }),
      });

      if (tokenRes.status === 401) {
        setStatus("idle");
        onAuthError?.();
        return;
      }
      if (!tokenRes.ok) throw new Error("No se pudo obtener token LiveKit");
      const { token } = await tokenRes.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          setHasVideo(true);
        }
        if (track.kind === Track.Kind.Audio) {
          track.attach(getOrCreateAudioEl());
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
        if (track.kind === Track.Kind.Video) setHasVideo(false);
      });

      room.on(RoomEvent.ParticipantConnected, refreshDevice);
      room.on(RoomEvent.ParticipantDisconnected, refreshDevice);

      room.on(RoomEvent.Disconnected, () => {
        setStatus("idle");
        setHasVideo(false);
        setHasDevice(false);
        setMicOn(false);
        setCamOn(false);
        roomRef.current = null;
      });

      await room.connect(LIVEKIT_URL, token);
      // Unido al room (aunque todavía no haya video)
      setStatus("connected");
      refreshDevice();

      const participants = room.remoteParticipants ?? room.participants;
      participants?.forEach((participant) => {
        const pubs = participant.trackPublications ?? participant.tracks;
        pubs?.forEach((pub) => {
          if (pub.track?.kind === Track.Kind.Video && videoRef.current) {
            pub.track.attach(videoRef.current);
            setHasVideo(true);
          }
          if (pub.track?.kind === Track.Kind.Audio) {
            pub.track.attach(getOrCreateAudioEl());
          }
        });
      });
    } catch (err) {
      console.error("LiveKit error:", err);
      setError(err.message || "Error de conexión");
      setStatus("error");
      roomRef.current = null;
    }
  }, [videoRef, jwt, roomName, getOrCreateAudioEl, onAuthError, refreshDevice]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.localParticipant?.setMicrophoneEnabled(false).catch(() => {});
      roomRef.current.localParticipant?.setCameraEnabled(false).catch(() => {});
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioElRef.current) {
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    setStatus("idle");
    setHasVideo(false);
    setHasDevice(false);
    setError(null);
    setMicOn(false);
    setCamOn(false);
  }, [videoRef]);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!micOn);
      setMicOn((v) => !v);
    } catch (err) {
      console.error("Mic error:", err);
    }
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    if (!roomRef.current) return;
    try {
      // 10fps a propósito: la Pi 4 decodifica el video del guardia por software
      // y a 30fps satura (no puede publicar su propia cámara → se cae el feed web).
      // 10fps mantiene 720p y descarga el decode. Resolución intacta.
      await roomRef.current.localParticipant.setCameraEnabled(!camOn, {
        resolution: { width: 1280, height: 720, frameRate: 10 },
      });
      setCamOn((v) => !v);
    } catch (err) {
      console.error("Cam error:", err);
    }
  }, [camOn]);

  return { status, hasVideo, hasDevice, error, micOn, camOn, connect, disconnect, toggleMic, toggleCam };
}
