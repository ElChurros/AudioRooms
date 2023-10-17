import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import RoomSelect from './components/RoomSelect';
import Room from './components/Room';
import socket from './socket';
import styles from './App.module.css'
import Home from './components/Home';
import PulsatingSource from './components/PulsatingSource';

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {
    const callbacks = {
      'connect': () => { },
      'disconnect': () => {
        navigate('/')
      },
    }

    for (const [eventName, callback] of Object.entries(callbacks))
      socket.on(eventName, callback)
    socket.connect()

    return () => {
      for (const [eventName, callback] of Object.entries(callbacks))
        socket.off(eventName, callback)
    }
  }, [navigate])

  return <>
    {!location.pathname.includes('/room/') && <div className={styles.background}>
      <PulsatingSource x={-5} y={10} size={20} color='darkslategray' />
      <PulsatingSource x={80} y={103} size={20} color='darkslategray' />
      <PulsatingSource x={20} y={80} size={20} color='darkslategray' />
      <PulsatingSource x={70} y={30} size={20} color='darkslategray' />
    </div>}
    <div className={styles.wrapper}>
      <Routes>
        <Route path={'/'} element={<Home />} />
        <Route path={'/join'} element={<RoomSelect />} />
        <Route path={'/room/:roomId'} element={<Room />} />
        <Route path='*' index element={<Navigate to='/' replace />} />
      </Routes>
      <footer className={styles.footer}>
        Made for fun with <a href='https://react.dev'>React</a>, <a href='https://expressjs.com'>ExpressJS</a> & <a href='https://socket.io'>Socket.io</a> by <a href='https://arthurlemaire.fr'>Arthur LEMAIRE</a>
      </footer>
    </div>
  </>
}

export default App;
