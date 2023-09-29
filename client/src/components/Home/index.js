import { Link } from 'react-router-dom'
import styles from './Home.module.css'

const Home = () => {
    return <>
        <main className={styles.main}>
            <h1 className={styles.title}>Welcome to AudioRooms !</h1>
            <p>
                <span>This app uses the audio spacialization features of the WebAudio API to create virtual rooms in which you can walk around, talk to peers & hear sound sources with 3d audio.<br />
                    You join a room by entering the room's name. This creates the room if it did not already exist. WebRTC connections are created with every other person present in the room to establish communication.
                </span>
            </p>
            <button>
                <Link to='/join'>Let's go !</Link>
            </button>
        </main>
    </>
}

export default Home