import { useMemo } from "react"

export interface FramesProps {
    count: number
    baseUrl?: string | string[]
    fileName: string | string[]
    format?: string | string[]
    indexFunc?: (value: number) => string | number
}
export type FramesType = { frame: string }[] | { frame: string }[][]
export const getFrames = ({ count, baseUrl = '/', fileName, indexFunc = i => i+1, format = 'png' }: FramesProps): FramesType => {
    if (typeof baseUrl === 'object') {
        return [...new Array(baseUrl.length)].map((array, i) => {
            const FileName = typeof fileName === 'object' ? fileName[i] : fileName
            const Format = typeof format === 'object' ? format[i] : format
            const BaseUrl = typeof baseUrl === 'object' ? baseUrl[i] : format
            return [...new Array(count)].map((_, i) => {
                return {
                    frame: `${BaseUrl}${FileName}${indexFunc(i)}.${Format}`
                }
            })
        })
    } 

    return [...new Array(count)].map((_, i) => {
        return {
            frame: `${baseUrl}${fileName}${indexFunc(i)}.${format}`
        }
    })
}

export const useFrames = (props: FramesProps) => {
    return useMemo(() => getFrames(props), [props])
}

export const loadFirstFrame = (frame: string) => {
    const image = new Image()
    image.src = frame
}