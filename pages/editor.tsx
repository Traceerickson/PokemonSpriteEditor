import { useRouter } from 'next/router'
import { useEffect } from 'react'
import axios from 'axios'
import { useSpriteStore } from '@/contexts/sprite-store'

export default function Editor() {
  const { query } = useRouter()
  const { replaceStore, setCurrentSpriteType, setCurrentFrame } = useSpriteStore()

  useEffect(() => {
    if (query.projectId) {
      axios.get(`/api/projects/${query.projectId}`)
        .then(res => {
          const { spriteData } = res.data
          replaceStore(spriteData)
          setCurrentSpriteType('front')
          setCurrentFrame(0)
        })
    }
  }, [query.projectId, replaceStore, setCurrentSpriteType, setCurrentFrame])

  return (
    <div></div>
  )
}
