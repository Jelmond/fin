'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View as ViewImpl } from '@react-three/drei'
import { Three } from './Three'

const View = forwardRef(({ children, ...props }: any, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl 
          // @ts-expect-error
          track={localRef}
        >
          {children}
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
