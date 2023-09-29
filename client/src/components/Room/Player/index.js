import styles from './Player.module.css'

const Player = ({children, pos, isSelf, ...props}) => {
    const { x, y, direction } = pos;
    return <div className={`${styles.playerPos} ${isSelf ? styles.self : ''}`} style={{left: `${x}%`, bottom: `${y}%`, rotate: `${-direction}deg`}} {...props}>
        <div className={styles.cone}/>
        <div className={styles.player}/>
        {children}
    </div>
}

export default Player