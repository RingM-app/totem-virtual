import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';

const SFU_URL = `https://${process.env.API_IP}:3000`;

export function useMediasoup() {
  const [producerTransport, setProducerTransport] = useState(null);
  const [consumerTransport, setConsumerTransport] = useState(null);
  const [device, setDevice]                     = useState(null);
  const socketRef   = useRef(null);
  const remoteTrackRef = useRef(null);

  useEffect(() => {
    const socket = io(SFU_URL, {
      path: '/socket.io',
      transports: ['polling','websocket'], 
      secure: true,                        
      rejectUnauthorized: false    
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Señalización conectada a SFU');

      socket.emit('getRouterRtpCapabilities', async (rtpCapabilities) => {
        const d = new Device();
        await d.load({ routerRtpCapabilities: rtpCapabilities });
        setDevice(d);

        socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
          const sendTransport = d.createSendTransport(params);

          sendTransport.on('connect', ({ dtlsParameters }, callback) => {
            socket.emit('connectTransport', {
              transportId: sendTransport.id,
              dtlsParameters
            }, callback);
          });

          sendTransport.on('produce', ({ kind, rtpParameters }, callback) => {
            socket.emit('produce', {
              transportId: sendTransport.id,
              kind,
              rtpParameters
            }, ({ id }) => callback({ id }));
          });

          setProducerTransport(sendTransport);
        });

        socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
          const recvTransport = d.createRecvTransport(params);

          recvTransport.on('connect', ({ dtlsParameters }, callback) => {
            socket.emit('connectTransport', {
              transportId: recvTransport.id,
              dtlsParameters
            }, callback);
          });

          setConsumerTransport(recvTransport);
        });
      });
    });

    socket.on('newProducer', ({ producerId }) => {
      if (device && consumerTransport) {
        (async () => {
          const transport = consumerTransport;
          const params = await new Promise(resolve => {
            socket.emit('consume', {
              transportId: transport.id,
              producerId,
              rtpCapabilities: device.rtpCapabilities
            }, resolve);
          });
          const track = await transport.consume(params);
          remoteTrackRef.current = track;
        })();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [device, consumerTransport]);

  const produceCamera = async () => {
    if (!producerTransport) throw new Error('Transport no listo');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track = stream.getVideoTracks()[0];
    await producerTransport.produce({ track });
    return stream;
  };

  const ready = Boolean(producerTransport);

  return { produceCamera, remoteTrackRef, ready };
}
