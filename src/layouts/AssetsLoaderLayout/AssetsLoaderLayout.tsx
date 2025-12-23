'use client'

/**
 * @fileoverview Add here all Required assets to start page
*/

import styled from "styled-components";
import React, { useEffect, useState, createContext, useContext } from "react";
import { useLoadAssets } from "./useLoadAssets";
// Assets
import { useSpring, animated, useTransition } from "@react-spring/web";
import { rm } from '@/styles'
import { colors } from "@/styles";
import { Loader } from "./Loader";
import { create } from "zustand";
interface Props {
    loading: boolean,
    loaded: boolean
    progress: 0,
    currentFile: '',
    fullyLoaded: false,
}
export const AssetsLoaderContext = createContext({
    loading: true,
    progress: 0,
    currentFile: '',
    fullyLoaded: false,
    loaded: false
} as Props)
export const useAssetsLoader = () => {
    const context = useContext(AssetsLoaderContext)
    return context
}

const StyledLoader = styled(animated.div)`
    position: fixed;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    // background-color: color(text-black);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    --color-loader-1: #fff;
    --color-loader-2: #fff;
    --size-loader: ${rm(48)};
    transform: translate(0, 0, 0);
    overflow: hidden;
    color: ${colors.white100};
    pointer-events: none;

    > div {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        gap: ${rm(32)};
        pointer-events: none;
    }
`
const StyledLoaderContainer = styled.div`
    visibility: visible;
`

// Only For scroll feature
export const useLayoutState = create<{fullyLoaded: boolean}>((set) => ({
    fullyLoaded: false,
}))

export const AssetsLoaderLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [delayedLoading, setDelayedLoading] = useState(true)
    const [fullyLoaded, setFullyLoaded] = useState(false)
    const [loading, progress, currentFile] = useLoadAssets({ 
        // path: ' ',
        // images: [
        //     ...framesForLoadingLayout
        // ], 
        // videos: [
        //     'video/hero.mp4'
        // ] 
    })
    useEffect(() => { !loading && setDelayedLoading(false) }, [loading])
    useEffect(() => {
        if (fullyLoaded) {
            useLayoutState.setState({ fullyLoaded: true })
        }
    }, [fullyLoaded])

    useEffect(() => {
        document.body.style.removeProperty('opacity')
    }, [])

    const transitions = useTransition(!fullyLoaded, {
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        delay: 2000,
        config: {
            duration: 0
        }
    })

    const wrapperValues = useSpring({
        opacity: fullyLoaded ? 1 : 0
    })

    return (
        <>
            {transitions((styles, item) => item && (
                <StyledLoader style={styles}>
                    <Loader setFullyLoaded={setFullyLoaded} progress={progress} />
                </StyledLoader>
            ))}
            <StyledLoaderContainer as={animated.div} style={wrapperValues}>
                <AssetsLoaderContext.Provider
                    value={{
                        loading,
                        progress,
                        currentFile,
                        loaded: !delayedLoading,
                        fullyLoaded,
                    } as Props}
                >
                    {children}
                </AssetsLoaderContext.Provider>
            </StyledLoaderContainer>
        </>
    )
};