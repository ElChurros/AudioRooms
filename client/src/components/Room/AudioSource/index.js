import { useCallback, useEffect, useRef, useState } from "react"
import audioContext from "../../../audio-context"
import PulsatingSource from "../../PulsatingSource"
import useEventListener from "../../../hooks/useEventListener"
import { clamp } from "../../../utils/maths"
import socket from "../../../socket"

const muteBeyondMaxDistance = (gainNode, gain, listenerPos, x, y, maxHearingDistance, smooth) => {
    if (!gainNode)
        return
    const distance = Math.sqrt(Math.pow(listenerPos.x - x, 2) + Math.pow(listenerPos.y - y, 2))
    const timing = audioContext.currentTime + (smooth ? 0.3 : 0)
    if (distance > maxHearingDistance)
        gainNode.gain.linearRampToValueAtTime(0, timing)
    else
        gainNode.gain.linearRampToValueAtTime(gain, timing)
}

const AudioSource = ({ filename, id, pos, sourceProps = {}, pannerProps = {}, destinationRef, maxHearingDistance = 20, gain = 0.5, listenerPos, highlighted, movable, mapRef, ...props }) => {
    const { x = 0, y = 0, z = 0, direction = 0 } = pos
    const {
        coneInnerAngle = 360,
        coneOuterAngle = 0,
        coneOuterGain = 0,
        distanceModel = 'exponential',
        maxDistance = 10000,
        orientationX = Math.cos(((direction + 180) % 360) * Math.PI / 180),
        orientationY = Math.sin(((direction + 180) % 360) * Math.PI / 180),
        orientationZ = 0,
        panningModel = 'HRTF',
        refDistance = 5,
        rolloffFactor = 2,
    } = pannerProps
    const {
        detune = 0,
        loop = true,
        loopStart = 0,
        loopEnd = 0,
        playbackRate = 1
    } = sourceProps
    const [isDragging, setIsDragging] = useState(false)
    const sourceRef = useRef()
    const pannerRef = useRef()
    const gainRef = useRef()
    const sourceElementRef = useRef()
    const dragOffsetRef = useRef()

    useEffect(() => {
        audioContext.resume()
        let playbackStarted = false
        let shouldStartPlayback = true
        sourceRef.current = audioContext.createBufferSource()
        fetch(`${process.env.REACT_APP_SERVER}/file/${filename}`).then(res => {
            return res.arrayBuffer()
        }).then(arrayBuffer => {
            return audioContext.decodeAudioData(arrayBuffer)
        }).then(audioBuffer => {
            sourceRef.current.detune.setValueAtTime(detune, audioContext.currentTime)
            sourceRef.current.buffer = audioBuffer
            sourceRef.current.loop = loop
            sourceRef.current.loopStart = loopStart
            sourceRef.current.loopEnd = loopEnd
            sourceRef.current.playbackRate.setValueAtTime(playbackRate, audioContext.currentTime)
            pannerRef.current = audioContext.createPanner()
            pannerRef.current.coneInnerAngle = coneInnerAngle
            pannerRef.current.coneOuterAngle = coneOuterAngle
            pannerRef.current.coneOuterGain = coneOuterGain
            pannerRef.current.distanceModel = distanceModel
            pannerRef.current.maxDistance = maxDistance
            pannerRef.current.panningModel = panningModel
            pannerRef.current.refDistance = refDistance
            pannerRef.current.rolloffFactor = rolloffFactor
            pannerRef.current.positionX.setValueAtTime(x, audioContext.currentTime)
            pannerRef.current.positionY.setValueAtTime(y, audioContext.currentTime)
            pannerRef.current.positionZ.setValueAtTime(z, audioContext.currentTime)
            pannerRef.current.orientationX.setValueAtTime(orientationX, audioContext.currentTime)
            pannerRef.current.orientationY.setValueAtTime(orientationY, audioContext.currentTime)
            pannerRef.current.orientationZ.setValueAtTime(orientationZ, audioContext.currentTime)
            gainRef.current = audioContext.createGain()
            gainRef.current.gain.setValueAtTime(gain, audioContext.currentTime)

            sourceRef.current.connect(pannerRef.current).connect(gainRef.current).connect(destinationRef.current)
            muteBeyondMaxDistance(gainRef.current, gain, listenerPos, x, y, maxHearingDistance, false)
            if (shouldStartPlayback) {
                sourceRef.current.start(audioContext.currentTime)
                playbackStarted = true
            }
        }).catch(err => {
            console.error(err)
        })

        return () => {
            if (playbackStarted) {
                sourceRef.current.stop()
                sourceRef.current.disconnect()
            } else {
                shouldStartPlayback = false
            }
        }
    }, [coneInnerAngle, coneOuterAngle, coneOuterGain, destinationRef, detune, distanceModel, filename, gain, loop, loopEnd, loopStart, maxDistance, orientationX, orientationY, orientationZ, panningModel, playbackRate, refDistance, rolloffFactor]) //eslint-disable-line

    useEffect(() => {
        if (pannerRef.current) {
            pannerRef.current.positionX.setValueAtTime(x, audioContext.currentTime)
            pannerRef.current.positionY.setValueAtTime(y, audioContext.currentTime)
            pannerRef.current.positionZ.setValueAtTime(z, audioContext.currentTime)
        }
    }, [x, y, z])

    useEffect(() => {
        muteBeyondMaxDistance(gainRef.current, gain, listenerPos, x, y, maxHearingDistance, true)
        if (!pannerRef.current)
            return
        pannerRef.current.positionX.setValueAtTime(x, audioContext.currentTime)
        pannerRef.current.positionY.setValueAtTime(y, audioContext.currentTime)
        pannerRef.current.positionZ.setValueAtTime(z, audioContext.currentTime)
        pannerRef.current.orientationX.setValueAtTime(orientationX, audioContext.currentTime)
        pannerRef.current.orientationY.setValueAtTime(orientationY, audioContext.currentTime)
        pannerRef.current.orientationZ.setValueAtTime(orientationZ, audioContext.currentTime)
    }, [orientationX, orientationY, orientationZ, x, y, z, listenerPos, gain, maxHearingDistance])

    const onPointerDown = (e) => {
        e.preventDefault()
        if (movable) {
            const sourceRect = sourceElementRef.current.getBoundingClientRect()
            const dragOffset = { x: sourceRect.x + sourceRect.width / 2 - e.clientX, y: sourceRect.y + sourceRect.height / 2 - e.clientY }
            dragOffsetRef.current = dragOffset
            setIsDragging(true)
        }
    }

    const onPointerMove = useCallback(e => {
        e.preventDefault()
        if (isDragging) {
            const { x, y, width, height } = mapRef.current.getBoundingClientRect()
            const newPos = { x: clamp((e.pageX - x - window.scrollX + dragOffsetRef.current.x) * 100 / width, 0, 100), y: clamp((y - e.pageY + height + window.scrollY - dragOffsetRef.current.y) * 100 / height, 0, 100) }
            socket.emit('source movement', { id: id, pos: newPos })
        }
    }, [id, isDragging, mapRef])

    const onPointerUp = useCallback(e => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    useEventListener('pointerup', onPointerUp)
    useEventListener('pointermove', onPointerMove)

    return <PulsatingSource x={x} y={y} size={2 * refDistance / rolloffFactor} color={highlighted ? 'red' : 'orange'} movable={movable} onPointerDown={onPointerDown} ref={sourceElementRef} />
}

export default AudioSource