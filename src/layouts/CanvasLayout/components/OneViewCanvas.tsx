'use client'

import { Preload } from "@react-three/drei"
import { Canvas, Props as CanvasProps } from "@react-three/fiber"

interface Props extends CanvasProps {
    children: React.ReactNode
}

export const OneViewCanvas = ({ children, ...props }: Props) => {
    return (
        <Canvas
            dpr={[1, 2]}
            gl={{
                powerPreference: "high-performance",
                alpha: true,
                antialias: true,
            }}
            eventPrefix='client'
            { ...props }
        >
            { children }
            <Preload all />
        </Canvas>
    )
}