import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './RoomSelect.module.css'

const RoomSelect = () => {
    const [inputWidth, setInputWidth] = useState(100)
    const resizer = useRef()
    const [roomId, setRoomId] = useState('')

    const onInput  = (e) => {
        resizer.current.innerHTML = e.target.value.replace(/\s/g, '&nbsp;')
        setInputWidth(resizer.current.offsetWidth)
        setRoomId(e.target.value)
    }

    return <main className={styles.main}>
        <h1>Enter a room name</h1>
        <input onChange={onInput} id="room" type="text" style={{width: inputWidth}}></input>
        <button type='button' disabled={ roomId.length === 0 }><Link to={roomId.length === 0 ? '' : `/room/${roomId}`}>Join room !</Link></button>
        <span ref={resizer} styles={styles.inputResizer}></span>
    </main> 
}

export default RoomSelect