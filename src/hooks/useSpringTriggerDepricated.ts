'use client'

import { RefObject, useRef } from 'react'
import { each, useIsomorphicLayoutEffect } from '@react-spring/shared'
import { useSpring, SpringValues, SpringProps } from '@react-spring/web'

export type TriggerPos = 'top top' | 'center top' | 'bottom top' | 'top center' | 'center center' | 'bottom center' | 'top bottom' | 'center bottom' | 'bottom bottom'
export type Mode = 'once' | 'forward' | 'always'

export interface UseScrollOptions extends SpringProps {
    trigger?: RefObject<HTMLElement | HTMLDivElement | null>,
    start?: TriggerPos,
    end?: TriggerPos,
    from?: {[x: string]: any},
    to?: {[x: string]: any},
    scrub?: boolean,
    mode?: Mode,
    enable?: boolean
}

export interface ScrollState {
    scrollStart: number,
    scrollEnd: number,
    progress: number,
    allProgress: number,
    length: number
}
export interface ScrollValues {
    [x: number | string]: string
}


/**
 * 
 * @param {UseScrollOptions} useScrollOptions options for the useScroll hook.
 * @param {RefObject<HTMLElement>} useScrollOptions.trigger the container to listen to scroll events on, defaults to the window.
 * @returns {SpringValues<{progress: number;}>} SpringValues the collection of values returned from the inner hook
 */

const defaultConfig = { mass: 1, tension: 170, friction: 26 }

export const useSpringTrigger = ({
    trigger,
    start,
    end,
    from = {},
    to = {},
    scrub,
    mode = 'always',
    onChange,
    onStart,
    enable = true,
    ...springOptions
}: UseScrollOptions = {}): [SpringValues<ScrollValues>, SpringValues<ScrollState>] => {
    const enableRef = useRef<boolean>(!!enable)
    useIsomorphicLayoutEffect(() => void (enableRef.current = !!enable), [enable])
    const mounted = useRef(false)
    const scrolledDown = useRef(false)

    // For Values
    const [scrollValues, api] = useSpring(
        () => ({
            from: {
                ...from,
                
            },
            to,
            ...springOptions,
        }),
        []
    )
    // For State
    const [scrollStateValues, stateApi] = useSpring(
        () => ({
            from: {
                progress: 0,
                length: 0,
                scrollStart: 0,
                scrollEnd: 0,
                allProgress: 0
            },
            onChange,
            onStart
        })
    )

    useIsomorphicLayoutEffect(() => {
        setTimeout(() => {mounted.current = true}, 30)
        const cleanupScroll = onScroll(
            // @ts-expect-error
            ( state: ScrollState , values: ScrollValues ) => {
                api.start({ to: { ...values }, config: springOptions?.config || defaultConfig, immediate: !mounted.current})
                stateApi.start({ to: { ...state }, config: springOptions?.config || defaultConfig, immediate: !mounted.current })
            },
            {
                trigger, 
                start, end, from, to, 
                scrub, 
                mode,
                enable: enableRef,
                scrolledDown
            }
        )

        return () => {
            /**
             * Stop the springs on unmount.
             */
            each(Object.values(scrollValues), value => value.stop())
            cleanupScroll()
        }
    }, [mode, api, stateApi])


    return [scrollValues, scrollStateValues]
}


// On Scroll
export type OnScrollCallback = (state: ScrollState | {}, values: ScrollValues) => void
export type OnScrollOptions = { trigger?: RefObject<HTMLElement>, start?: TriggerPos, end?: TriggerPos, from?: any, to?: any, scrub?: boolean, mode?: Mode, enable?: RefObject<boolean>, scrolledDown?: RefObject<boolean>}
export const onScroll = (
    callback: OnScrollCallback,
    { 
        trigger, 
        start = 'bottom bottom', 
        end = 'bottom top', 
        from, 
        to, 
        scrub, 
        mode, 
        enable,
        scrolledDown
    }: OnScrollOptions = {}
) => {
    let rq: any = null
    render()
    function render(time?: number) {
        const _trigger = trigger?.current || document.documentElement
        const state: any = calcProgress(start, end, _trigger, enable)
        const values = calcValues({ 
            from, 
            to, 
            progress: state.progress, 
            allProgress: state.allProgress, 
            // @ts-expect-error
            scrub, 
            // @ts-expect-error
            mode,
            // @ts-expect-error
            scrolledDown
        })
        callback({ ...state }, { ...values })
        rq = requestAnimationFrame(render)
    }

    return () => {
        cancelAnimationFrame(rq)
    }
}

function clamp(min: number, max: number, value: number) {
    return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, t: number) {
    return (1 - t) * start + t * end
}


function calcProgress(start: TriggerPos, end: TriggerPos, trigger: HTMLElement, enable?: RefObject<boolean>): ScrollState | {} {
    const bb = trigger.getBoundingClientRect()

    
    const clientHeight = window.innerHeight
    const poses = {
        // Screen Top
        'top_top': bb.top,
        'center_top': bb.top + bb.height / 2,
        'bottom_top': bb.bottom,
        // Screen Bottom
        'top_bottom': (bb.top) - clientHeight,
        'center_bottom': (bb.top + bb.height / 2) - clientHeight,
        'bottom_bottom': (bb.bottom) - clientHeight,
        // Screen Center
        'top_center': bb.top - clientHeight / 2,
        'center_center': (bb.top + bb.height / 2) - clientHeight / 2,
        'bottom_center': (bb.bottom) - clientHeight / 2,
    }
    // @ts-expect-error
    const scrollStart = poses[start.split(' ').join('_')]
    // @ts-expect-error
    const scrollEnd = poses[end.split(' ').join('_')]
    const length = Math.abs(scrollStart - scrollEnd)
    const allProgress = (scrollStart + length) / length
    const progress = enable?.current ? ( 1 - clamp(0, 1, allProgress) ) : 0

    return {
        scrollStart,
        scrollEnd,
        progress,
        allProgress,
        length
    }
}

function calcValues({
    from, 
    to, 
    progress, 
    allProgress, 
    scrub, 
    mode,
    scrolledDown
}: {
    from: any
    to: any
    progress: number
    allProgress: number, 
    scrub: boolean, 
    mode: Mode,
    scrolledDown: RefObject<boolean>
}) {
    const froms = Object.keys(from)
    const toes = Object.keys(to)
    const values: any = {}


    toes.forEach((value: string) => {
        const inFroms = froms.find(key => key === value)
        const startValue = inFroms ? from[inFroms] : '0'
        const endValue = to[value]

        const startMatch = startValue.toString().match(/^([-+]?[0-9]*\.?[0-9]+)([a-z%]*)$/)
        const endMatch = endValue.toString().match(/^([-+]?[0-9]*\.?[0-9]+)([a-z%]*)$/)
        if (!startMatch || !endMatch) {
            console.error('[useScrollTrigger]: Invalid "from" or "to" value format')
            return
        }

        const start = Number(parseFloat(startMatch[1]))
        const end = Number(parseFloat(endMatch[1]))
        
        
        
        const unit = endMatch[2]
    // console.log(startMatch, endMatch, start, end)
        
        
        if (scrub) {
            values[value] = lerp(+start, +end, progress) + unit
        } else {
            values[value] = getToggledValue({
                start, 
                end, 
                progress, 
                mode,
                scrolledDown
            }) + unit
        }
    })
    

    return values
}

function getToggledValue({
    start, 
    end, 
    progress, 
    mode,
    scrolledDown
}:{
    start: number
    end: number
    progress: number
    mode: Mode,
    scrolledDown: RefObject<boolean>
}) {
    if (mode === 'forward') {
        if (progress > 0) {
            // @ts-expect-error
            scrolledDown.current = true
        } else {
            // @ts-expect-error
            scrolledDown.current = false
        }
        if (scrolledDown.current) {
            return end
        }
    }
    if (mode === 'once') {
        if (progress > 0) {
            // @ts-expect-error
            scrolledDown.current = true
        }
        if (scrolledDown.current) {
            return end
        }
    }
    
    if (progress > 0) {
        return end
    }
    return start
}