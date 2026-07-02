import Link from "next/link";
import type { VideoProject } from "@/types/video";
import { statusLabels, objectiveLabels } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";
import { ProgressTimeline } from "@/components/ui/ProgressTimeline";
import { formatDate } from "@/lib/utils";

export function ProjectCard({ project }: { project: VideoProject }) {
  const status = statusLabels[project.status];

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group block rounded-2xl border border-hairline bg-ivory p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-bronze/30 hover:shadow-lifted"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-caps text-bronze">
            {objectiveLabels[project.objective]} · {project.duration} s
          </p>
          <h3 className="mt-1.5 truncate font-display text-lg text-coffee group-hover:text-bronze-deep">
            {project.name}
          </h3>
        </div>
        <Badge tone={status.tone} pulse={project.status === "rendering"}>
          {status.label}
        </Badge>
      </div>

      {project.status === "rendering" ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-warm-gray">
            <span>Rendu 4K en cours</span>
            <span className="font-medium text-bronze-deep">{project.renderProgress} %</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream" aria-hidden>
            <div
              className="h-full rounded-full bg-bronze transition-all duration-700"
              style={{ width: `${project.renderProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <ProgressTimeline status={project.status} className="mt-5" />
      )}

      <p className="mt-4 border-t border-hairline pt-3 text-xs text-warm-gray">
        Mis à jour le {formatDate(project.updatedAt)}
        {project.formats.length > 0 && <> · Formats : {project.formats.join(", ")}</>}
      </p>
    </Link>
  );
}
