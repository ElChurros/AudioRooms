import { useEffect, useRef } from "react"
import Peer from 'simple-peer'
import socket from "../../../socket"
import audioContext from "../../../audio-context"
import { useNavigate } from "react-router-dom"

const positionPanner = (panner, pos) => {
    if (panner.positionX) {
        panner.positionX.setValueAtTime(pos.x, audioContext.currentTime);
        panner.positionY.setValueAtTime(pos.y, audioContext.currentTime);
    } else {
        panner.setPosition(pos.x, pos.y, audioContext.currentTime);
    }
    if(panner.orientationX) {
        panner.orientationX.setValueAtTime(Math.cos(((pos.direction + 180) % 360) * Math.PI / 180), audioContext.currentTime)
        panner.orientationY.setValueAtTime(Math.sin(((pos.direction + 180) % 360) * Math.PI / 180), audioContext.currentTime)
    } else {
        panner.setOrientation(Math.cos(pos.direction * Math.PI / 180), Math.sin(pos.direction * Math.PI / 180), 1)
    }
}

const PeerConnection = ({ user, destinationRef }) => {
    const { id, initiator, pos } = user
    const pannerRef = useRef()
    const navigate = useNavigate

    useEffect(() => {
        const peer = new Peer({
            initiator: initiator,
            trickle: false,
        })

        peer.on('signal', initiator
            ? signal => socket.emit('call:offer', { userToSignal: id, callerId: socket.id, signal })
            : signal => socket.emit('call:accept', { signal, callerId: id })
        )

        peer.on('error', () => {})

        peer.on('connect', () => {})

        peer.on('stream', (stream) => {
            const source = audioContext.createMediaStreamSource(stream)
            pannerRef.current = audioContext.createPanner()
            pannerRef.current.panningModel = 'HRTF';
            pannerRef.current.distanceModel = 'exponential';
            pannerRef.current.refDistance = 5;
            pannerRef.current.maxDistance = 10000;
            pannerRef.current.rolloffFactor = 2;
            pannerRef.current.coneInnerAngle = 60;
            pannerRef.current.coneOuterAngle = 90;
            pannerRef.current.coneOuterGain = 0.9;
            positionPanner(pannerRef.current, pos)
            source.connect(pannerRef.current).connect(destinationRef.current)
            const audio = new Audio()
            audio.srcObject = stream
        })

        const callbacks = {
            'call:accept': payload => {
                if (payload.id !== id)
                    return
                peer.signal(payload.signal)
            },
            'call:offer': payload => {
                if (payload.user.id !== id)
                    return
                peer.signal(payload.signal)
            }
        }
        for (const [eventName, callback] of Object.entries(callbacks))
            socket.on(eventName, callback)

        navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
        }).then((stream) => {
            peer.addStream(stream)
        }).catch(() => { 
            navigate('/')
        })
        return () => {
            console.log("cleaning up")
            for (const [eventName, callback] of Object.entries(callbacks))
                socket.off(eventName, callback)
            peer.destroy()
        }
    }, []) //eslint-disable-line

    useEffect(() => {
        if (!pannerRef.current)
            return
        positionPanner(pannerRef.current, pos)
    }, [pos])

    return null
}

export default PeerConnection