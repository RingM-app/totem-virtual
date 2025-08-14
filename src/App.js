import React, { useRef, useState, useEffect } from 'react';
import { useMediasoupProtoo } from './hooks/useMediasoupProtoo';

function App() {
  const localVideo  = useRef(null);
  const remoteVideo = useRef(null);
  const { produceCamera, remoteTrackRef, ready } = useMediasoupProtoo('miSala');
  const [inCall, setInCall] = useState(false);

  const joinCall = async () => {
    const stream = await produceCamera();
    if (localVideo.current) localVideo.current.srcObject = stream;
    setInCall(true);
  };

  useEffect(() => {
    const track = remoteTrackRef.current;
    if (track && remoteVideo.current) {
      const mediaStream = new MediaStream([track]);
      remoteVideo.current.srcObject = mediaStream;
    }
  }, [remoteTrackRef.current]);

  return (
    <div style={{ display: 'flex', gap: 20, padding: 20 }}>
      <div>
        <h3>Portero</h3>
        <video ref={localVideo} autoPlay muted style={{ width: 300, border: '1px solid #333' }} />
      </div>
      <div>
        <h3>Entrada 1</h3>
        <video ref={remoteVideo} autoPlay style={{ width: 300, border: '1px solid #333' }} />
      </div>
      <button
        onClick={joinCall}
        disabled={!ready || inCall}
        style={{ marginTop: 20, padding: '10px 20px', opacity: (!ready || inCall) ? 0.5 : 1 }}
      >
        {!ready ? 'Conectando…' : inCall ? 'En llamada' : 'Unirse a la sala'}
      </button>
    </div>
  );
}

export default App;
