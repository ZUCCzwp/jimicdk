import { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { useI18n } from "@/i18n";
import type { AdminReductionCodeResp } from "@/api/types";
import { Alert, Button, Card, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

function fromDateTimeLocal(v: string): string {
  // Backend accepts "2006-01-02T15:04" format; datetime-local already matches.
  return v;
}

export function AdminReductionCodePage() {
  const { te } = useI18n();
  const [busy, setBusy] = useState<"load" | "save" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("0");

  // Infinite => expires_at == "" in backend.
  const [infinite, setInfinite] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const payloadPreview = useMemo(() => {
    const cents = Math.round(Number.parseFloat(amount) * 100);
    return { amount_cents: cents };
  }, [amount]);

  async function reload() {
    setBusy("load");
    setError(null);
    setNotice(null);
    try {
      const res = await api.adminReductionCode();
      setEnabled(!!res.enabled);
      setCode(res.code ?? "");
      setAmount((res.amount_cents / 100).toFixed(2));

      if (res.expires_at) {
        setInfinite(false);
        setExpiresAt(toDateTimeLocal(res.expires_at));
      } else {
        setInfinite(true);
        setExpiresAt("");
      }
    } catch (err) {
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave() {
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const trimmedCode = code.trim();
      const price = Number.parseFloat(amount);
      if (!trimmedCode) {
        setError("请输入立减码");
        return;
      }
      if (!Number.isFinite(price) || price < 0) {
        setError("请输入正确的金额");
        return;
      }
      const amountCents = Math.round(price * 100);
      const body = {
        enabled,
        code: trimmedCode,
        amount_cents: amountCents,
        expires_at: infinite ? "" : fromDateTimeLocal(expiresAt),
      };
      const res: AdminReductionCodeResp = await api.adminUpdateReductionCode(body);
      setEnabled(!!res.enabled);
      setCode(res.code ?? "");
      setAmount((res.amount_cents / 100).toFixed(2));
      if (res.expires_at) {
        setInfinite(false);
        setExpiresAt(toDateTimeLocal(res.expires_at));
      } else {
        setInfinite(true);
        setExpiresAt("");
      }
      setNotice("已保存");
    } catch (err) {
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">立减码</h1>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
          用户端输入立减码后，将从订单金额中固定减免。
        </p>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {notice && (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <Surface className="mt-2 rounded-3xl p-6 md:p-9">
        {busy === "load" ? (
          <div className="grid place-items-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6">
            <Card className="p-4" variant="secondary">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">状态</p>
                  <p className="mt-1 text-sm">{enabled ? "已启用" : "已禁用"}</p>
                </div>
                <Button size="lg" variant={enabled ? "secondary" : "ghost"} onPress={() => setEnabled((v) => !v)} isDisabled={busy === "save"}>
                  {enabled ? "禁用" : "启用"}
                </Button>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField fullWidth name="reduction-code" value={code} onChange={setCode}>
                <Label>立减码</Label>
                <Input variant="secondary" disabled={busy === "save"} />
              </TextField>
              <TextField fullWidth name="reduction-amount" value={amount} onChange={setAmount}>
                <Label>减免金额（USD）</Label>
                <Input variant="secondary" disabled={busy === "save"} inputMode="decimal" />
              </TextField>
            </div>

            <Card className="p-4" variant="secondary">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">有效期</p>
                  <p className="mt-1 text-sm">{infinite ? "无限期" : "有截止时间"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="lg" variant={infinite ? "secondary" : "ghost"} onPress={() => setInfinite(true)} isDisabled={busy === "save"}>
                    无限期
                  </Button>
                  <Button size="lg" variant={!infinite ? "secondary" : "ghost"} onPress={() => setInfinite(false)} isDisabled={busy === "save"}>
                    有时效
                  </Button>
                </div>
              </div>

              {!infinite ? (
                <TextField
                  className="mt-4"
                  fullWidth
                  name="reduction-expires-at"
                  value={expiresAt}
                  onChange={setExpiresAt}
                >
                  <Label>截止时间</Label>
                  <Input type="datetime-local" variant="secondary" disabled={busy === "save"} />
                </TextField>
              ) : null}
            </Card>

            <div className="flex items-center gap-3">
              <Button size="lg" isPending={busy === "save"} onPress={() => void onSave()}>
                {busy === "save" ? <Spinner color="current" size="sm" /> : null}
                保存
              </Button>
              {enabled && payloadPreview.amount_cents > 0 ? (
                <span className="text-sm text-muted">减免：{(payloadPreview.amount_cents / 100).toFixed(2)} USD</span>
              ) : null}
            </div>
          </div>
        )}
      </Surface>
    </section>
  );
}

