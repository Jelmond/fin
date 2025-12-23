'use client'

import { forwardRef, useImperativeHandle, useMemo, useState } from "react"
import styled from "styled-components"
import { animated, useSpring } from "@react-spring/web"
import { heightLvh } from "@/styles/utils"
import { colors } from "@/styles"

const StyledContainer = styled.div`
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    ${heightLvh(100)}
    z-index: 100;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
`
export const TransitionBg = forwardRef(({}, outerRef) => {
    const [opened, open] = useState(false)
    useImperativeHandle(outerRef, () => ({ 
        show: (callback?: () => void) => {
            open(true)
            setTimeout(() => {
                callback && callback()
            }, effectDuration)
        }, hide: () => open(false) 
    }))
    const count = 30
    return (
        <StyledContainer style={{pointerEvents: opened ? 'all' : 'none',}}>
            {[...new Array(count)].map((_, i) => <Block key={i} opened={opened} id={i} count={count}></Block>)}
        </StyledContainer>
    )
})
TransitionBg.displayName = 'TransitionBg'

const StyledBlock = styled(animated.div)`
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${colors.black100};
    transform: scaleY(0);
`

// 2000ms - Hole time for appear
const effectDuration = 500
const cubeDuration = 20
const randomDuration = 0 // random time for more noise effect
const deltaDelay = 5

export const randomArray = [0.42, 0.71, 0.83, 0.29, 0.15, 0.93, 0.47, 0.56, 0.38, 0.91, 0.23, 0.67, 0.84, 0.12, 0.59, 0.77, 0.34, 0.88, 0.51, 0.96, 0.18, 0.63, 0.45, 0.72, 0.26, 0.81, 0.54, 0.92, 0.37, 0.69]
function Block({ children, id, count, opened }: any) {
    // const random = useMemo(() => Math.random() * randomDuration, [])
    const random = useMemo(() => randomArray[id] * randomDuration, [])

    const values = useSpring({
        scaleY: opened ? 1 : 0,
        delay: ((count - id) * deltaDelay + random),
        config: {
            duration: (count - id) * cubeDuration,
        }
    })

    return (
        <StyledBlock
            style={{ width: `100%`, height: `${100 / count}%`, ...values }}
        >
            {children}
        </StyledBlock>
    )
}