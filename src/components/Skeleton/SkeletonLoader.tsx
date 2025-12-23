/**
 * @fileoverview Skeleton loader component for loading state animations
 * 
 * This component provides an animated loading skeleton:
 * 1. Shimmer animation when in viewport
 * 2. Configurable styling via CSS variables
 * 3. Stops animating when out of view
 * 4. Extends standard div attributes
 * 
 * @param {string} className - Additional class names
 * @param {React.HTMLAttributes<HTMLDivElement>} props - HTML div element props
 */


'use client'

import { useInView } from "@react-spring/web"
import styled from "styled-components"

const StyledSkeletonLoader = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-effect, rgba(255, 255, 255, 0.1));
    overflow: hidden;

    &::after {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        transform: translateX(-100%);
        background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.2) 60%, rgba(255, 255, 255, 0));
        content: '';
    }

    &.-animate {
        &::after {
            animation: shimmer 1s infinite;
        }
    }

    @keyframes shimmer {
        100% {
            transform: translateX(100%);
        }
    }
`

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SkeletonLoader = ({ className,...props }: SkeletonLoaderProps) => {
    const [ref, inView] = useInView()
    return <StyledSkeletonLoader ref={ref} className={`${className} ${inView ? '-animate' : ''}`} {...props}></StyledSkeletonLoader>
}
