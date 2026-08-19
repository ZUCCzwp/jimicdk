import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart } from "@phosphor-icons/react";
import { api } from "@/api/client";
import { PLAN_LABEL, type PlanType, type ShopCatalogResp, type ShopProduct } from "@/api/types";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import { guestCheckoutErrorKey, normalizeClaim, validateGuestCheckout } from "@/lib/guestCheckout";
import { addToCart, getCart, onCartChange } from "@/lib/storage";
import { Alert, Button, Chip, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function planLabel(planType: string): string {
  return PLAN_LABEL[planType as PlanType] ?? planType;
}

function persistCheckout(orderNo: string, claim: string) {
  sessionStorage.setItem("jimicdk.checkout", JSON.stringify({ orderNo, claim }));
}

function cartQtyFor(productId: number): number {
  return getCart().find((item) => item.productId === productId)?.quantity ?? 0;
}

export function ShopProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, te } = useI18n();
  const { user, session, applyAuth } = useUser();
  const guest = !user;
  const [catalog, setCatalog] = useState<ShopCatalogResp | null>(null);
  const [qty, setQty] = useState(1);
  const [email, setEmail] = useState("");
  const [claim, setClaim] = useState("");
  const [busy, setBusy] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cartTick, setCartTick] = useState(0);

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

  useEffect(() => onCartChange(() => setCartTick((n) => n + 1)), []);

  useEffect(() => {
    setQty(1);
    setNotice(null);
    setError(null);
  }, [slug]);

  const product = useMemo(() => {
    const key = slug?.trim();
    if (!key || !catalog) return null;
    return catalog.products.find((p) => p.slug === key) ?? null;
  }, [catalog, slug]);

  const maxQty = product ? Math.min(5, Math.max(product.stock, 0)) : 1;
  const out = !product || product.stock < 1;
  const inCartQty = useMemo(
    () => (product ? cartQtyFor(product.id) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cartTick refreshes after cart mutations
    [product, cartTick],
  );
  const cartRemaining = product ? Math.max(0, Math.min(5, product.stock) - inCartQty) : 0;

  useEffect(() => {
    if (qty > maxQty) setQty(Math.max(1, maxQty));
  }, [maxQty, qty]);

  async function buyNow(item: ShopProduct, quantity: number) {
    setBusy("buy");
    setError(null);
    setNotice(null);
    if (guest) {
      const invalid = validateGuestCheckout({ email, claim });
      if (invalid) {
        setError(t(guestCheckoutErrorKey(invalid)));
        setBusy(null);
        return;
      }
    }
    try {
      const res = await api.shopCheckout([{ productId: item.id, quantity }], {
        email: email.trim() || undefined,
        claim: guest ? normalizeClaim(claim) : undefined,
      });
      persistCheckout(res.order_no, res.claim);
      window.location.assign(res.checkout_url);
    } catch (err) {
      setError(te(err, "shop.checkoutFailed"));
      setBusy(null);
    }
  }

  function addToCartAndNotify(item: ShopProduct, quantity: number) {
    setError(null);
    const result = addToCart(item.id, quantity, item.stock);
    if (!result.ok) {
      setNotice(null);
      if (result.remaining < 1) {
        setError(t("shop.cartStockFull", { n: result.stock, inCart: result.inCart }));
      } else {
        setError(
          t("shop.cartStockExceed", {
            n: result.stock,
            remaining: result.remaining,
            inCart: result.inCart,
          }),
        );
      }
      return;
    }
    setNotice(t("shop.added"));
  }

  if (!catalog && !error) {
    return (
      <section className="grid place-items-center py-24">
        <Spinner size="lg" />
      </section>
    );
  }

  if (catalog && !product) {
    return (
      <section className="grid gap-6">
        <Link className="button button--ghost inline-flex w-fit items-center gap-2" to="/shop">
          <ArrowLeft size={18} weight="bold" />
          {t("shop.back")}
        </Link>
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t("shop.notFound")}</Alert.Description>
          </Alert.Content>
        </Alert>
      </section>
    );
  }

  if (!product) return null;

  return (
    <section className="grid gap-8">
      <Link className="button button--ghost inline-flex w-fit items-center gap-2" to="/shop">
        <ArrowLeft size={18} weight="bold" />
        {t("shop.back")}
      </Link>

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
            <Alert.Description>
              {notice}{" "}
              <Link className="font-semibold text-[color:var(--accent)]" to="/cart">
                {t("nav.cart")}
              </Link>
            </Alert.Description>
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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <Surface className="overflow-hidden rounded-3xl p-0 md:p-0">
          {product.cover_url ? (
            <img alt="" className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:min-h-[28rem]" src={product.cover_url} />
          ) : (
            <div className="shop-product-card__cover-placeholder aspect-[4/3] w-full lg:min-h-[28rem]" />
          )}
        </Surface>

        <Surface className="rounded-3xl p-6 md:p-9">
          <p className="text-sm font-medium text-muted">{planLabel(product.plan_type)}</p>
          {product.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <Chip key={tag} size="sm" variant="soft">
                  {tag}
                </Chip>
              ))}
            </div>
          ) : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">{product.description}</p>
          <p className="mt-8 text-4xl font-semibold tracking-tight">{usd(product.price_cents)}</p>
          <p className="mt-2 text-sm text-muted">{out ? t("shop.outOfStock") : t("shop.stock", { n: product.stock })}</p>

          <div className="mt-8 flex items-center gap-3">
            <span className="text-sm font-medium text-muted">{t("shop.qty")}</span>
            <Button
              isIconOnly
              isDisabled={qty <= 1 || out}
              size="lg"
              type="button"
              variant="ghost"
              onPress={() => setQty((n) => Math.max(1, n - 1))}
            >
              <Minus size={16} weight="bold" />
            </Button>
            <span className="min-w-8 text-center text-lg font-medium">{qty}</span>
            <Button
              isIconOnly
              isDisabled={qty >= maxQty || out}
              size="lg"
              type="button"
              variant="ghost"
              onPress={() => setQty((n) => Math.min(maxQty, n + 1))}
            >
              <Plus size={16} weight="bold" />
            </Button>
          </div>

          {guest ? (
            <>
              <p className="mt-6 text-sm text-muted">{t("shop.needGuestFields")}</p>
              <TextField className="mt-4" fullWidth name="email" value={email} onChange={setEmail}>
                <Label>{t("shop.email")}</Label>
                <Input inputMode="email" type="email" variant="secondary" />
              </TextField>
              <p className="mt-2 text-sm text-muted">{t("shop.emailHint")}</p>
              <TextField className="mt-4" fullWidth name="claim" value={claim} onChange={setClaim}>
                <Label>{t("shop.claim")}</Label>
                <Input autoComplete="off" variant="secondary" />
              </TextField>
              <p className="mt-2 text-sm text-muted">{t("shop.claimHint")}</p>
            </>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              isDisabled={out || cartRemaining < 1}
              isPending={busy === "cart"}
              size="lg"
              type="button"
              variant="secondary"
              onPress={() => {
                setBusy("cart");
                addToCartAndNotify(product, qty);
                setBusy(null);
              }}
            >
              <ShoppingCart size={18} weight="bold" />
              {t("shop.addCart")}
            </Button>
            <Button
              className="flex-1"
              isDisabled={out || !catalog?.stripe_on}
              isPending={busy === "buy"}
              size="lg"
              onPress={() => void buyNow(product, qty)}
            >
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? t("shop.buying") : t("shop.buyNow")}
                </>
              )}
            </Button>
          </div>
        </Surface>
      </div>
    </section>
  );
}
