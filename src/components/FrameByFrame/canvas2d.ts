//@ts-nocheck

import { getElementCoords, IgetElementCoords } from './coords'

class Canvas2d {
    parent
    canvas
    context
    width      = null
    height     = null
    ratio      = null
    rendering  = []
    resizing   = []
    isRenderActive     = false

    constructor(parent, canvas) {
        this.parent = parent
        this.canvas = canvas
        this.context = this.canvas.getContext('2d')
        if (!this.parent || !this.canvas) {
            console.warn(`canvas2d: No needed dom found`)
            this.stopRender()
            return
        }
        this.startRender()
        this.resize()

        this.resize = this.resize.bind(this)
        window.addEventListener('resize', this.resize)
    }

    toResize(cb) {
        this.resizing.push(cb)
    }

    stopRender() {
        this.isRenderActive = false
    }

    startRender() {
        this.isRenderActive = true
    }

    toRender(cb) {
        this.rendering.push(cb)
    }

    resize() {
        const parentCoords = getElementCoords(this.parent)
        const needResize = this.width !== parentCoords.width || this.height !== parentCoords.height
        if (needResize) {
            this.ratio = window.devicePixelRatio

            this.width = parentCoords.width
            this.height = parentCoords.height

            this.canvas.width = this.width * this.ratio
            this.canvas.height = this.height * this.ratio
            this.context.scale(this.ratio, this.ratio)

            this.resizing.forEach(f => f())
        }
    }

    render(time) {
        if (!this.isRenderActive) { return }
        if (!this.parent || !this.canvas || !this.context) { return }
        this.rendering.forEach(f => f(time))
    }

    destroy() {
        window.removeEventListener('resize', this.resize)
        this.stopRender()
    }
}

export default Canvas2d