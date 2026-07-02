interface WorkflowStepProps {
  index: number;
  title: string;
  description: string;
}

export function WorkflowStep({ index, title, description }: WorkflowStepProps) {
  return (
    <li className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-ivory font-display text-sm text-bronze-deep shadow-soft">
          {index}
        </span>
        <span className="mt-2 w-px flex-1 bg-[rgba(154,106,58,0.18)]" aria-hidden />
      </div>
      <div className="pb-10">
        <h3 className="font-display text-lg text-coffee">{title}</h3>
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-warm-gray">
          {description}
        </p>
      </div>
    </li>
  );
}
