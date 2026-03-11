import { FileQuestion } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <FileQuestion className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <p className="text-foreground font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
