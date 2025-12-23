'use client'

import { useSpring, animated, easings, useSpringRef } from "@react-spring/web"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

const styles = {
    placeholder: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: '0',
        left: '0',
        overflow: 'hidden',
        pointerEvents: 'none'
    },
    pointer: {
        position: 'absolute',
        left: '50%',
        bottom: '16%',
        transform: 'translateX(-50%)',
        width: '2rem',
        height: '2rem',
        transition: 'opacity .3s ease'
    },
    svg: {
        width: '2rem',
        height: '2rem'
    }
}

export const Placeholder = forwardRef(({className}: any, outerRef) => {
    const stopped = useRef(false)
    const api = useSpringRef()
    const pointerRef = useRef<any>()
    const pointerSprings = useSpring({
        ref: api,
        from: { x: '0', opacity: 0 },
    })
    useEffect(() => {
        // Required to start Manually cuz of external ApiRef
        api.start({         
            to: async (next, cancel) => {
                await next({ x: '6rem', opacity: 1, config: { duration: 700, easing: easings.easeInOutQuad } })
                await next({ x: '-6rem' })
                await next({ x: '4rem' })
                await next({ x: '-2rem' })
                await next({ x: '2rem', opacity: 0.5 })
                await next({ x: '0', opacity: 0.5, config: { duration: 700 } })
            },
            loop: true,
        })
    }, [])
    useImperativeHandle(outerRef, () => ({
        cancel: () => {
            if (stopped.current) { return }
            stopped.current = true
            pointerRef.current.style.opacity = 0
            api.start({ 
                to: { x: '0', opacity: 0 }, 
                onResolve: () => {
                    api.stop()
                } 
            })
        }
    }))

    return (
        <span style={styles.placeholder as any} className={className}>
            <span ref={pointerRef} style={styles.pointer as any}>
                <animated.svg style={{...pointerSprings, ...styles.svg}} width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.9999 2C11.3549 2 9.99988 3.355 9.99988 5V16.813L9.34388 16.125L9.09388 15.906C8.53766 15.3523 7.78475 15.0414 6.99988 15.0414C6.21502 15.0414 5.46211 15.3523 4.90588 15.906C4.35214 16.4622 4.04126 17.2151 4.04126 18C4.04126 18.7849 4.35214 19.5378 4.90588 20.094V20.125L13.0939 28.219L13.1559 28.25L13.1869 28.313C14.6259 29.4038 16.3812 29.996 18.1869 30H19.9069C20.9827 30.0022 22.0484 29.792 23.0428 29.3813C24.0372 28.9706 24.9406 28.3675 25.7013 27.6067C26.462 26.8459 27.065 25.9424 27.4755 24.948C27.8861 23.9536 28.0963 22.8878 28.0939 21.812V14C28.0939 12.355 26.7379 11 25.0939 11C24.6679 11 24.2739 11.117 23.9059 11.281C23.5779 9.981 22.3949 9 20.9999 9C20.2339 9 19.5309 9.3 18.9999 9.781C18.4532 9.28153 17.7404 9.00316 16.9999 9C16.6582 9.00427 16.3198 9.06789 15.9999 9.188V5C15.9999 3.355 14.6449 2 12.9999 2ZM12.9999 4C13.5549 4 13.9999 4.445 13.9999 5V16H15.9999V12C15.9999 11.445 16.4449 11 16.9999 11C17.5549 11 17.9999 11.445 17.9999 12V16H19.9999V12C19.9999 11.445 20.4449 11 20.9999 11C21.5549 11 21.9999 11.445 21.9999 12V16H24.0939V14C24.0939 13.445 24.5389 13 25.0939 13C25.6479 13 26.0939 13.445 26.0939 14V21.813C26.0939 25.277 23.3709 28 19.9059 28H18.1879C16.7229 28 15.4569 27.477 14.4059 26.687L6.31188 18.687C5.86688 18.242 5.86688 17.757 6.31188 17.312C6.75788 16.867 7.24188 16.867 7.68688 17.312L11.9999 21.625V5C11.9999 4.445 12.4449 4 12.9999 4Z" fill="black"/>
                </animated.svg>
            </span>
        </span>
    )
})
Placeholder.displayName = 'Placeholder'