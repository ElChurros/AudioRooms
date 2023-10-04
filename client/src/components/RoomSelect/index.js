import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './RoomSelect.module.css'

const RoomSelect = () => {
    const [inputWidth, setInputWidth] = useState(100)
    const resizer = useRef()
    const [roomId, setRoomId] = useState('')

    const onInput  = useCallback((e) => {
        const normalized = e.target.value.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 \-_]/g, '')
            .slice(0, 30)
            .toLowerCase()
        resizer.current.innerHTML = normalized.replace(/\s/g, '&nbsp;')
        setInputWidth(resizer.current.offsetWidth)
        setRoomId(normalized)
    },[])

    return <main className={styles.main}>
        <h1>Enter a room name</h1>
        <input onChange={onInput} value={roomId} id="room" type="text" pattern='^([a-z]|[0-9]|-|_| ){0,30}$' style={{width: inputWidth}}></input>
        <button type='button' disabled={ roomId.length === 0 }><Link to={roomId.length === 0 ? '' : `/room/${roomId}`}>Join room !</Link></button>
        <span ref={resizer} styles={styles.inputResizer}></span>
    </main> 
}

export default RoomSelect