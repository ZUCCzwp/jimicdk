import { PLAN_LABEL } from "@/api/types";
import type { TaskView } from "@/api/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/i18n";
import { Card } from "@heroui/react";

export function TaskPanel({
  task,
  empty,
}: {
  task: TaskView | null;
  empty?: string;
}) {
  const { t, tb } = useI18n();

  if (!task) {
    return (
      <Card className="h-full" variant="secondary">
        <Card.Header>
          <Card.Title>{t("task.title")}</Card.Title>
          <Card.Description>{empty ?? t("task.emptyDefault")}</Card.Description>
        </Card.Header>
      </Card>
    );
  }

  return (
    <Card className="h-full" variant="tertiary">
      <Card.Header className="flex-row items-start justify-between gap-3">
        <div>
          <Card.Title>{t("task.title")}</Card.Title>
          <Card.Description className="font-mono">{task.task_id}</Card.Description>
        </div>
        <StatusBadge status={task.task_status} />
      </Card.Header>
      <Card.Content className="space-y-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          <div>
            <dt className="text-muted">{t("task.plan")}</dt>
            <dd className="mt-1">{PLAN_LABEL[task.plan_type] ?? task.plan_type}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("task.account")}</dt>
            <dd className="mt-1 truncate">{task.account_email}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("task.created")}</dt>
            <dd className="mt-1">{task.created_at}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("task.updated")}</dt>
            <dd className="mt-1">{task.updated_at}</dd>
          </div>
        </dl>

        {task.task_status === "failed" && (
          <p className="text-sm text-danger">
            {task.failure_reason ? `${tb(task.failure_reason)} ` : ""}
            {t("task.restored")}
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
