import { formatDuration } from '@devtime/shared'

interface ProjectData {
  name: string
  seconds: number
}

interface ProjectListProps {
  data: ProjectData[]
}

export function ProjectList({ data }: ProjectListProps) {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold mb-5">Top Projects</h3>
      <div className="flex flex-col gap-4" data-testid="by-project">
        {data.length === 0 ? (
          <div className="text-center text-text-secondary">No project data</div>
        ) : (
          data.map((project, i) => (
            <div key={i} className="flex justify-between items-center" data-testid={`project-${project.name}`}>
              <div className="flex items-center gap-2 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                {project.name}
              </div>
              <div className="text-sm font-medium text-accent-blue">{formatDuration(project.seconds)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
