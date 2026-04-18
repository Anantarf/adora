import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type BatchUploadProgressProps = {
  isProcessing: boolean;
  progress: number;
};

export function BatchUploadProgress({ isProcessing, progress }: BatchUploadProgressProps) {
  if (!isProcessing) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Progress value={progress} className="h-2" />
      <div className="flex items-center justify-center gap-2 text-primary">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs font-medium">Sedang memproses {progress}%</span>
      </div>
    </div>
  );
}
