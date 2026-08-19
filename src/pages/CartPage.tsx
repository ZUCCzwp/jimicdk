import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Storefront, Trash } from "@phosphor-icons/react";
import { api } from "@/api/client";
import type { ShopCatalogResp, ShopProduct, ShopReductionCodePreviewResp } from "@/api/types";
import { useUser } from "@/hooks/useUser";
import { useI18n } from "@/i18n";
import { guestCheckoutErrorKey, normalizeClaim, validateGuestCheckout } from "@/lib/guestCheckout";
import { clearCart, getCart, onCartChange, updateCartQty, type CartItem } from "@/lib/storage";
import { Alert, Button, Input, Label, Spinner, Surface, TextField } from "@heroui/react";

function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function persistCheckout(orderNo: string, claim: string) {
  sessionStorage.setItem("jimicdk.checkout", JSON.stringify({ orderNo, claim }));
}

export function CartPage() {
  const { t, te } = useI18n();
  const { user, session, applyAuth, refresh } = useUser();
  const guest = !user;
  const [catalog, setCatalog] = useState<ShopCatalogResp | null>(null);
  const [cart, setCartState] = useState<CartItem[]>(() => getCart());
  const [email, setEmail] = useState("");
  const [claim, setClaim] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPreview, setDiscountPreview] = useState<ShopReductionCodePreviewResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Refresh wallet balance alongside catalog so the deduction preview is accurate.
    const tasks: Promise<unknown>[] = [
      api
        .shopCatalog()
        .then((data) => {
          if (!cancelled) setCatalog(data);
        })
        .catch((err) => {
          if (!cancelled) setError(te(err, "shop.loadFailed"));
        }),
    ];
    if (!guest) {
      tasks.push(refresh().catch(() => {}));
    }
    void Promise.all(tasks);
    return () => {
      cancelled = true;
    };
  }, [te, guest, refresh]);

  useEffect(() => {
    return onCartChange(() => setCartState(getCart()));
  }, []);

  const byId = useMemo(() => {
    const map = new Map<number, ShopProduct>();
    for (const p of catalog?.products ?? []) map.set(p.id, p);
    return map;
  }, [catalog]);

  const total = cart.reduce((sum, item) => {
    const product = byId.get(item.productId);
    return sum + (product ? product.price_cents * item.quantity : 0);
  }, 0);
  const walletBalance = user?.wallet_cents ?? 0;

  const discountFinalTotal = discountPreview?.final_cents ?? total;
  const discountCents = discountPreview?.discount_cents ?? 0;

  const walletUsed = guest ? 0 : Math.min(walletBalance, discountFinalTotal);
  const stripeDue = guest ? discountFinalTotal : Math.max(0, discountFinalTotal - walletUsed);

  useEffect(() => {
    const code = discountCode.trim();
    if (!code) {
      setDiscountPreview(null);
      return;
    }

    let cancelled = false;
    const id = window.setTimeout(async () => {
      try {
        const res = await api.shopReductionCodePreview(total, code);
        if (cancelled) return;
        setDiscountPreview(res);
      } catch {
        if (cancelled) return;
        setDiscountPreview(null);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [discountCode, total]);

  async function payCart() {
    if (!cart.length) return;
    setBusy(true);
    setError(null);
    if (guest) {
      const invalid = validateGuestCheckout({ email, claim });
      if (invalid) {
        setError(t(guestCheckoutErrorKey(invalid)));
        setBusy(false);
        return;
      }
    }
    try {
      const res = await api.shopCheckout(
        cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        {
          email: email.trim() || undefined,
          claim: guest ? normalizeClaim(claim) : undefined,
          discountCode: discountCode.trim() || undefined,
        },
      );
      persistCheckout(res.order_no, res.claim);
      clearCart();
      // Wallet will only be deducted immediately when Stripe is not involved (wallet covers all).
      if (session && walletUsed > 0 && stripeDue <= 0) {
        applyAuth(session.token, session.expiresAt, {
          ...user!,
          wallet_cents: Math.max(0, walletBalance - walletUsed),
        });
      }
      window.location.assign(res.checkout_url);
    } catch (err) {
      setError(te(err, "shop.checkoutFailed"));
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-8">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("cart.title")}</h1>
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

      <Surface className="rounded-3xl p-6 md:p-9">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShoppingCart size={28} weight="bold" />
            <h2 className="text-xl font-semibold">{t("shop.cart")}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link className="button button--ghost inline-flex items-center gap-2" to="/shop">
              <Storefront size={18} weight="bold" />
              {t("cart.goShop")}
            </Link>
            {cart.length > 0 && (
              <Button size="lg" type="button" variant="ghost" onPress={() => setCartState(clearCart())}>
                {t("shop.cartClear")}
              </Button>
            )}
          </div>
        </div>

        {!cart.length ? (
          <div className="mt-8">
            <p className="text-sm text-muted">{t("cart.empty")}</p>
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-2">
              {cart.map((item) => {
                const product = byId.get(item.productId);
                return (
                  <li
                    key={item.productId}
                    className="flex flex-col gap-2 rounded-2xl border border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{product?.name ?? `#${item.productId}`}</p>
                      <p className="mt-1 text-sm text-muted">
                        {product ? usd(product.price_cents * item.quantity) : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        isIconOnly
                        size="lg"
                        type="button"
                        variant="ghost"
                        onPress={() => setCartState(updateCartQty(item.productId, item.quantity - 1, product?.stock))}
                      >
                        <Minus size={16} weight="bold" />
                      </Button>
                      <span className="min-w-6 text-center">{item.quantity}</span>
                      <Button
                        isIconOnly
                        isDisabled={
                          item.quantity >= 5 || (product != null && item.quantity >= product.stock)
                        }
                        size="lg"
                        type="button"
                        variant="ghost"
                        onPress={() =>
                          setCartState(updateCartQty(item.productId, item.quantity + 1, product?.stock))
                        }
                      >
                        <Plus size={16} weight="bold" />
                      </Button>
                      <Button
                        isIconOnly
                        size="lg"
                        type="button"
                        variant="ghost"
                        onPress={() => setCartState(updateCartQty(item.productId, 0, product?.stock))}
                      >
                        <Trash size={16} weight="bold" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {guest ? (
              <>
                <p className="mt-6 text-sm text-muted">{t("shop.needGuestFields")}</p>
                <TextField className="mt-4 max-w-md" fullWidth name="email" value={email} onChange={setEmail}>
                  <Label>{t("shop.email")}</Label>
                  <Input inputMode="email" type="email" variant="secondary" />
                </TextField>
                <p className="mt-2 text-sm text-muted">{t("shop.emailHint")}</p>
                <TextField className="mt-4 max-w-md" fullWidth name="claim" value={claim} onChange={setClaim}>
                  <Label>{t("shop.claim")}</Label>
                  <Input autoComplete="off" variant="secondary" />
                </TextField>
                <p className="mt-2 text-sm text-muted">{t("shop.claimHint")}</p>
              </>
            ) : null}

            <div className="mt-6 rounded-2xl border border-border/80 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">立减码</span>
                {discountCode.trim() ? (
                  discountPreview === null ? (
                    <span className="text-muted">校验中</span>
                  ) : discountPreview.valid ? (
                    <span className="font-medium text-accent">-{usd(discountCents)}</span>
                  ) : (
                    <span className="font-medium text-danger">无效或已过期</span>
                  )
                ) : (
                  <span className="text-muted">可选</span>
                )}
              </div>
              <Input
                className="mt-3"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="输入立减码"
                variant="secondary"
              />
              {discountCode.trim() && discountPreview && !discountPreview.valid ? (
                <p className="mt-2 text-xs text-muted">不生效</p>
              ) : null}
            </div>

            {!guest && walletBalance > 0 ? (
              <div className="mt-6 rounded-2xl border border-border/80 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{t("cart.walletBalance")}</span>
                  <span className="font-medium">{usd(walletBalance)}</span>
                </div>
                {walletUsed > 0 ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted">{t("cart.walletUsed")}</span>
                    <span className="font-medium text-accent">-{usd(walletUsed)}</span>
                  </div>
                ) : null}
                {stripeDue > 0 ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted">{t("cart.stripeDue")}</span>
                    <span className="font-medium">{usd(stripeDue)}</span>
                  </div>
                ) : (
                  <p className="mt-2 text-muted">{t("cart.walletCoversAll")}</p>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold">{usd(stripeDue > 0 ? stripeDue : discountFinalTotal)}</p>
                {!guest && walletUsed > 0 && stripeDue > 0 ? (
                  <p className="mt-1 text-sm text-muted">
                    {t("cart.totalWithWallet", { total: usd(discountFinalTotal), wallet: usd(walletUsed) })}
                  </p>
                ) : null}
              </div>
              <Button
                isDisabled={!catalog?.stripe_on && stripeDue > 0}
                isPending={busy}
                size="lg"
                onPress={() => void payCart()}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : <ShoppingCart size={18} weight="bold" />}
                    {isPending
                      ? t("shop.buying")
                      : stripeDue <= 0
                        ? t("cart.payWithWallet")
                        : walletUsed > 0
                          ? t("cart.payWithWalletAndStripe")
                          : t("shop.cartPay")}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </Surface>
    </section>
  );
}
