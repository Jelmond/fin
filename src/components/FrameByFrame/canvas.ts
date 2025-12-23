//@ts-nocheck
import Canvas2d from './canvas2d'
import { FramesType } from './frames'

interface Params {
    parent: HTMLElement
    target: HTMLElement
    frames: FramesType
    objectFit: 'cover' | 'fit',
    nthStep?: number
    onFullyLoad?: () => void,
    onBeforeDraw?: (state: State) => void
    onAfterDraw?: (state: State) => void
}
export interface CanvasState {
    framesIsLoaded: Record<string, boolean>
    isLoaded: boolean
    activeFrame: string
    totalFrames: number
    totalQualityLevels: number
    currentQualityLevel: number
    isStepByStep: boolean
    objectFit: 'cover' | 'fit'
    context: CanvasRenderingContext2D
    parent: HTMLElement
    canvas: HTMLCanvasElement
    width: number
    height: number
    ratio: number
    isRenderActive: boolean
    onBeforeDraw?: (state: CanvasState) => void
    onAfterDraw?: (state: CanvasState) => void
}

class Canvas extends Canvas2d {
    frames: FramesType
    framesIsLoaded: Record<string, boolean>
    isLoaded = false
    activeFrame = 0
    objectFit: 'cover' | 'fit'
    isStepByStep = false
    totalFrames = 0
    loadingQualityLevels = 0
    totalQualityLevels = 0
    onFullyLoad?: () => void
    currentQualityLevel = 0
    onBeforeDraw
    onAfterDraw
    nthStep = 1
    lastLoadedFrameIndex = 0 
    isNthStepLoaded = false

    constructor({
        parent,
        target,
        frames,
        objectFit,
        onBeforeDraw,
        onAfterDraw,
        onFullyLoad,
        nthStep = 1
    }: Params) {
        super(parent, target)
        this.frames = frames
        this.framesIsLoaded = {}
        this.objectFit = objectFit
        this.isStepByStep = Array.isArray(frames[0]) // Check if frames is an array of arrays
        this.onBeforeDraw = onBeforeDraw
        this.onAfterDraw = onAfterDraw
        this.onFullyLoad = onFullyLoad
        this.nthStep = nthStep

        if (this.isStepByStep) {
            this.totalQualityLevels = frames.length
            this.totalFrames = frames[0].length
            this.loadFramesAtQualityLevel(0)
        } else {
            this.totalFrames = frames.length
            this.loadFramesNormally()
        }

        this.toResize(() => {
            this.drawFrame(this.activeFrame)
        })

        this.drawFrame = this.drawFrame.bind(this)
    }

    loadFramesNormally() {
        let framesLoaded = 0
        const totalFrames = this.totalFrames

        const loadRemainingFrames = () => {
            for (let i = 0; i < totalFrames; i++) {
                if (i % this.nthStep === 0) continue

                const image = new Image()
                image.src = this.frames[i].frame
                this.frames[i] = image

                image.onload = () => {
                    this.framesIsLoaded[`${i}`] = true
                    framesLoaded++
                    if (this.activeFrame === i) this.drawFrame(i)
                    if (framesLoaded === totalFrames) {
                        this.isLoaded = true
                        this.onFullyLoad && this.onFullyLoad()
                    }
                }
            }
        }

        // Load frames in steps
        for (let i = 0; i < totalFrames; i++) {
            if (i % this.nthStep !== 0) continue

            const image = new Image()
            image.src = this.frames[i].frame
            this.frames[i] = image

            image.onload = () => {
                this.framesIsLoaded[`${i}`] = true
                framesLoaded++
                if (this.activeFrame === i) this.drawFrame(i)

                // Track the last successfully loaded frame
                this.lastLoadedFrameIndex = i

                if (framesLoaded === Math.ceil(totalFrames / this.nthStep)) {
                    this.isNthStepLoaded = true
                    loadRemainingFrames()
                }
            }
        }
    }

    loadFramesAtQualityLevel(qualityLevel) {
        if (qualityLevel >= this.totalQualityLevels) {
            this.isLoaded = true
            this.onFullyLoad && this.onFullyLoad()
            return
        }

        let framesLoadedAtThisQuality = 0
        const totalFrames = this.totalFrames

        const loadRemainingFrames = () => {
            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                if (frameIndex % this.nthStep === 0) continue

                const frameObj = this.frames[qualityLevel][frameIndex]
                const image = new Image()
                image.src = frameObj.frame
                this.frames[qualityLevel][frameIndex] = image

                image.onload = () => {
                    this.framesIsLoaded[`${frameIndex}_${qualityLevel}`] = true
                    framesLoadedAtThisQuality++
                    if (this.activeFrame === frameIndex) this.drawFrame(frameIndex)
                        // console.log('framesLoadedAtThisQuality === totalFrames', framesLoadedAtThisQuality === totalFrames)
                    if (framesLoadedAtThisQuality === totalFrames) {
                        this.currentQualityLevel++
                        this.loadFramesAtQualityLevel(qualityLevel + 1)
                    }
                }
            }
        }

        // Load every nth frame first
        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            if (frameIndex % this.nthStep !== 0) continue

            const frameObj = this.frames[qualityLevel][frameIndex]
            const image = new Image()
            image.src = frameObj.frame
            this.frames[qualityLevel][frameIndex] = image

            image.onload = () => {
                this.framesIsLoaded[`${frameIndex}_${qualityLevel}`] = true
                framesLoadedAtThisQuality++
                if (this.activeFrame === frameIndex) this.drawFrame(frameIndex)
                this.loadingQualityLevels = qualityLevel + 1

                // Track the last successfully loaded frame
                this.lastLoadedFrameIndex = frameIndex
                if (framesLoadedAtThisQuality === Math.ceil(totalFrames / this.nthStep)) {
                    this.isNthStepLoaded = true
                    if (this.nthStep === 1) {
                        this.currentQualityLevel = qualityLevel
                        this.loadFramesAtQualityLevel(qualityLevel + 1)
                        return
                    }
                    loadRemainingFrames()
                }
            }
        }
    }

    findClosestLoadedFrame(currentFrameIndex, qualityLevel = 0) {
        const totalFrames = this.isStepByStep ? this.frames[qualityLevel].length : this.frames.length;
    
        // Search for the closest frame both before and after the current frame
        let closestLoadedFrameIndex = currentFrameIndex;
        let minDistance = totalFrames;
    
        // Search backward
        for (let i = currentFrameIndex - 1; i >= 0; i--) {
            const frameKey = this.isStepByStep ? `${i}_${qualityLevel}` : `${i}`;
            if (this.framesIsLoaded[frameKey]) {
                const distance = currentFrameIndex - i;
                if (distance < minDistance) {
                    minDistance = distance;
                    closestLoadedFrameIndex = i;
                }
                break;
            }
        }
    
        // Search forward
        for (let i = currentFrameIndex + 1; i < totalFrames; i++) {
            const frameKey = this.isStepByStep ? `${i}_${qualityLevel}` : `${i}`;
            if (this.framesIsLoaded[frameKey]) {
                const distance = i - currentFrameIndex;
                if (distance < minDistance) {
                    minDistance = distance;
                    closestLoadedFrameIndex = i;
                }
                break;
            }
        }
    
        return closestLoadedFrameIndex;
    }    

    drawFrame(number) {
        if (this.isStepByStep) {
            if (!this.frames || !this.frames.length) return
            if (number >= this.totalFrames) number = this.totalFrames - 1
            let frameIndex = number

            // Find the highest quality level loaded for this frameIndex
            let qualityLevel = this.totalQualityLevels - 1
            for (; qualityLevel >= 0; qualityLevel--) {
                if (this.framesIsLoaded[`${frameIndex}_${qualityLevel}`]) {
                    break
                }
            }

            this.activeFrame = frameIndex
            if (qualityLevel < 0) { return }
            const frame = this.frames?.[qualityLevel]?.[frameIndex]
            this.context.clearRect(0, 0, this.width, this.height)
            this.drawFrameImage(frame)
        } else {
            if (!this.frames.length) return
            if (number >= this.frames.length) number = this.frames.length - 1
            let frameIndex = number
            this.activeFrame = frameIndex
            if (!this.framesIsLoaded[`${frameIndex}`]) { return }
            const frame = this.frames?.[this.activeFrame]
            this.context.clearRect(0, 0, this.width, this.height)
            this.drawFrameImage(frame)
        }
    }

    drawFrameImage(frame: HTMLImageElement) {
        const frameAspect = frame.naturalWidth / frame.naturalHeight
        const canvasAspect = this.width / this.height

        const draw = {
            width: frame.naturalWidth,
            height: frame.naturalHeight,
            x: 0,
            y: 0
        }

        if (this.objectFit === 'cover') {
            let scale
            if (frameAspect > canvasAspect) {
                scale = this.height / frame.naturalHeight
            } else {
                scale = this.width / frame.naturalWidth
            }

            draw.width = frame.naturalWidth * scale
            draw.height = frame.naturalHeight * scale
            draw.x = (this.width - draw.width) / 2
            draw.y = (this.height - draw.height) / 2
        } else {
            let scale
            if (frameAspect > canvasAspect) {
                scale = this.width / frame.naturalWidth
            } else {
                scale = this.height / frame.naturalHeight
            }

            draw.width = frame.naturalWidth * scale
            draw.height = frame.naturalHeight * scale
            draw.x = (this.width - draw.width) / 2
            draw.y = (this.height - draw.height) / 2
        }

        const state = {
            framesIsLoaded: this.framesIsLoaded,
            isLoaded: this.isLoaded,
            activeFrame: this.activeFrame,
            totalFrames: this.totalFrames,
            totalQualityLevels: this.totalQualityLevels,
            currentQualityLevel: this.currentQualityLevel,
            isStepByStep: this.isStepByStep,
            objectFit: this.objectFit,
            context: this.context,
            parent: this.parent,
            canvas: this.canvas,
            width: this.width,
            height: this.height,
            ratio: this.ratio,
            isRenderActive: this.isRenderActive,
            isNthStepLoaded: this.isNthStepLoaded // Pass flag if every nth is loaded
        }

        this.onBeforeDraw && this.onBeforeDraw(state)
        this.context.drawImage(frame, draw.x, draw.y, draw.width, draw.height)
        this.onAfterDraw && this.onAfterDraw(state)
    }
}


export default Canvas
