import type { TaskStatus } from "@/api/types";
import { isInProgress, isProcessingHot } from "@/api/types";
import { Chip } from "@heroui/react";
import { useI18n } from "@/i18n";
import type { MsgKey } from "@/i18n/messages";

function color(status: TaskStatus): "success" | "danger" | "warning" | "accent" {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "manual_review") return "warning";
  return "accent";
}

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: TaskStatus;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useI18n();
  const live = isInProgress(status);
  const hot = isProcessingHot(status);

  return (
    <Chip
      className={live ? `status-badge--live${hot ? " status-badge--hot" : ""}` : undefined}
      color={color(status)}
      size={size}
      variant="soft"
    >
      {live ? <span aria-hidden className="status-badge__pulse" /> : null}
      <Chip.Label>{t(`status.${status}` as MsgKey)}</Chip.Label>
    </Chip>
  );
}
