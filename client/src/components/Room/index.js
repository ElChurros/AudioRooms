import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import socket from '../../socket'
import audioContext from '../../audio-context'
import RoomManager from './RoomManager'
import Player from './Player'
import PeerConnection from './PeerConnection'
import AudioSource from './AudioSource'
import useEventListener from '../../hooks/useEventListener'
import styles from './Room.module.css'
import PulsatingSource from '../PulsatingSource'

const POS_CHANGE_INTERVAL = 100
const DIRECTION_CHANGE_INTERVAL = 20

const Room = () => {
    const [users, setUsers] = useState([])
    const [sources, setSources] = useState([])
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 })
    const [addingSource, setAddingSource] = useState(false)
    const [highlightedSource, setHighlightedSource] = useState(null)
    const [gain, setGain] = useState(1)
    const [prevGain, setPrevGain] = useState(0)
    const [moveMode, setMoveMode] = useState(false)
    const listenerPos = useRef()
    const gainNodeRef = useRef()
    const handlersRef = useRef({})
    const mapRef = useRef()
    const { roomId } = useParams()
    const navigate = useNavigate()
    const me = useMemo(() => users.find(u => u.id === socket.id), [users])
    const others = useMemo(() => users.filter(u => u.id !== socket.id), [users])

    const sourcePosSetterFactory = (sourceId) => {
        return (pos) => {
            setSources(prev => prev.map(s => {
                if (s.id !== sourceId) {
                    return s
                } else {
                    return {...s, pos: pos}
                }
            }))
        }
    }

    useEffect(() => {
        gainNodeRef.current = audioContext.createGain()
        gainNodeRef.current.gain.value = 1
        gainNodeRef.current.connect(audioContext.destination)
        const callbacks = {
            'initial-users': (room) => {
                setSources(room.sources)
                setUsers(room.users.map(user => ({ ...user, initiator: true })))
            },
            'user-joined': (user) => {
                setUsers(prev => [...prev, { ...user, initiator: false }])
            },
            'user-left': (id) => {
                setUsers(prev => prev.filter(u => u.id !== id))
            },
            'user movement': (user) => {
                setUsers(prev => prev.map(u => {
                    if (u.id !== user.id)
                        return u
                    else
                        return user
                }))
            },
            'source-added': (source) => {
                setSources(prev => [...prev, source])
                setAddingSource(false)
            },
            'source-removed': (sourceId) => {
                setSources(prev => prev.filter(s => s.id !== sourceId))
            }
        }
        for (const [eventName, callback] of Object.entries(callbacks))
            socket.on(eventName, callback)
        socket.emit('join-room', roomId, res => {
            if (res.status !== 'ok') {
                navigate('/join')
            }
        })

        return () => {
            for (const intervalId of Object.values(handlersRef.current)) { // eslint-disable-line
                clearInterval(intervalId)
            }
            if (socket.connected) {
                socket.emit('leave-room')
                for (const [eventName, callback] of Object.entries(callbacks))
                    socket.off(eventName, callback)
            }
        }
    }, [roomId, navigate])

    const positionListener = useCallback((pos) => {
        if (audioContext.listener.positionX) {
            audioContext.listener.positionX.linearRampToValueAtTime(pos.x, audioContext.currentTime + POS_CHANGE_INTERVAL / 1000)
            audioContext.listener.positionY.linearRampToValueAtTime(pos.y, audioContext.currentTime + POS_CHANGE_INTERVAL / 1000)
            audioContext.listener.positionZ.linearRampToValueAtTime(0, audioContext.currentTime + POS_CHANGE_INTERVAL / 1000)
        } else {
            audioContext.listener.setPosition(pos.x, pos.y, 0)
        }
        if (audioContext.listener.forwardX) {
            audioContext.listener.forwardX.linearRampToValueAtTime(Math.cos(((pos.direction + 180) % 360) * Math.PI / 180), audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
            audioContext.listener.forwardY.linearRampToValueAtTime(Math.sin(((pos.direction + 180) % 360) * Math.PI / 180), audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
            audioContext.listener.forwardZ.linearRampToValueAtTime(-1, audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
            audioContext.listener.upX.linearRampToValueAtTime(0, audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
            audioContext.listener.upY.linearRampToValueAtTime(0, audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
            audioContext.listener.upZ.linearRampToValueAtTime(-1, audioContext.currentTime + DIRECTION_CHANGE_INTERVAL / 1000)
        } else {
            audioContext.listener.setOrientation(Math.cos(pos.direction * Math.PI / 180), Math.sin(pos.direction * Math.PI / 180), -1, 0, 0, -1)
        }

    }, [])

    useEffect(() => {
        const me = users.find(u => u.id === socket.id)
        if (!me)
            return
        if (me.pos !== listenerPos.current) {
            positionListener(me.pos)
            listenerPos.current = me.pos
        }
    }, [users, positionListener])

    const handleKeyPress = useCallback((e) => {
        if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key))
            return
        if (e.type === 'keydown' && !handlersRef.current[e.key]) {
            socket.emit('user movement', e.key)
            handlersRef.current[e.key] = setInterval(() => socket.emit('user movement', e.key), ['ArrowUp', 'ArrowDown'].includes(e.key) ? POS_CHANGE_INTERVAL : DIRECTION_CHANGE_INTERVAL)
        } else if (e.type === 'keyup' && handlersRef.current[e.key]) {
            clearInterval(handlersRef.current[e.key])
            delete handlersRef.current[e.key]
        }
    }, [])

    const onVolumeToggle = useCallback(() => {
        if (gain !== 0) {
            setGain(0)
        } else {
            setGain(prevGain)
        }
    }, [gain, prevGain])

    useEffect(() => {
        if (gain !== 0) {
            setPrevGain(gain)
        }
        gainNodeRef.current.gain.setValueAtTime(gain, audioContext.currentTime);
    }, [gain])

    useEventListener('keydown', handleKeyPress)
    useEventListener('keyup', handleKeyPress)

    return <div className={styles.container}>
        <div className={styles.room}>
            <div className={styles.volume}>
                <button onClick={() => setMoveMode(prev => !prev)}>
                    <span className={`material-symbols-outlined ${styles.moveMode} ${moveMode ? styles.moving : ""}`}>
                        open_with
                    </span>
                </button>
                <button className={`material-symbols-outlined`} onClick={onVolumeToggle}>
                    {gain > 0.66
                        ? 'volume_up'
                        : gain > 0.33
                            ? 'volume_down'
                            : gain > 0
                                ? 'volume_mute'
                                : 'no_sound'
                    }
                </button><input id='volume' type='range' min={0} max={1} value={gain} step={0.01} onChange={(e) => setGain(e.target.value)} />
            </div>
            <div className={styles.map} ref={mapRef}>
                <div className={styles.mask}>
                    {addingSource && <PulsatingSource {...previewPos} size={5} color='#FF7F0088' />}
                    {sources.map(source => {
                        const { id, file, pos, gain } = source
                        return <AudioSource key={id} filename={file} pos={pos} gain={gain} destinationRef={gainNodeRef} listenerPos={me.pos} highlighted={highlightedSource === source} movable={moveMode} setPos={sourcePosSetterFactory(id)} mapRef={mapRef}/>
                    })}
                </div>
                {others.map(user => {
                    return <Player key={user.id} pos={user.pos} isSelf={false}>
                        <PeerConnection user={user} destinationRef={gainNodeRef} />
                    </Player>
                })}
                {me ? <Player pos={me.pos} isSelf /> : ''}
            </div>
        </div>
        <RoomManager sources={sources} setPos={setPreviewPos} addingSource={addingSource} setAddingSource={setAddingSource} setHighlightedSource={setHighlightedSource} mapRef={mapRef} />
    </div>
}

export default Room