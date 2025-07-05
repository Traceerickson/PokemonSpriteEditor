import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'

interface Project {
  _id: string
  name: string
  spriteData: any
  updatedAt: string
}

export default function ProjectsPage({ projects }: { projects: Project[] }) {
  const router = useRouter()
  return (
    <div>
      {projects.map(p => (
        <div key={p._id} onClick={() => router.push(`/editor?projectId=${p._id}`)}>
          {p.name}
        </div>
      ))}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/projects`)
  const projects = await res.json()
  return { props: { projects } }
}
