'use client'
import { useEffect, useState } from 'react'

/** Returns true only after the component mounts on the client.
 *  Use to avoid SSR/localStorage hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])
  return mounted
}
