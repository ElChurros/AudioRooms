import { forwardRef } from 'react'
import styles from './PulsatingSource.module.css'

const PulsatingSource = forwardRef(({ x, y, size, color='orange', movable, ...props }, ref) => {
    return <div className={`${styles.sourcePos} ${movable ? styles.movable : ""}`} style={{ left: `${x}%`, bottom: `${y}%` }} {...props}>
        <div ref={ref} className={styles.around} style={{width: size + 'rem', height: size + 'rem', background: `radial-gradient(circle closest-side, ${color}, #0000)`}}/>
        <div className={styles.source} />
        <div className={`${styles.ring}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
        <div className={`${styles.ring} ${styles.r2}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
        <div className={`${styles.ring} ${styles.r3}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
        <div className={`${styles.ring} ${styles.r4}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
        <div className={`${styles.ring} ${styles.r5}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
        <div className={`${styles.ring} ${styles.r6}`} style={{ width: size + 'rem', height: size + 'rem' }}></div>
    </div>
})

export default PulsatingSource