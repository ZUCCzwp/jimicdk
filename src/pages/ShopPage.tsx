import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { PLAN_LABEL, type PlanType, type ShopCatalogResp } from "@/api/types";
import { useI18n } from "@/i18n";
import { Alert, Button, Chip, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function planLabel(planType: string): string {
  return PLAN_LABEL[planType as PlanType] ?? planType;
}

export function ShopPage() {
  const { t, te } = useI18n();
  const [catalog, setCatalog] = useState<ShopCatalogResp | null>(null);
  const [category, setCategory] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .shopCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) setError(te(err, "shop.loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [te]);

  const products = useMemo(() => {
    const list = catalog?.products ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((p) => {
      if (category !== "all" && p.category_id !== category) return false;
      if (!q) return true;
      return `${p.name} ${p.description} ${p.slug} ${p.plan_type}`.toLowerCase().includes(q);
    });
  }, [catalog, category, query]);

  return (
    <section className="grid gap-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("shop.title")}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">{t("shop.lead")}</p>
      </div>

      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {catalog && !catalog.stripe_on && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t("shop.stripeOff")}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <div className="max-w-md">
        <TextField fullWidth name="search" value={query} onChange={setQuery}>
          <Label>{t("shop.search")}</Label>
          <Input variant="secondary" />
        </TextField>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="lg" type="button" variant={category === "all" ? "secondary" : "ghost"} onPress={() => setCategory("all")}>
          {t("shop.all")}
        </Button>
        {(catalog?.categories ?? []).map((cat) => (
          <Button
            key={cat.id}
            size="lg"
            type="button"
            variant={category === cat.id ? "secondary" : "ghost"}
            onPress={() => setCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {!catalog ? (
        <Spinner size="lg" />
      ) : !products.length ? (
        <p className="text-muted">{t("shop.empty")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const out = product.stock < 1;
            return (
              <Link key={product.id} className="shop-product-card-link" to={`/shop/${product.slug}`}>
                <Surface className="shop-product-card flex h-full flex-col overflow-hidden rounded-3xl p-0 md:p-0">
                  {product.cover_url ? (
                    <img alt="" className="h-40 w-full object-cover" src={product.cover_url} />
                  ) : (
                    <div className="shop-product-card__cover-placeholder h-40 w-full" />
                  )}
                  <div className="flex flex-1 flex-col p-6 md:p-8">
                    <p className="text-sm font-medium text-muted">{planLabel(product.plan_type)}</p>
                    {product.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {product.tags.map((tag) => (
                          <Chip key={tag} size="sm" variant="soft">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    ) : null}
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h2>
                    <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{product.description}</p>
                    <p className="mt-6 text-3xl font-semibold tracking-tight">{usd(product.price_cents)}</p>
                    <p className="mt-2 text-sm text-muted">{out ? t("shop.outOfStock") : t("shop.stock", { n: product.stock })}</p>
                    <p className="mt-4 text-sm font-medium text-[color:var(--accent)]">{t("shop.viewDetail")}</p>
                  </div>
                </Surface>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
