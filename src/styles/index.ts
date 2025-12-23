'use client'

import { createGlobalStyle } from "styled-components"
import { printVars } from "./utils"
import { _colors, colors } from "./colors"
import { fontOnest } from "./fonts"

import { initSmartCSSGrid } from "@/styles/grid/grid"

const {
    SmartCSSGrid,
    media,
    rm,
    em
} = initSmartCSSGrid({
    fontBase: 16,
    scaleUpCoeff: 0.6666,
    grid: {
        xlg: 1920,
        lg: 1440,
        md: 1024,
        xsm: 576,
    },
    related: {
        xsm: 390
    }
})

// Global css
const GlobalStyles = createGlobalStyle`
    // Variables 
    :root {
        ${printVars(_colors, 'color')}
    }

    // Normalize
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        outline: none;
        border: none;
        text-decoration: none;
        color: inherit;
    }

    img {
        user-select: none;
    }

    span, a {
        display: inline-block;
    }

    button {
        background: none;
    }

     /* Remove autocomplete styles*/
    /* Inputs can set --input-bg-color CSS variable to match their background */
    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    input:-webkit-autofill:active,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus,
    textarea:-webkit-autofill:active,
    select:-webkit-autofill,
    select:-webkit-autofill:hover,
    select:-webkit-autofill:focus,
    select:-webkit-autofill:active {
        background-color: var(--input-bg-color, ${colors.white100}) !important;
        -webkit-text-fill-color: inherit !important;
        transition: background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s;
        -webkit-box-shadow: 0 0 0 1000px var(--input-bg-color, ${colors.white100}) inset !important;
        box-shadow: 0 0 0 1000px var(--input-bg-color, ${colors.white100}) inset !important;
    }

    html {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: ${colors.white100};
        color: ${colors.black100};
        ${fontOnest(400)}
    }

    html, body {
        -webkit-overflow-scrolling: touch;
        position: relative;
        overscroll-behavior-y: none;
    }
    body::-webkit-scrollbar { width: 0; }

    #__next {
        height: 100%;
    }

    body {
        display: flex;
        flex-direction: column;
    }


    /* Lenis */

    html.lenis, html.lenis body {
        height: auto;
    }

    .lenis.lenis-smooth {
        scroll-behavior: auto !important;
    }

    .lenis.lenis-smooth [data-lenis-prevent] {
        overscroll-behavior: contain;
    }

    .lenis.lenis-stopped {
        overflow: hidden;
    }

    .lenis.lenis-smooth iframe {
        pointer-events: none;
    }

    /* Cookie */
    .cookieContainer {
        position: fixed;
        right: ${rm(8)} !important;
        bottom: ${rm(8)} !important;
        max-width: ${rm(450)};
        width: 100%;
        z-index: 10002;
        background: rgba(0, 0, 0, .95);
        border-radius: ${rm(4)};
        padding: ${rm(12)} ${rm(32)};
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: ${rm(24)};
        border: 1px solid rgb(37, 37, 37);
        opacity: 0;
        transition: opacity 2s ease;
        &.visible {
            opacity: 1;
        }
        ${media.xsm`
            gap: ${rm(16)};
            padding: ${rm(8)} ${rm(32)};
        `}

        > div {
            width: 100%;
        }

        ${media.xsm`
            right: ${rm(0)} !important;
            bottom: ${rm(0)} !important;
            max-width: 100%;
            padding: ${rm(12)} ${rm(16)};
        `}

        h5 {
            font-size: ${rm(32)};
            margin-bottom: ${rm(14)};
            color: white;
            ${media.xsm`
                margin-bottom: ${rm(10)};
                font-size: ${rm(24)};
            `}
        }

        p {
            font-size: ${rm(16)};
            color: white;

            * {
                display: inline;
            }

            a {
                position: relative;
                margin-left: ${rm(4)};
                cursor: pointer;
                &:hover::before {
                    background-color: white;
                }
                &::before {
                    position: absolute;
                    content: '';
                    left: 0; top: calc(100% - ${rm(2)});
                    width: 100%;
                    height: 1px;
                    background-color: rgb(118, 118, 118);
                }
            }
        }
    }

    .cookieButton {
        padding-bottom: ${rm(4)};
        cursor: pointer;
        padding: ${rm(16)} ${rm(64)};
        background-color: white;
        color: black;
        border-radius: ${rm(2)};
        width: 100%;
        font-size: ${rm(16)};
        border: 1px solid white;
        &:hover {
            background: transparent;
            color: white;
        }
    }
`

// Exports
export default GlobalStyles
export { colors } from './colors'
export { fonts } from './fonts'
export { SmartCSSGrid, media, rm, em }