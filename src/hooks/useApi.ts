import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import { isTerminal } from "@/api/types";
import type { AnnouncementResp, NotificationResp, QueueStatusResp, TaskView } from "@/api/types";
import { useI18n } from "@/i18n";
import { getOrders, removeOrder, replaceOrder, upsertOrder, type StoredOrder } from "@/lib/storage";

export function useAnnouncement() {
  const [data, setData] = useState<AnnouncementResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .announcement()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

export function useNotifications() {
  const [data, setData] = useState<NotificationResp | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .notifications()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

const QUEUE_POLL_MS = 3000;

function applyQueueStatus(
  parsed: QueueStatusResp,
  setData: (value: QueueStatusResp) => void,
) {
  if (typeof parsed.pending_count === "number") {
    setData(parsed);
  }
}

export function useQueue() {
  const [data, setData] = useState<QueueStatusResp | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let source: EventSource | null = null;

    const fetchStatus = () =>
      api
        .queueStatus()
        .then((next) => {
          if (!cancelled) applyQueueStatus(next, setData);
        })
        .catch(() => {});

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      stopPolling();
      pollTimer = setInterval(fetchStatus, QUEUE_POLL_MS);
    };

    void fetchStatus();
    startPolling();

    source = new EventSource(api.queueEventsUrl());

    const onEvent = (ev: MessageEvent<string>) => {
      if (!ev.data || ev.data === "{}") return;
      try {
        applyQueueStatus(JSON.parse(ev.data) as QueueStatusResp, setData);
        if (!cancelled) setLive(true);
      } catch {
        // ignore keep-alive / malformed frames
      }
    };

    source.addEventListener("queue_status", onEvent);
    source.addEventListener("status", onEvent);
    source.onmessage = onEvent;

    source.onopen = () => {
      if (!cancelled) setLive(true);
    };

    source.onerror = () => {
      if (!cancelled) setLive(false);
    };

    return () => {
      cancelled = true;
      stopPolling();
      source?.close();
    };
  }, []);

  return { data, live };
}

export function useOrders() {
  const [orders, setOrders] = useState<StoredOrder[]>(() => getOrders());

  const track = useCallback((cdkCode: string, taskId?: string) => {
    setOrders(upsertOrder({ cdkCode, taskId, addedAt: new Date().toISOString() }));
  }, []);

  const trackMany = useCallback((codes: string[]) => {
    let next = getOrders();
    const now = new Date().toISOString();
    for (const cdkCode of codes) {
      next = upsertOrder({ cdkCode, addedAt: now });
    }
    setOrders(next);
  }, []);

  const drop = useCallback((cdkCode: string) => {
    setOrders(removeOrder(cdkCode));
  }, []);

  const replace = useCallback((oldCode: string, newCode: string) => {
    setOrders(replaceOrder(oldCode, newCode));
  }, []);

  return { orders, track, trackMany, drop, replace };
}

export function useTaskPoll(codes: string[]) {
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { te } = useI18n();
  const key = codes.join(",");
  const tasksRef = useRef<TaskView[]>([]);

  useEffect(() => {
    const list = key.length === 0 ? [] : key.split(",");
    if (list.length === 0) {
      tasksRef.current = [];
      setTasks([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;

    const apply = (incoming: TaskView[]) => {
      const keep = new Set(list);
      const map = new Map(
        tasksRef.current.filter((item) => keep.has(item.cdk_code)).map((item) => [item.cdk_code, item]),
      );
      for (const item of incoming) {
        map.set(item.cdk_code, item);
      }
      const next = list.map((code) => map.get(code)).filter((item): item is TaskView => Boolean(item));
      tasksRef.current = next;
      setTasks(next);
    };

    const load = async (pollCodes: string[]) => {
      if (pollCodes.length === 0) return;
      try {
        const res = await api.lookupTasks(pollCodes);
        if (!cancelled) {
          apply(res.tasks);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(te(err, "orders.queryFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const openCodes = () =>
      list.filter((code) => {
        const current = tasksRef.current.find((item) => item.cdk_code === code);
        return !current || !isTerminal(current.task_status);
      });

    setLoading(true);
    void load(list).then(() => {
      if (cancelled) return;
      const pending = openCodes();
      if (pending.length === 0) return;
      timer = window.setInterval(() => {
        const next = openCodes();
        if (next.length === 0) {
          if (timer) window.clearInterval(timer);
          timer = undefined;
          return;
        }
        void load(next);
      }, 5500);
    });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [key, te]);

  return { tasks, error, loading };
}
