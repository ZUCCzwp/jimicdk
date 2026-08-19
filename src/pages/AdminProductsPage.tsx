import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Image, Package, Plus, Storefront, Trash, UploadSimple } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { ApiError, PLAN_LABEL, type AdminShopCategory, type AdminShopProduct, type PlanType } from "@/api/types";
import { useI18n } from "@/i18n";
import {
  Alert,
  Button,
  Chip,
  Input,
  Label,
  Spinner,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

const PLANS: PlanType[] = ["plus", "5x", "20x"];

type FormState = {
  id: number;
  category_id: number;
  slug: string;
  cover_url: string;
  name_zh: string;
  name_en: string;
  description_zh: string;
  description_en: string;
  tags: string;
  plan_type: PlanType;
  price: string;
  stock: string;
  sort: string;
  enabled: boolean;
};

function emptyForm(categoryId = 0): FormState {
  return {
    id: 0,
    category_id: categoryId,
    slug: "",
    cover_url: "",
    name_zh: "",
    name_en: "",
    description_zh: "",
    description_en: "",
    tags: "",
    plan_type: "plus",
    price: "",
    stock: "0",
    sort: "0",
    enabled: true,
  };
}

function formFromProduct(p: AdminShopProduct): FormState {
  return {
    id: p.id,
    category_id: p.category_id,
    slug: p.slug,
    cover_url: p.cover_url,
    name_zh: p.name_zh,
    name_en: p.name_en,
    description_zh: p.description_zh,
    description_en: p.description_en,
    tags: (p.tags ?? []).join(", "),
    plan_type: p.plan_type as PlanType,
    price: (p.price_cents / 100).toFixed(2),
    stock: String(p.stock),
    sort: String(p.sort),
    enabled: p.enabled,
  };
}

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminProductsPage() {
  const navigate = useNavigate();
  const { t, te } = useI18n();
  const [categories, setCategories] = useState<AdminShopCategory[]>([]);
  const [products, setProducts] = useState<AdminShopProduct[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [busy, setBusy] = useState<"load" | "save" | "delete" | "upload" | null>("load");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const categoryName = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of categories) map.set(c.id, c.name_zh);
    return map;
  }, [categories]);

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
      setProducts(data.products);
      setForm((prev) => {
        if (prev.id > 0) return prev;
        const first = data.categories[0]?.id ?? 0;
        return prev.category_id ? prev : { ...prev, category_id: first };
      });
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
    setForm(emptyForm(categories[0]?.id ?? 0));
  }

  function startEdit(product: AdminShopProduct) {
    setNotice(null);
    setError(null);
    setForm(formFromProduct(product));
  }

  function payloadFromForm() {
    const price = Number.parseFloat(form.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("invalid price");
    }
    const stock = Number.parseInt(form.stock, 10);
    const sort = Number.parseInt(form.sort, 10);
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    return {
      category_id: form.category_id,
      slug: form.slug.trim(),
      cover_url: form.cover_url.trim(),
      name_zh: form.name_zh.trim(),
      name_en: form.name_en.trim(),
      description_zh: form.description_zh.trim(),
      description_en: form.description_en.trim(),
      tags,
      plan_type: form.plan_type,
      price_cents: Math.round(price * 100),
      currency: "usd",
      stock: Number.isFinite(stock) ? stock : 0,
      sort: Number.isFinite(sort) ? sort : 0,
      enabled: form.enabled,
    };
  }

  async function onSave() {
    if (!form.name_zh.trim()) {
      setError(t("admin.products.titleZh"));
      return;
    }
    if (!form.category_id) {
      setError(t("admin.products.category"));
      return;
    }
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      const body = payloadFromForm();
      const saved =
        form.id > 0
          ? await api.adminShopUpdateProduct(form.id, body)
          : await api.adminShopCreateProduct(body);
      setNotice(t("admin.products.saved"));
      setForm(formFromProduct(saved));
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
      await api.adminShopDeleteProduct(form.id);
      setNotice(t("admin.products.deleted"));
      startCreate();
      await reload();
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
    }
  }

  async function onUploadCover(file: File) {
    setBusy("upload");
    setError(null);
    try {
      const { url } = await api.adminShopUpload(file);
      setField("cover_url", url);
      setNotice(t("admin.products.uploaded"));
    } catch (err) {
      if (guard(err)) return;
      setError(te(err, "api.failed"));
    } finally {
      setBusy(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  return (
    <section className="grid gap-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("admin.products.title")}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{t("admin.products.lead")}</p>
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
              <Storefront size={28} weight="bold" />
              <h2 className="text-xl font-semibold">{t("admin.products.title")}</h2>
            </div>
            <Button size="lg" type="button" variant="secondary" onPress={startCreate}>
              <Plus size={18} weight="bold" />
              {t("admin.products.add")}
            </Button>
          </div>

          {busy === "load" && !products.length ? (
            <Spinner className="mt-8" size="lg" />
          ) : !products.length ? (
            <p className="mt-6 text-sm text-muted">{t("admin.products.empty")}</p>
          ) : (
            <ul className="mt-5 grid gap-2">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      form.id === product.id ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10" : "border-border/80"
                    }`}
                    type="button"
                    onClick={() => startEdit(product)}
                  >
                    {product.cover_url ? (
                      <img
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover"
                        src={product.cover_url}
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
                        <Package size={22} weight="bold" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{product.name_zh}</p>
                      <p className="mt-1 text-xs text-muted">
                        {categoryName.get(product.category_id) ?? product.slug} · {usd(product.price_cents)} ·{" "}
                        {PLAN_LABEL[product.plan_type as PlanType] ?? product.plan_type}
                      </p>
                    </div>
                    <Chip size="sm" variant={product.enabled ? "soft" : "secondary"}>
                      {product.enabled ? t("admin.products.status.on") : t("admin.products.status.off")}
                    </Chip>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-semibold">
            {form.id > 0 ? t("admin.products.edit") : t("admin.products.add")}
          </h2>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-3">
              <TextField fullWidth name="cover" value={form.cover_url} onChange={(v) => setField("cover_url", v)}>
                <Label>{t("admin.products.cover")}</Label>
                <Input variant="secondary" />
              </TextField>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={coverInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onUploadCover(file);
                  }}
                />
                <Button
                  isPending={busy === "upload"}
                  size="lg"
                  type="button"
                  variant="secondary"
                  onPress={() => coverInputRef.current?.click()}
                >
                  <UploadSimple size={18} weight="bold" />
                  {t("admin.products.uploadCover")}
                </Button>
                <p className="text-sm text-muted">{t("admin.products.coverHint")}</p>
              </div>
            </div>
            {form.cover_url && (
              <img alt="" className="h-36 w-full rounded-2xl object-cover" src={form.cover_url} />
            )}

            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="grid min-w-[12rem] flex-1 gap-2">
                <span className="text-sm font-medium">{t("admin.products.category")}</span>
                <select
                  className="h-11 rounded-xl border border-border/80 bg-transparent px-3 text-base"
                  value={form.category_id || ""}
                  onChange={(e) => setField("category_id", Number(e.target.value))}
                >
                  <option disabled value="">
                    {t("admin.products.category")}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name_zh}
                    </option>
                  ))}
                </select>
              </label>
              <Link className="button button--ghost text-base" to="/admin/categories">
                <Image size={18} weight="bold" />
                {t("admin.products.manageCategories")}
              </Link>
            </div>

            <TextField fullWidth name="nameZh" value={form.name_zh} onChange={(v) => setField("name_zh", v)}>
              <Label>{t("admin.products.titleZh")}</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField fullWidth name="nameEn" value={form.name_en} onChange={(v) => setField("name_en", v)}>
              <Label>{t("admin.products.titleEn")}</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField fullWidth name="slug" value={form.slug} onChange={(v) => setField("slug", v)}>
              <Label>{t("admin.products.slug")}</Label>
              <Input variant="secondary" />
            </TextField>
            <p className="-mt-2 text-sm text-muted">{t("admin.products.slugHint")}</p>

            <div className="grid gap-4 md:grid-cols-3">
              <TextField fullWidth name="price" value={form.price} onChange={(v) => setField("price", v)}>
                <Label>{t("admin.products.price")}</Label>
                <Input inputMode="decimal" variant="secondary" />
              </TextField>
              <TextField fullWidth name="stock" value={form.stock} onChange={(v) => setField("stock", v)}>
                <Label>{t("admin.products.stock")}</Label>
                <Input inputMode="numeric" variant="secondary" />
              </TextField>
              <TextField fullWidth name="sort" value={form.sort} onChange={(v) => setField("sort", v)}>
                <Label>{t("admin.products.sort")}</Label>
                <Input inputMode="numeric" variant="secondary" />
              </TextField>
            </div>
            <p className="-mt-2 text-sm text-muted">{t("admin.products.stockHint")}</p>

            <label className="grid gap-2">
              <span className="text-sm font-medium">{t("admin.products.plan")}</span>
              <select
                className="h-11 rounded-xl border border-border/80 bg-transparent px-3 text-base"
                value={form.plan_type}
                onChange={(e) => setField("plan_type", e.target.value as PlanType)}
              >
                {PLANS.map((plan) => (
                  <option key={plan} value={plan}>
                    {PLAN_LABEL[plan]}
                  </option>
                ))}
              </select>
            </label>

            <TextField fullWidth name="tags" value={form.tags} onChange={(v) => setField("tags", v)}>
              <Label>{t("admin.products.tags")}</Label>
              <Input variant="secondary" />
            </TextField>
            <p className="-mt-2 text-sm text-muted">{t("admin.products.tagsHint")}</p>

            <TextField fullWidth name="descZh" value={form.description_zh} onChange={(v) => setField("description_zh", v)}>
              <Label>{t("admin.products.descriptionZh")}</Label>
              <TextArea variant="secondary" />
            </TextField>
            <TextField fullWidth name="descEn" value={form.description_en} onChange={(v) => setField("description_en", v)}>
              <Label>{t("admin.products.descriptionEn")}</Label>
              <TextArea variant="secondary" />
            </TextField>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                checked={form.enabled}
                className="size-4 accent-[color:var(--accent)]"
                type="checkbox"
                onChange={(e) => setField("enabled", e.target.checked)}
              />
              {t("admin.products.enabled")}
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button isPending={busy === "save"} size="lg" onPress={() => void onSave()}>
              {busy === "save" ? t("admin.products.saving") : t("admin.products.save")}
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
                {t("admin.products.delete")}
              </Button>
            )}
          </div>
        </Surface>
      </div>
    </section>
  );
}
