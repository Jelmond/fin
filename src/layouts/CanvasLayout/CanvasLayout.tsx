'use client'

import { useRef } from 'react'
import { GlobalCanvas } from './Canvas'

// Everything defined in here will persist between route changes, only children are swapped
const CanvasLayout = ({ children }: any) => {
    const ref = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={ref}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                minHeight: 'calc(var(--vh, 1vh) * 100)',
            }}
        >
            <GlobalCanvas eventSource={ref} />
            { children }
        </div>
    )
}

export { CanvasLayout }
