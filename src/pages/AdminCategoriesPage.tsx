import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, Trash } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { ApiError, type AdminShopCategory } from "@/api/types";
import { useI18n } from "@/i18n";
import { Alert, Button, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

type FormState = {
  id: number;
  slug: string;
  name_zh: string;
  name_en: string;
  sort: string;
};

function emptyForm(): FormState {
  return { id: 0, slug: "", name_zh: "", name_en: "", sort: "0" };
}

function formFromCategory(c: AdminShopCategory): FormState {
  return {
    id: c.id,
    slug: c.slug,
    name_zh: c.name_zh,
    name_en: c.name_en,
    sort: String(c.sort),
  };
}

export function AdminCategoriesPage() {
  const navigate = useNavigate();
  const { t, te } = useI18n();
  const [categories, setCategories] = useState<AdminShopCategory[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Map<number, number>>(() => new Map());
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [busy, setBusy] = useState<"load" | "save" | "delete" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.sort - b.sort || a.id - b.id),
    [categories],
  );

  const guard = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        navigate("/admin/login", { replace: true });
        return true;
      }
      return false;
    },
    [navigate],
  );

  const reload = useCallback(async () => {
    setBusy("load");
    setError(null);
    try {
      const data = await api.adminShopCatalog();
      setCategories(data.categories);
      const counts = new Map<number, number>();
      for (const p of data.products) {
        counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
      }
      setProductsByCategory(counts);
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }, [guard, te]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setNotice(null);
    setError(null);
    setForm(emptyForm());
  }

  function startEdit(category: AdminShopCategory) {
    setNotice(null);
    setError(null);
    setForm(formFromCategory(category));
  }

  function payloadFromForm() {
    const sort = Number.parseInt(form.sort, 10);
    return {
      slug: form.slug.trim(),
      name_zh: form.name_zh.trim(),
      name_en: form.name_en.trim(),
      sort: Number.isFinite(sort) ? sort : 0,
    };
  }

  async function onSave() {
    if (!form.name_zh.trim()) {
      setError(t("admin.categories.nameZh"));
      return;
    }
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const body = payloadFromForm();
      const saved =
        form.id > 0
          ? await api.adminShopUpdateCategory(form.id, body)
          : await api.adminShopCreateCategory(body);
      setNotice(t("admin.categories.saved"));
      setForm(formFromCategory(saved));
      await reload();
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (form.id < 1) return;
    setBusy("delete");
    setError(null);
    setNotice(null);
    try {
      await api.adminShopDeleteCategory(form.id);
      setNotice(t("admin.categories.deleted"));
      startCreate();
      await reload();
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("admin.categories.title")}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{t("admin.categories.lead")}</p>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Surface className="rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FolderOpen size={28} weight="bold" />
              <h2 className="text-xl font-semibold">{t("admin.categories.title")}</h2>
            </div>
            <Button size="lg" type="button" variant="secondary" onPress={startCreate}>
              <Plus size={18} weight="bold" />
              {t("admin.categories.add")}
            </Button>
          </div>

          {busy === "load" && !categories.length ? (
            <Spinner className="mt-8" size="lg" />
          ) : !categories.length ? (
            <p className="mt-6 text-sm text-muted">{t("admin.categories.empty")}</p>
          ) : (
            <ul className="mt-5 grid gap-2">
              {sorted.map((category) => (
                <li key={category.id}>
                  <button
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      form.id === category.id ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-border/80"
                    }`}
                    type="button"
                    onClick={() => startEdit(category)}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{category.name_zh}</p>
                      <p className="mt-1 text-xs text-muted">
                        {category.slug} · {t("admin.categories.productCount", { count: productsByCategory.get(category.id) ?? 0 })}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">#{category.sort}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold">
            {form.id > 0 ? t("admin.categories.edit") : t("admin.categories.add")}
          </h2>

          <div className="mt-5 grid gap-4">
            <TextField fullWidth name="nameZh" value={form.name_zh} onChange={(v) => setField("name_zh", v)}>
              <Label>{t("admin.categories.nameZh")}</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField fullWidth name="nameEn" value={form.name_en} onChange={(v) => setField("name_en", v)}>
              <Label>{t("admin.categories.nameEn")}</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField fullWidth name="slug" value={form.slug} onChange={(v) => setField("slug", v)}>
              <Label>{t("admin.categories.slug")}</Label>
              <Input variant="secondary" />
            </TextField>
            <p className="-mt-2 text-sm text-muted">{t("admin.categories.slugHint")}</p>
            <TextField fullWidth name="sort" value={form.sort} onChange={(v) => setField("sort", v)}>
              <Label>{t("admin.categories.sort")}</Label>
              <Input inputMode="numeric" variant="secondary" />
            </TextField>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button isPending={busy === "save"} size="lg" onPress={() => void onSave()}>
              {busy === "save" ? t("admin.categories.saving") : t("admin.categories.save")}
            </Button>
            {form.id > 0 && (
              <Button
                isPending={busy === "delete"}
                size="lg"
                type="button"
                variant="ghost"
                onPress={() => void onDelete()}
              >
                <Trash size={18} weight="bold" />
                {t("admin.categories.delete")}
              </Button>
            )}
          </div>
        </Surface>
      </div>
    </section>
  );
}
