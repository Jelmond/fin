'use client'

import { Box, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { View } from "@/layouts/CanvasLayout/components/View"
import { _colors, colors } from "@/styles/colors"
import styled from "styled-components"
import { rm } from "@/styles"

const StyledScene = styled(View)`
    width: ${rm(400)};
    height: ${rm(400)};
    background-color: ${colors.black100};
`

export const Scene = () => {
    return (
        <StyledScene>
            <Box scale={1}>
                <meshBasicMaterial color={_colors.white100} />
            </Box>
            <OrbitControls makeDefault autoRotate autoRotateSpeed={10} enableZoom={false} />
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        </StyledScene>
    )
}