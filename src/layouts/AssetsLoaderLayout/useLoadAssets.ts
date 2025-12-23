import React from "react";

interface Params {
    images?: string[]
    videos?: string[]
    path?: string
}
export const useLoadAssets = (
    { 
        images,
        videos, 
        path
    }: Params = { images: [], videos: [], path: '/' },
    callback?: () => void,
): [boolean, number, string] => {
    const [loading, setLoading] = React.useState(true)
    const [progress, setProgress] = React.useState(0)
    const [currentFile, setCurrentFile] = React.useState("")
    const mounted = React.useRef(false)
    React.useEffect(() => {
        if (mounted.current) { return }
        mounted.current = true

        callback && callback()

        const assets = [...(images || []), /*...fonts,*/ ...(videos || [])];

        const loadAssets = async () => {
            const assetPromises = assets.map(
                (asset, index) =>
                    new Promise((resolve, reject) => {
                        setCurrentFile(asset);
                        setProgress((index / assets.length) * 100);
        
                        let element;
        
                        if (images?.includes(asset)) {
                            element = new Image();
                            element.src = `${path || '/'}${asset}`;
                        } else /* if (videos.includes(asset)) */ {
                            element = document.createElement("video");
                            element.src = `${path || '/'}${asset}`;
                            element.oncanplaythrough = resolve;
                            element.onerror = reject;
                        }
        
                        element.onload = resolve;
                        element.onerror = reject;
                    })
            );
        
            await Promise.all(assetPromises);
            setProgress(100);
            setLoading(false);
        }
        loadAssets()
    }, [])

    return [loading, progress, currentFile]
}