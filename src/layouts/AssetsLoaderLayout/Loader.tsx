'use client'

import { rm } from "@/styles"
import { _colors, colors } from "@/styles/colors"
import { useRef, useEffect, useState } from "react"
import styled from "styled-components"
import { LoaderBg } from "./LoaderBg"

interface LoaderProps {
    setFullyLoaded: (value: boolean) => void
    progress: number
}

const StyledLoader = styled.div`
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${colors.white100};
    pointer-events: all;
    padding: ${rm(16)};
`

export const Loader = ({ setFullyLoaded, progress }: LoaderProps) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const progressRef = useRef(0)
    const interpolatedProgress = useRef(0)
    const isFullyLoadedRef = useRef(false)
    const loaderBgRef = useRef<any>(null)

    useEffect(() => {
        progressRef.current = progress
    }, [progress])

    useEffect(() => {
        if (isLoaded) {
            document.body.style.cursor = 'default'
            return
        }
        document.body.style.cursor = 'progress'
    }, [isLoaded])

    // Fake Progress
    // Replace it with real progress/logic
    useEffect(() => {
        setTimeout(() => {
            loaderBgRef.current?.hide()
            setIsLoaded(true)
            setFullyLoaded(true)
        }, 0)
    }, [progressRef.current])

    return (
        <StyledLoader>
            <LoaderBg ref={loaderBgRef} />
        </StyledLoader>
    )
}