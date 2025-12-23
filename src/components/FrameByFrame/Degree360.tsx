'use client'

import { Component, useCallback, useEffect, useRef, useState } from "react"
import Canvas, { CanvasState } from "./canvas"
import { FullGestureState, useDrag } from "@use-gesture/react"
import { loadFirstFrame, useFrames } from "./frames"
import { isElementVisible } from "./coords"

import type { FramesProps } from "./frames"
import { Placeholder } from "./Placeholder"

import { useInView } from "@react-spring/web"

type DragState = Omit<FullGestureState<"drag">, "event"> & {
    event: PointerEvent | MouseEvent | TouchEvent | KeyboardEvent;
}

interface Props {
    className?: string
    pixelPerFrame?: number | string // string example => '1/10'
    autoRotateSpeed?: number
    autoRotateDelay?: number // if 0 = then autorotate stops after first interaction
    onDrag?: (state?: DragState) => void
    onMouseUp?: (event?: MouseEvent) => void
    onMouseDown?: (event?: MouseEvent) => void
    placeholder?: boolean
    objectFit?: 'cover' | 'fit'
    strategy?: 'load' | 'lazy'
    tag?: 'span' | 'div'
    direction?: 1 | -1
    LoaderComponent?: () => JSX.Element
    onBeforeDraw?: (state: CanvasState) => void
    onAfterDraw?: (state: CanvasState) => void
    onRender?: (state: CanvasState) => void
    play?: boolean
    onCancel?: () => void
}
export default function Degree360({
    count, 
    baseUrl = '/', 
    fileName, 
    indexFunc, 
    format = 'png', 
    pixelPerFrame = '1/50', 
    autoRotateSpeed = 0.5, 
    autoRotateDelay = 0,
    onMouseUp: _onMouseUp,
    onMouseDown: _onMouseDown,
    direction = 1,
    onDrag,
    placeholder,
    objectFit = 'cover',
    strategy = 'load',
    tag = 'div',
    LoaderComponent,
    onBeforeDraw,
    onAfterDraw,
    onRender,
    onCancel,
    play = true,
    ...props
}: FramesProps & Props) {
    const [loaded, load] = useState(false)
    const [parent, inView] = useInView()
    const [readyToLoad, setReadyToLoad] = useState(false)
    const target = useRef<any>()
    const animation = useRef<any>()
    const enableAutoRotate = useRef(true)
    const timeout = useRef<any>()
    const placeholderRef = useRef<any>(null)
    const frames = useFrames({ count, baseUrl, fileName, indexFunc, format })
    const isPlaying = useRef<boolean>(play)
    const lastDeltaTime = useRef(0)
    const lastFrame = useRef(0)
    useEffect(() => { isPlaying.current = play }, [play])

    // TODO: implement it better way
    useEffect(() => {
        // @ts-expect-error
        loadFirstFrame(frames[0][0].frame)
    }, [frames])

    const bind = useDrag(({ event, delta: [x, y] }) => {
        if (!isPlaying.current) { return }
        if (!animation.current) { return }
        enableAutoRotate.current = false
        onCancel && onCancel()
        placeholderRef.current?.cancel && placeholderRef.current.cancel()
        const pixelPerFrame = getPixelPerFrame(event.target as any)
        // console.log('x', x)
        const frame = getFrame(x * direction, pixelPerFrame)
        lastFrame.current = frame
        animation.current.drawFrame(lastFrame.current % count)
        // console.log(lastFrame.current % count)
        // clearTimeout(timeout.current)
        // if (autoRotateDelay) {
        //     timeout.current = setTimeout(() => {
        //         enableAutoRotate.current = true
        //     }, autoRotateDelay)
        // }
        onDrag && onDrag({ event, delta: [x, y] } as any)
    }, { 
        axis: 'x',
    })

    const onMouseDown = useCallback((event: MouseEvent) => {
        if (!isPlaying.current) { return }
        clearTimeout(timeout.current)
        enableAutoRotate.current = false
        _onMouseDown && _onMouseDown(event)
        event.target && (event.target as HTMLElement).style.setProperty('cursor', 'grabbing')
    }, [])
    const onMouseUp = useCallback((event: MouseEvent) => {
        if (!isPlaying.current) { return }
        _onMouseUp && _onMouseUp(event)
        event.target && (event.target as HTMLElement).style.setProperty('cursor', 'grab')
    }, [autoRotateDelay])

    const currentPixel = useRef(0)
    const getFrame = useCallback((x: number, pixelPerFrame: number) => {
        currentPixel.current += x / pixelPerFrame
        currentPixel.current = currentPixel.current % count
        if (currentPixel.current < 0) return Math.round(count + currentPixel.current)
        return Math.round(currentPixel.current)
    }, [pixelPerFrame])
    const getPixelPerFrame = useCallback((target: HTMLElement) => {
        if (typeof pixelPerFrame === 'string') {
            const [x, y] = pixelPerFrame.split('/')
            return Number(x)/Number(y) * target.getBoundingClientRect().width
        }
        return pixelPerFrame
    }, [pixelPerFrame])

    const lastDelta = useRef(0)
    useEffect(() => {
        if (!readyToLoad) { return }
        if (!parent.current || !target.current) {return}
        animation.current = new Canvas({
            parent: parent.current,
            target: target.current,
            frames,
            objectFit,
            onBeforeDraw,
            onAfterDraw,
            onFullyLoad: () => load(true)
        })

        let rq = requestAnimationFrame(function render(delta) {
            if (animation.current && enableAutoRotate.current && parent.current) {
                const isVisible = isElementVisible(parent.current)
                if (isVisible.partable.x && isVisible.partable.y && isPlaying.current && animation.current.loadingQualityLevels > 0) { // animation.current.loadingQualityLevels > 0 prevent rotation if placeholder quality level is in load
                    const time = delta * autoRotateSpeed
                    lastFrame.current = time
                    animation.current.drawFrame(Math.round(lastFrame.current % count))
                }
            } 
            animation.current?.resize()
            onRender && onRender(animation.current)
            rq = requestAnimationFrame(render)
        })
        return () => { animation.current.destroy(); cancelAnimationFrame(rq) }
    }, [autoRotateSpeed, count, readyToLoad])

    useEffect(() => {
        if (strategy === 'load') {
            setReadyToLoad(true)
            return
        }
        if (inView && strategy === 'lazy' && !readyToLoad && play) {
            setReadyToLoad(true)
            return
        }
    }, [strategy, inView, play])

    if (tag === 'div') {
        return(
            <div 
                {...bind()} 
                onMouseDown={onMouseDown as any} 
                onMouseUp={onMouseUp as any}
                ref={parent} 
                style={{ touchAction: 'none', userSelect: 'none', cursor: 'grab', position: 'relative', width: '100%', height: '100%'}} 
                {...props}
            >
                <canvas ref={target} style={{width: '100%', height: '100%', touchAction: 'pan-x'}}></canvas>
                {placeholder ? <Placeholder ref={placeholderRef}/> : null}
                {!loaded && LoaderComponent ? <LoaderComponent/> : null}
            </div>
        )
    }

    return(
        <span 
            {...bind()} 
            onMouseDown={onMouseDown as any} 
            onTouchStart={onMouseDown as any}
            onMouseUp={onMouseUp as any}
            onTouchEnd={onMouseUp as any}
            ref={parent} 
            style={{ touchAction: 'none', userSelect: 'none', cursor: 'grab', position: 'relative', width: '100%', height: '100%'}} 
            {...props}
        >
            <canvas ref={target} style={{width: '100%', height: '100%', touchAction: 'pan-x'}}></canvas>
            {placeholder ? <Placeholder ref={placeholderRef}/> : null}
            {!loaded && LoaderComponent ? <LoaderComponent/> : null}
        </span>
    )
}