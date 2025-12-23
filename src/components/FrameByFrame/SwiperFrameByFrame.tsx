'use client'

import 'swiper/css'

import Canvas from "./canvas"
import { forwardRef, memo, MutableRefObject, useEffect, useImperativeHandle, useRef, useState } from "react"
import { easings, useInView, useSpring } from "@react-spring/web"
import { useFrames } from "./frames"
import { FramesProps } from "./frames"

import { Swiper, SwiperSlide } from "swiper/react"
import { Mousewheel, Virtual } from "swiper/modules"
import { useLoop } from "@/hooks/useLoop"


interface Props {
    trigger?: MutableRefObject<HTMLElement>,
    strategy?: 'load' | 'lazy'
    objectFit?: 'cover' | 'fit'
    className?: string
    autoplaySpeed?: number
    onRender?: (state: any) => void
    nthStep?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
    points: { duration: number, frame: number }[]
    showSlides?: boolean
    onAfterSlideChange?: (state: any, realActive: number, contentActive: number) => void
    onBeforeSlideChange?: (state: any, realActive: number, contentActive: number) => void
}
const SwiperFrameByFrame = memo(forwardRef(function SwiperFrameByFrame({
    trigger,
    strategy = 'load',
    autoplaySpeed = 0.01,
    objectFit = 'fit',
    count,
    baseUrl = '/',
    fileName,
    indexFunc,
    format = 'png',
    onRender,
    nthStep,
    points,
    showSlides = false,
    onAfterSlideChange,
    onBeforeSlideChange,
    ...props
}: Props & FramesProps, outerRef: any) {
    const [parent, inView] = useInView()
    const [readyToLoad, setReadyToLoad] = useState(false)
    const target = useRef<any>()
    const animation = useRef<any>()
    const inited = useRef(false)
    const frames = useFrames({ count, baseUrl, fileName, indexFunc, format })
    useImperativeHandle(outerRef, () => parent.current)

    const swiperRef = useRef<any>(null)
    const [realActive, setRealActive] = useState(0)
    const realActiveRef = useRef(0)
    useEffect(() => { realActiveRef.current = realActive }, [realActive])
    const realDurationRef = useRef(0)
    const delta = useRef(0)
    const [contentActive, setContentActive] = useState(0) // Delayed for content appear
    const activeTimeout = useRef<any>()

    const eventsEnabled = useRef(true)
    const isAnimating = useRef(false)


    // Allow native scroll on edges
    const timeout = useRef<any>()
    function delayReleaseOnEdges() {
        clearTimeout(timeout.current)
        timeout.current = setTimeout(() => {
            if (!swiperRef.current) { return }
            swiperRef.current.params.mousewheel.releaseOnEdges = true
            swiperRef.current.update()
        }, realDurationRef.current)
    }

    useEffect(() => { animation.current && onAfterSlideChange && onAfterSlideChange(animation.current, realActive, contentActive) }, [contentActive])

    const springs = useSpring({
        frame: points[realActive].frame,
        config: { duration: realDurationRef.current, easing: easings.easeInOutQuad },
        onChange: () => {
            animation.current.drawFrame(Math.round(springs.frame.get()))
        }
    })

    // Render Event
    useLoop(() => {
        if (!animation.current) { return }
        onRender && onRender(animation.current)
        animation.current?.resize()
    }, { framerate: 1 })

    // Init Canvas
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
        })

        return () => { animation.current.destroy() }
    }, [readyToLoad, frames])

    // Set Load Strategy
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

    // Check scroll position and set initial slide
    useEffect(() => {
        const setSlide = (value: number) => {
            swiperRef.current?.slideTo(value, 0, false)
            setRealActive(value)
            setTimeout(() => {
                realDurationRef.current = 0
            }, 0)
        }
        const determineInitialSlide = () => {
            const scrollY = parent.current.getBoundingClientRect().top
            if (scrollY < -1) {
                setSlide(points.length - 1)
            } else {
                setSlide(0)
            }
        };

        determineInitialSlide()
    }, [])

    // Check if fully visible and toggle swiper events
    useEffect(() => {
        const observerCallback: IntersectionObserverCallback = (entries) => {
            entries.forEach((entry) => {
                const isFullyVisible = entry.intersectionRatio >= 0.97
                if (isFullyVisible) {
                    swiperRef.current.mousewheel.enable()
                    eventsEnabled.current = true
                    swiperRef.current.allowTouchMove = true
                    swiperRef.current.params.touchStartPreventDefault = true
                    swiperRef.current.params.touchMoveStopPropagation = true
                    swiperRef.current.params.touchStartForcePreventDefault = true
                    parent.current.style.pointerEvents = 'all'
                } else {
                    swiperRef.current.mousewheel.disable()
                    eventsEnabled.current = false
                    swiperRef.current.allowTouchMove = false
                    swiperRef.current.params.touchStartPreventDefault = false
                    swiperRef.current.params.touchMoveStopPropagation = false
                    swiperRef.current.params.touchStartForcePreventDefault = false
                    parent.current.style.pointerEvents = 'none'
                }
                swiperRef.current.update()
            })
        }

        const observerOptions: IntersectionObserverInit = {
            threshold: [0, 0.97], //0.97 for safari issues
        }

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        if (parent.current) {
            observer.observe(parent.current)
        }

        return () => {
            if (swiperRef.current) {
                observer.unobserve(parent.current)
            }
        }
    }, [])

    // Touch handling for edge scrolling
    // Move page on touch to use intersactionObserver logic
    useEffect(() => {
        let startY = 0;
        let isEdge = false;

        const handleTouchStart = (event: TouchEvent) => {
            if (isAnimating.current) { return }
            if (!eventsEnabled.current) { return }
            const swiper = swiperRef.current;
            if (!swiper) return;

            const touch = event.touches[0];
            startY = touch.clientY;

            // Check if we're at the first or last slide
            if (swiper.isBeginning || swiper.isEnd) {
                isEdge = true;
            } else {
                isEdge = false;
            }
        };

        const handleTouchMove = (event: TouchEvent) => {
            if (isAnimating.current) { return }
            if (!eventsEnabled.current) { return }
            const swiper = swiperRef.current;
            if (!swiper || !isEdge) return;

            const touch = event.touches[0];
            const deltaY = touch.clientY - startY;

            // At the first slide and swiping down (deltaY > 0)
            if (swiper.isBeginning && deltaY > 0) {
                event.preventDefault();
                window.scrollBy(0, -deltaY / 2);
            }
            // At the last slide and swiping up (deltaY < 0)
            else if (swiper.isEnd && deltaY < 0) {
                event.preventDefault();
                window.scrollBy(0, -deltaY / 2);
            }
        };

        const swiperEl = swiperRef.current?.el;

        if (swiperEl) {
            swiperEl.addEventListener('touchstart', handleTouchStart, { passive: false });
            swiperEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        }

        // Cleanup
        return () => {
            if (swiperEl) {
                swiperEl.removeEventListener('touchstart', handleTouchStart);
                swiperEl.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, [])

    // Control Keyboard (I don't use built-in keyboard cuz of our special case)
    useEffect(() => {
        const prevent = (event: any, direction: 'down' | 'up') => {
            if (!eventsEnabled.current) return false
            if (isAnimating.current) {
                event.preventDefault()
                return false
            }

            if (direction === 'down') {
                if (realActiveRef.current >= points.length - 1) return false
            }
            if (direction === 'up') {
                if (realActiveRef.current <= 0) return false
            }

            event.preventDefault()
            return true
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            const swiper = swiperRef.current;
            if (!swiper) return;
            const key = event.code || event.key || event.keyCode;

            switch (key) {
                case 'Space':
                case 32:
                case 'PageDown':
                case 34:
                case 'ArrowDown':
                case 40:
                    if (!prevent(event, 'down')) { break }
                    swiper.slideNext()
                    break;
                case 'PageUp':
                case 33:
                case 'ArrowUp':
                case 38:
                    if (!prevent(event, 'up')) { break }
                    swiper.slidePrev()
                    break;

                // TODO: Add this btns support
                // case 'Home':
                // case 36:
                //     swiper.slideTo(0)
                //     break;
                // case 'End':
                // case 35:
                //     swiper.slideTo(swiper.slides.length - 1)
                //     break;
                default:
                    break;
            }
        }


        const swiperContainer = document.documentElement

        if (swiperContainer) {
            swiperContainer.addEventListener('keydown', handleKeyDown)
        }

        return () => {
            if (swiperContainer) {
                swiperContainer.removeEventListener('keydown', handleKeyDown)
            }
        }
    }, [])

    return (
        <div
            ref={parent}
            style={{ position: 'relative' }}
            {...props}
        >
            <Swiper
                direction="vertical"
                slidesPerView={1}
                spaceBetween={0}
                modules={[Mousewheel, Virtual]}
                pagination={false}
                virtual

                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%'
                }}

                onSwiper={(swiperInstance) => {
                    swiperRef.current = swiperInstance;
                    swiperRef.current.params.speed = points[realActive].duration
                    swiperRef.current.update()
                }}
                onSlideChange={(swiper) => {
                    // Set the transition duration based on the current slide index
                    if (swiperRef.current) {
                        isAnimating.current = true
                        clearTimeout(activeTimeout.current)
                        const currentSlideIndex = swiper.realIndex
                        delta.current = swiper.previousIndex < currentSlideIndex ? -1 : 0
                        realDurationRef.current = points[currentSlideIndex + delta.current].duration || 1000
                        swiperRef.current.params.speed = realDurationRef.current
                        swiperRef.current.update()
                        setRealActive(currentSlideIndex)
                        animation.current && onBeforeSlideChange && onBeforeSlideChange(animation.current, currentSlideIndex, currentSlideIndex + delta.current)
                        activeTimeout.current = setTimeout(() => {
                            setContentActive(currentSlideIndex)
                            isAnimating.current = false
                        }, realDurationRef.current)
                    }
                }}

                mousewheel={{
                    // Keep true on mount
                    enabled: true,
                    releaseOnEdges: false,
                    thresholdDelta: 30,
                }}
                onReachBeginning={delayReleaseOnEdges}
                onReachEnd={delayReleaseOnEdges}
                onFromEdge={() => {
                    if (!swiperRef.current) { return }
                    swiperRef.current.params.mousewheel.releaseOnEdges = false
                }}

                allowTouchMove={true}
                touchStartPreventDefault={true}
                touchMoveStopPropagation={true}
                touchStartForcePreventDefault={true}
                passiveListeners={false}

                preventInteractionOnTransition={true} // Prevents multiple swipe which allowes users to go through all slides very fast
            >
                {points?.map((slide, idx) => <SwiperSlide key={idx}>{showSlides ? `Slide ${idx}` : ``}</SwiperSlide>)}
            </Swiper>
            <canvas ref={target} style={{ width: '100%', height: '100%' }}></canvas>
        </div>
    )
}))

SwiperFrameByFrame.displayName = 'SwiperFrameByFrame'

export default SwiperFrameByFrame