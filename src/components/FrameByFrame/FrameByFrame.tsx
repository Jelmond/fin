'use client'

import { useSpringTrigger } from "@/hooks/useSpringTriggerDepricated"
import { forwardRef, memo, MutableRefObject, RefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import Canvas from "./canvas"
import { isElementVisible } from "./coords"
import { useInView } from "@react-spring/web"
import { useFrames } from "./frames"
import { FramesProps } from "./frames"


interface Props {
    trigger?: MutableRefObject<HTMLElement>,
    strategy?: 'load' | 'lazy'
    mode?: 'scroll' | 'autoplay' | 'points'
    objectFit?: 'cover' | 'fit'
    className?: string
    autoplaySpeed?: number
    tag?: 'div' | 'span'
    LoaderComponent?: () => JSX.Element
    playOnce?: boolean
    onFullyPlayed?: () => void
    onDraw?: (state: any) => void
    onRender?: (state: any) => void
    nthStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
    points?: Record<number, boolean>
}
const FrameByFrame = memo(forwardRef(function FrameByFrame({
    trigger,
    mode = 'autoplay',
    strategy = 'load',
    autoplaySpeed = 0.01,
    objectFit = 'fit',
    count,
    baseUrl = '/',
    fileName,
    indexFunc,
    format = 'png',
    tag = 'div',
    playOnce = false,
    onFullyPlayed,
    LoaderComponent,
    onDraw,
    onRender,
    nthStep,
    points,
    ...props
}: Props & FramesProps, outerRef: any) {
    const [loaded, load] = useState(false)
    const [parent, inView] = useInView()
    const [readyToLoad, setReadyToLoad] = useState(false)
    const target = useRef<any>()
    const animation = useRef<any>()
    const fullyPlayed = useRef(false)
    const inited = useRef(false)
    const frames = useFrames({ count, baseUrl, fileName, indexFunc, format })
    useImperativeHandle(outerRef, () => parent.current)

    const [, state] = useSpringTrigger({
        trigger: trigger || parent,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        from: { smth: '0' },
        to: { smth: '1' },
        onChange: (state) => {
            if (mode !== 'scroll') { return }
            if (!animation.current) { return }
            if (playOnce && state.value.progress > 0.97 && !fullyPlayed.current) {
                fullyPlayed.current = true
                onFullyPlayed && onFullyPlayed()
            }
            if (!fullyPlayed.current) {
                animation.current.drawFrame(Math.round(state.value.progress * count))
                onDraw && onDraw(animation.current)
            }

            onRender && onRender(animation.current)

        }
    })

    useEffect(() => {
        if (!readyToLoad) { return }
        if (!parent.current || !target.current) { return }
        if (!count) { return }
        if (inited.current) { return }

        inited.current = true
        animation.current = new Canvas({
            parent: parent.current,
            target: target.current,
            frames,
            objectFit,
            nthStep,
            onFullyLoad: () => load(true)
        })

        let rqScroll: any = null
        if (mode === 'scroll') {
            animation.current.drawFrame(Math.round(state.progress.get() * count))
            onDraw && onDraw(animation.current)
        }

        return () => { animation.current.destroy() }
    }, [readyToLoad, mode, frames])

    useEffect(() => {
        let rq = requestAnimationFrame(function render(delta: number) {
            if (animation.current && parent.current) {
                if (mode === 'autoplay') {
                    const isVisible = isElementVisible(parent.current)
                    if (isVisible.partable.x && isVisible.partable.y) {
                        animation.current?.drawFrame(Math.round((delta * autoplaySpeed) % count))
                        onDraw && onDraw(animation.current)
                    }
                }
            }
            animation.current?.resize()
            animation.current && onRender && onRender(animation.current)
            rq = requestAnimationFrame(render)
        })
        return () => cancelAnimationFrame(rq)
    }, [mode, frames, readyToLoad, onDraw, onRender])

    useEffect(() => {
        if (strategy === 'load') {
            setReadyToLoad(true)
            return
        }
        if (inView && strategy === 'lazy' && !readyToLoad) {
            setReadyToLoad(true)
            return
        }
    }, [strategy, inView])

    if (tag === 'div') {
        return (
            <div ref={parent} {...props}>
                <canvas ref={target} style={{ width: '100%', height: '100%' }}></canvas>
                {!loaded && LoaderComponent ? <LoaderComponent /> : null}
            </div>
        )
    }

    return (
        <span ref={parent} {...props}>
            <canvas ref={target} style={{ width: '100%', height: '100%' }}></canvas>
            {!loaded && LoaderComponent ? <LoaderComponent /> : null}
        </span>
    )
}))

FrameByFrame.displayName = 'FrameByFrame'

export default FrameByFrame


