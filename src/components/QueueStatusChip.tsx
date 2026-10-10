import { Chip } from "@heroui/react";
import { useQueue } from "@/hooks/useApi";
import { useI18n } from "@/i18n";

type QueueLight = "green" | "yellow" | "red";

function queueLight(count: number): QueueLight {
  if (count <= 0) return "green";
  if (count <= 5) return "yellow";
  return "red";
}

function QueueTrafficLight({
  level,
  live,
  loading,
}: {
  level: QueueLight | null;
  live: boolean;
  loading?: boolean;
}) {
  if (loading || !level) {
    return (
      <span className="queue-light queue-light--loading" aria-hidden>
        <span className="queue-light__dot queue-light__dot--red" />
        <span className="queue-light__dot queue-light__dot--yellow is-on" />
        <span className="queue-light__dot queue-light__dot--green" />
      </span>
    );
  }

  return (
    <span className={`queue-light ${live ? "queue-light--live" : ""}`} aria-hidden>
      <span className={`queue-light__dot queue-light__dot--red ${level === "red" ? "is-on" : ""}`} />
      <span className={`queue-light__dot queue-light__dot--yellow ${level === "yellow" ? "is-on" : ""}`} />
      <span className={`queue-light__dot queue-light__dot--green ${level === "green" ? "is-on" : ""}`} />
    </span>
  );
}

/** Isolated so queue SSE/poll updates do not re-render the whole AppShell. */
export function QueueStatusChip() {
  const { data: queue, live: queueLive } = useQueue();
  const { t } = useI18n();
  const queueLevel = queue ? queueLight(queue.pending_count) : null;
  const queueHint =
    queueLevel === "green"
      ? t("nav.queueIdle")
      : queueLevel === "yellow"
        ? t("nav.queueModerate")
        : queueLevel === "red"
          ? t("nav.queueBusy")
          : "";

  return (
    <Chip
      className="hidden xl:inline-flex shrink-0"
      size="lg"
      title={
        queue && queueLevel
          ? `${queueHint} · ${t("nav.queue", { count: queue.pending_count })}`
          : t("nav.queueLoading")
      }
      variant="soft"
    >
      <span className="flex items-center gap-2">
        <QueueTrafficLight level={queueLevel} live={queueLive} loading={!queue} />
        <span className="queue-count">
          {queue ? t("nav.queue", { count: queue.pending_count }) : t("nav.queueLoading")}
        </span>
      </span>
    </Chip>
  );
}
