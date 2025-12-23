'use client'

import { NextPage } from "next"
import TextEngine from "./TextEngine"

import type { EngineProps } from "./TextEngine"
import { useAssetsLoader } from '@/layouts/AssetsLoaderLayout/AssetsLoaderLayout';
import { easings } from "@react-spring/web";
import { memo } from "react";
import { useIsRerouting } from "@/layouts/AnimatedRouterLayout/AnimatedRouterLayout";

interface Props {
    children: any
}
export const TLine: NextPage<Props & EngineProps> = memo(({
    children,
    enabled = true,
    ...props
}) => {
    const { fullyLoaded } = useAssetsLoader()
    const isRerouting = useIsRerouting()
    return (
        <TextEngine
            enabled={fullyLoaded && !isRerouting && enabled}
            lineIn={{y: 0, opacity: 1}}
            lineOut={{y: 100, opacity: 0}}
            lineStagger={80}
            lineConfig={{ duration: 1200, easing: easings.easeOutCubic }}
            overflow
            showSeoText={false}
            seo={true}
            columnGap={0.6}
            {...props}
        >
            { children }
        </TextEngine>
    )
})

TLine.displayName = 'TLine'