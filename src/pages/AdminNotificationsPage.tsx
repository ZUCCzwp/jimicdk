import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n";
import {
  Alert,
  Button,
  Card,
  Spinner,
  Surface,
  TextArea,
  TextField,
  Label,
} from "@heroui/react";

export function AdminNotificationsPage() {
  const { t, te } = useI18n();

  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState<"load" | "save" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBusy("load");
    setError(null);
    setNotice(null);
    api
      .notifications()
      .then((n) => {
        if (cancelled) return;
        setEnabled(!!n.enabled);
        setContent(n.content ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(te(err, "api.failed"));
      })
      .finally(() => {
        if (cancelled) return;
        setBusy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [te]);

  async function onSave() {
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const res = await api.adminUpdateNotifications({ enabled, content });
      setEnabled(res.enabled);
      setContent(res.content);
      setNotice(t("admin.notifications.saved"));
    } catch (err) {
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("admin.notifications.title")}</h1>
      <p className="mt-4 max-w-[56ch] text-base leading-relaxed text-muted md:text-lg">{t("admin.notifications.lead")}</p>

      {error && (
        <Alert className="mt-6" status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {notice && (
        <Alert className="mt-6" status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Surface className="mt-10 rounded-3xl p-6 md:p-9">
        {busy === "load" ? (
          <div className="grid place-items-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="p-4" variant="flat">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{t("admin.notifications.enabledLabel")}</p>
                  <p className="mt-1 text-sm">{enabled ? t("admin.notifications.enabledYes") : t("admin.notifications.enabledNo")}</p>
                </div>
                <Button
                  size="lg"
                  variant={enabled ? "secondary" : "ghost"}
                  isDisabled={busy === "save"}
                  onPress={() => setEnabled((v) => !v)}
                >
                  {enabled ? t("admin.notifications.disable") : t("admin.notifications.enable")}
                </Button>
              </div>
            </Card>

            <TextField fullWidth name="notification-content" value={content} onChange={setContent}>
              <Label>{t("admin.notifications.contentLabel")}</Label>
              <TextArea
                className="min-h-32 font-mono text-sm"
                rows={6}
                spellCheck={false}
                variant="secondary"
                isDisabled={busy === "save"}
              />
            </TextField>

            <div className="flex items-center gap-3">
              <Button size="lg" isPending={busy === "save"} onPress={() => void onSave()}>
                {busy === "save" ? <Spinner color="current" size="sm" /> : null}
                {t("admin.notifications.save")}
              </Button>
            </div>
          </div>
        )}
      </Surface>
    </section>
  );
}

