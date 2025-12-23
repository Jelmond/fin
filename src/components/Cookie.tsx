'use client'

import dynamic from "next/dynamic"
import { useAssetsLoader } from "@/layouts/AssetsLoaderLayout/AssetsLoaderLayout"

const CookieConsent = dynamic(() => import("react-cookie-consent"), { ssr: false })

export const Cookie = () => {
    const { fullyLoaded } = useAssetsLoader()
    return (
        <CookieConsent
            buttonText="Close"
            cookieName="newProjectCookie"
            disableStyles={true}
            buttonClasses={'cookieButton'}
            containerClasses={'cookieContainer' + (fullyLoaded ? ' visible' : '')}
            contentClasses={'cookieContent'}
            expires={180}
        >
            <h5>Cookies!</h5>
            <p>Hi, by continuing to use this website, you consent to the use of cookies. For more information please refer to our  
                <a href='#' aria-label='Go to Privacy Policy' rel='noreferrer' target='_blank'>
                    Privacy Policy
                </a>
            </p>
        </CookieConsent>
    )
}