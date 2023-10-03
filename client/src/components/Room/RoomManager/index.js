import { useCallback, useEffect, useState } from 'react'
import { clamp } from '../../../utils/maths'
import socket from '../../../socket'
import styles from './RoomManager.module.css'

const RoomManager = ({ setHighlightedSource, sources, setPos, setAddingSource, mapRef }) => {
    const [availableFiles, setAvailableFiles] = useState([])
    const [selectedFile, setSelectedFile] = useState('')
    const [placingSource, setPlacingSource] = useState(false)
    const [collapsed, setCollapsed] = useState(true)
    const [linkCopied, setLinkCopied] = useState(false)

    useEffect(() => {
        fetch(`${process.env.REACT_APP_HOST}/available-audio-files`)
            .then(res => res.json())
            .then(files => {
                setAvailableFiles(files)
            })
    }, [])

    const onFileSelect = useCallback((e) => {
        setSelectedFile(e.target.value)
        setPlacingSource(true)
        setAddingSource(true)
        setCollapsed(true)
    }, [setAddingSource])

    const onDelete = (source) => {
        fetch(`${process.env.REACT_APP_HOST}/source/${source.id}`, {
            method: 'DELETE',
            headers: {
                "X-Socket-Id": `${socket.id}`
            }
        })
    }

    const copyRoomLink = useCallback(() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setLinkCopied(true)
        })
    }, [])

    useEffect(() => {
        const onMouseMove = (e) => {
            const { x, y, width, height } = mapRef.current.getBoundingClientRect()
            setPos({
                x: clamp((e.pageX - x - window.scrollX) * 100 / width, 0, 100),
                y: clamp((y - e.pageY + height + window.scrollY) * 100 / height, 0, 100)
            })
        }

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setAddingSource(false)
                setPlacingSource(false)
                setSelectedFile('')
            }
        }

        const onClick = (e) => {
            setPlacingSource(false)
            const { x, y, width, height } = mapRef.current.getBoundingClientRect()
            const finalPos = {
                x: clamp(Math.round((e.pageX - x) * 100 / width), 0, 100),
                y: clamp(Math.round((y - e.pageY + height) * 100 / height), 0, 100)
            }
            setPos(finalPos)
            fetch(`${process.env.REACT_APP_HOST}/source`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pos: finalPos,
                    id: socket.id,
                    filename: selectedFile
                })
            }).then(res => {
                setSelectedFile('')
            }).catch(err => {
                console.error(err)
                setAddingSource(false)
            })
        }

        const mapElement = mapRef.current

        let addedEvent = false
        if (placingSource) {
            mapElement.addEventListener('mousemove', onMouseMove)
            mapElement.addEventListener('click', onClick)
            document.addEventListener('keydown', onKeyDown)
            addedEvent = true
        }

        return () => {
            if (addedEvent)
                mapElement.removeEventListener('mousemove', onMouseMove)
            mapElement.removeEventListener('click', onClick)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [placingSource, setPos, setAddingSource, mapRef, selectedFile])

    return <div className={`${styles.addSource} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.btnRow}>
            <div className={styles.title}>
            </div>
            <button onClick={() => setCollapsed(prev => !prev)}>
                <span className="material-symbols-outlined">
                    {collapsed ? 'menu' : 'close'}
                </span>
            </button>

        </div>
        <div className={styles.content}>
            <div>
                <h1>Add sounds</h1>
                <span>
                    You can choose a sound in the list and place it on the map with a click. Everyone in the room will see & hear the newly added sound source.
                </span>
                <h5>1. Select a sound</h5>
                <select value={selectedFile} onChange={onFileSelect}>
                    <option disabled value=''>Choose a sound</option>
                    {availableFiles.map((file) => {
                        return <option value={file.path} key={file.path}>{file.name}</option>
                    })}
                </select>
                <h5>2. Click on the map to place it</h5>
                <h5>Press Escape if you want to cancel</h5>
            </div>
            <div>
                {sources.length > 0 && <>
                    <h1>Remove sounds</h1>
                    <ul>
                        {sources.map(source => {
                            return <li key={source.id} onMouseEnter={() => setHighlightedSource(source)} onMouseLeave={() => setHighlightedSource(null)}>
                                {source.name}
                                <span className={`material-symbols-outlined ${styles.delete}`} onClick={() => onDelete(source)}>delete</span>
                            </li>
                        })}
                    </ul>
                </>}
            </div>
            <div>
                <h1>Invite friends</h1>
                <span>
                    You can invite friends to join you in the room. All they have to do is visit the same page URL as you. You can click below to copy this room's url and send it to anybody you like.
                </span>
                <div className={styles.copyContainer}>
                    <button className={`${styles.copyLink} ${linkCopied ? styles.copied : ''}`} onClick={copyRoomLink}>
                        <span className={`material-symbols-outlined ${styles.linkIcon}`}>
                            {linkCopied ? 'done' : 'link'}
                        </span>
                        {linkCopied ? 'Copied link' : 'Copy room link'}
                    </button>
                </div>
            </div>
        </div>
    </div>
}

export default RoomManager