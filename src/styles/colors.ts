import { toVars } from "./utils"

export const _colors = {
    white100: "#FFFFFF",
    white80: "rgba(255, 255, 255, 0.8)",
    white60: "rgba(255, 255, 255, 0.6)",
    white30: "rgba(255, 255, 255, 0.3)",
    white10: "rgba(255, 255, 255, 0.1)",
    white5: "rgba(255, 255, 255, 0.05)",
    black100: "#000000",
    black80: "rgba(0, 0, 0, 0.8)",
    black60: "rgba(0, 0, 0, 0.6)",
    black40: "rgba(0, 0, 0, 0.4)",
} 


export const colors: typeof _colors = toVars(_colors)