import { useEffect, useState, useRef } from 'react';
import { Device }                   from 'mediasoup-client';
import ProtooClient                 from 'protoo-client';

const SFU_WSS = `https://${process.env.API_IP}:4443`;

export function useMediasoupProtoo(roomId = 'defaultRoom') {
  const [device, setDevice]               = useState(null);
  const [sendTransport, setSendTransport] = useState(null);
  const [recvTransport, setRecvTransport] = useState(null);
  const remoteTrackRef                    = useRef(null);
  const protooPeerRef                     = useRef(null);

  useEffect(() => {
    const peerId = `peer_${Math.random().toString(36).substr(2, 8)}`;
    const url    = `${SFU_WSS}/?roomId=${roomId}&peerId=${peerId}`;

    const transport = new ProtooClient.WebSocketTransport(url, {
      webSocketOptions: { rejectUnauthorized: false }
    });
    const peer = new ProtooClient.Peer(transport);
    protooPeerRef.current = peer;

    peer.on('open', async () => {
      console.log('Protoo conectado al SFU');

      await peer.request('join', {
        displayName: peerId.substr(5), 
        device: {
          name: 'react-client',
          flag: 'mediasoup-client'
        }
      });
      console.log('Peer se ha unido a la sala');

      const routerRtpCapabilities = await peer.request('getRouterRtpCapabilities');

      const d = new Device();
      await d.load({ routerRtpCapabilities });
      setDevice(d);

      // transport sub
      const sendParams = await peer.request('createWebRtcTransport', { consumer: false });
      const sendTr = d.createSendTransport(sendParams);

      sendTr.on('connect', ({ dtlsParameters }, callback, errback) => {
        peer.request('connectWebRtcTransport', {
          transportId: sendTr.id,
          dtlsParameters
        }).then(callback).catch(errback);
      });

      sendTr.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
        const { id } = await peer.request('produce', {
          transportId: sendTr.id,
          kind,
          rtpParameters
        });
        callback({ id });
      });

      setSendTransport(sendTr);

      //sub
      const recvParams = await peer.request('createWebRtcTransport', { consumer: true });
      const recvTr = d.createRecvTransport(recvParams);

      recvTr.on('connect', ({ dtlsParameters }, callback, errback) => {
        peer.request('connectWebRtcTransport', {
          transportId: recvTr.id,
          dtlsParameters
        }).then(callback).catch(errback);
      });

      setRecvTransport(recvTr);
    });

    //pub
    peer.on('newProducer', async ({ producerId }) => {
      if (device && recvTransport) {
        const { id, kind, rtpParameters } = await peer.request('consume', {
          transportId: recvTransport.id,
          producerId,
          rtpCapabilities: device.rtpCapabilities
        });
        const consumer = await recvTransport.consume({ id, kind, rtpParameters });
        remoteTrackRef.current = consumer.track;
      }
    });

    peer.on('failed',       err => console.error('Protoo error:', err));
    peer.on('disconnected', ()  => console.warn('Protoo disconnected'));

    return () => peer.close();
  }, [roomId]);

  const produceCamera = async () => {
    if (!sendTransport) throw new Error('Transport de envío no listo');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const track  = stream.getVideoTracks()[0];
    await sendTransport.produce({ track });
    return stream;
  };

  const ready = Boolean(sendTransport);

  return { produceCamera, remoteTrackRef, ready };
}
