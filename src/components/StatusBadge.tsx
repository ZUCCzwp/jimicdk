import type { TaskStatus } from "@/api/types";
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
  return (
    <Chip color={color(status)} size={size} variant="soft">
      {t(`status.${status}` as MsgKey)}
    </Chip>
  );
}
