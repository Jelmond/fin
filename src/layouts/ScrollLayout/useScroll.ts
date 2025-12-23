import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import Lenis from "lenis";

export interface UseScroll {
    lenis: Lenis | null
    setLenis: (lenis: Lenis | null) => void
    isEnableScroll: boolean
    start: () => void   
    stop: () => void
}
export const useScroll = createWithEqualityFn<UseScroll>((set, get) => ({
    lenis: null,
    setLenis: (lenis) => set({ lenis }),
    isEnableScroll: true,
    start: () => set({ isEnableScroll: true }),
    stop: () => set({ isEnableScroll: false }),
}), shallow)