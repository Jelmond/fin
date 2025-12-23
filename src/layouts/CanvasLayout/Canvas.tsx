'use client'

import { Preload } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { RefObject } from "react"
import { r3f } from "./components/Three"

export interface Props {
    eventSource?: RefObject<any>
}
export const GlobalCanvas = ({ eventSource }: Props) => {
    return (
        <Canvas
            gl={{
                powerPreference: "high-performance",
                alpha: true,
                antialias: true,
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: 'calc(var(--vh, 1vh) * 100)',
                pointerEvents: 'none',
                zIndex: 1
            }}
            eventSource={eventSource}
            eventPrefix='client'
        >
            {/* @ts-ignore */}
            <r3f.Out />
            <Preload all />
        </Canvas>
    )
}