import { useEffect, useMemo, useState } from "react";
import { clearCartDraft, readCartDraft } from "../utils/cart";
import { products as fallbackProducts } from "../data/storeData";

function BagPage({
  authToken = "",
  isDrawer = false,
  isLoggedIn = false,
  onClose,
  onRequireLogin,
  products = fallbackProducts
}) {
  const [items, setItems] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerError, setCustomerError] = useState("");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    phone: "",
    address: "",
    paymentMethod: "demo_card"
  });

  useEffect(() => {
    setItems(readCartDraft());
  }, [isDrawer]);

  useEffect(() => {
    if (!checkoutOpen || !authToken) return undefined;

    let isMounted = true;

    async function loadCustomer() {
      setCustomerLoading(true);
      setCustomerError("");

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile details.");
        }

        if (isMounted) {
          const user = data.user || null;
          const addresses = Array.isArray(user?.addresses) ? user.addresses : [];
          setCustomer(user);
          setSelectedAddressIndex(0);
          setUseNewAddress(!addresses.length);
          setCheckoutForm((form) => ({
            ...form,
            name: user?.name || form.name,
            phone: formatMobileForInput(user?.mobile) || form.phone,
            address: addresses.length ? "" : form.address
          }));
        }
      } catch (loadError) {
        if (isMounted) {
          setCustomerError(loadError.message || "Unable to load profile details.");
        }
      } finally {
        if (isMounted) {
          setCustomerLoading(false);
        }
      }
    }

    loadCustomer();

    return () => {
      isMounted = false;
    };
  }, [authToken, checkoutOpen]);

  const productByName = useMemo(() => {
    const map = new Map();
    for (const p of products) map.set(p.name, p);
    return map;
  }, [products]);

  const totalCount = items.length;

  const handleRefresh = () => {
    setItems(readCartDraft());
  };

  const handleClear = () => {
    clearCartDraft();
    setItems([]);
  };

  const openCheckout = () => {
    if (!isLoggedIn) {
      try {
        window.dispatchEvent(new CustomEvent("void:toast", { detail: { msg: "Login to checkout" } }));
      } catch {
        // ignore
      }
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        window.location.hash = "#/login";
      }
      return;
    }

    setCheckoutDone(false);
    setConfirmedOrderId("");
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (paymentProcessing) return;
    setCheckoutOpen(false);
  };

  const demoPay = async () => {
    if (paymentProcessing) return;

    const savedAddresses = Array.isArray(customer?.addresses) ? customer.addresses : [];
    const selectedAddress = savedAddresses[selectedAddressIndex];
    const shippingAddress = useNewAddress ? checkoutForm.address : formatAddress(selectedAddress);

    // minimal validation for demo
    if (!checkoutForm.name.trim() || !checkoutForm.phone.trim() || !shippingAddress.trim()) {
      try {
        window.dispatchEvent(new CustomEvent("void:toast", { detail: { msg: "Please add shipping details" } }));
      } catch {
        // ignore
      }
      return;
    }

    setPaymentProcessing(true);

    await new Promise((r) => window.setTimeout(r, 1200));

    try {
      const orderItems = items.map((entry) => {
        const product = productByName.get(entry.product);
        return {
          product: entry.product,
          name: product?.name || entry.product,
          price: product?.price || "",
          image: product?.image || "",
          selections: entry.selections || {}
        };
      });
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: orderItems,
          total: getOrderTotal(orderItems),
          customer: {
            name: checkoutForm.name,
            phone: checkoutForm.phone
          },
          shippingAddress,
          paymentMethod: checkoutForm.paymentMethod
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save order.");
      }

      clearCartDraft();
      setItems([]);
      setCustomer(data.user || customer);
      setConfirmedOrderId(data.order?.id || "");
      setCheckoutDone(true);
      setCheckoutForm((form) => ({ ...form, address: shippingAddress }));
      window.dispatchEvent(
        new CustomEvent("void:toast", { detail: { msg: `Payment successful: ${data.order?.id || "order saved"}` } })
      );
    } catch (orderError) {
      try {
        window.dispatchEvent(
          new CustomEvent("void:toast", { detail: { msg: orderError.message || "Unable to save order" } })
        );
      } catch {
        // ignore
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <section className={["page-section bag-page", isDrawer ? "is-drawer" : ""].join(" ")}>
      <div className="page-heading">
        <div>
          <span>Bag</span>
          <h1>Your items</h1>
          <p>Review the products you added. This demo stores bag items locally in your browser.</p>
        </div>
        {isDrawer ? (
          <button className="bag-drawer-close" type="button" onClick={onClose} aria-label="Close bag">
            Close
          </button>
        ) : null}
      </div>

      {totalCount ? (
        <div className="bag-layout">
          <div className="bag-items">
            {items.map((entry, idx) => {
              const product = productByName.get(entry.product);

              if (!product) {
                return (
                  <article className="bag-row" key={`${entry.product}-${idx}`}>
                    <div className="bag-thumb" />
                    <div className="bag-main">
                      <strong className="bag-product-name">Unknown product</strong>
                    </div>
                  </article>
                );
              }

              const handleRemoveAt = () => {
                const next = items.filter((_, i) => i !== idx);
                try {
                  window.localStorage.setItem("voidCartDraft", JSON.stringify(next));
                } catch {
                  // ignore
                }
                setItems(next);
              };

              return (
                <article className="bag-row" key={`${entry.product}-default-${idx}`}>
                  <button
                    type="button"
                    className="bag-remove-icon"
                    onClick={handleRemoveAt}
                    aria-label={`Remove ${product.name} from bag`}
                  >
                    ×
                  </button>
                  <div className="bag-thumb">
                    <img src={product.image} alt={`${product.name} in bag`} />
                  </div>

                  <div className="bag-main">
                    <strong className="bag-product-name">{product.name}</strong>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="bag-summary">
            <div className="summary-card">
              <span>Summary</span>
              <h2>{totalCount} item{totalCount === 1 ? "" : "s"}</h2>
              <p className="muted">Demo checkout simulates a payment success flow.</p>

              <div className="summary-actions">
                <button className="primary-link dark-link" type="button" onClick={openCheckout} disabled={!totalCount}>
                  Checkout
                </button>
                <button className="bag-secondary-action" type="button" onClick={handleClear}>
                  Clear bag
                </button>

                <button className="bag-secondary-action" type="button" onClick={handleRefresh}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="summary-gallery" aria-label="Bag products">
              <div className="summary-gallery-title">Products in your bag</div>
              <div className="summary-gallery-grid">
                {items.slice(0, 6).map((entry, idx) => {
                  const product = productByName.get(entry.product);
                  if (!product) return null;

                  return (
                    <div className="summary-gallery-item" key={`${entry.product}-g-${idx}`}>
                      <img src={product.image} alt={`${product.name} in bag`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <span>Bag is empty</span>
          <h3>Add items from the shop</h3>
          <p>Pick a product and tap “Add to Bag”.</p>
          <a className="primary-link dark-link" href="#/shop">
            Go to Shop
          </a>
        </div>
      )}
      {checkoutOpen ? (
        <div className="vp-modal-backdrop" role="presentation" onClick={closeCheckout}>
          <div
            className="vp-modal vp-checkout-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Checkout"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vp-modal-header">
              <div className="vp-modal-title">
                <span>Checkout</span>
                <h3>Demo payment</h3>
              </div>
              <button type="button" className="vp-close" onClick={closeCheckout} aria-label="Close">
                ✕
              </button>
            </div>

            {checkoutDone ? (
              <div className="vp-modal-body">
                <div className="vp-checkout-success">
                  <div className="vp-success-badge">Paid</div>
                  <h4>Order confirmed</h4>
                  <p className="vp-muted">
                    {confirmedOrderId
                      ? `A simulated gateway processed your payment successfully. Order ${confirmedOrderId} is saved.`
                      : "A simulated gateway processed your payment successfully."}
                  </p>
                  <a className="primary-link dark-link" href="#/account/order-status" onClick={closeCheckout}>
                    View order status
                  </a>
                  <a className="primary-link dark-link" href="#/shop" onClick={closeCheckout}>
                    Continue shopping
                  </a>
                </div>
              </div>
            ) : (
              <div className="vp-modal-body">
                <div className="vp-checkout-grid">
                  <div className="vp-checkout-form">
                    {customerLoading ? <div className="vp-checkout-notice">Loading profile details...</div> : null}
                    {customerError ? (
                      <div className="vp-checkout-notice is-error">{customerError}</div>
                    ) : null}

                    <div className="form-field">
                      <label>Name</label>
                      <input
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="form-field">
                      <label>Phone</label>
                      <input
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="10-digit mobile"
                      />
                    </div>

                    <AddressSelector
                      addresses={Array.isArray(customer?.addresses) ? customer.addresses : []}
                      selectedAddressIndex={selectedAddressIndex}
                      setSelectedAddressIndex={setSelectedAddressIndex}
                      setUseNewAddress={setUseNewAddress}
                      useNewAddress={useNewAddress}
                    />

                    {useNewAddress ? (
                      <div className="form-field">
                        <label>{Array.isArray(customer?.addresses) && customer.addresses.length ? "New Address" : "Address"}</label>
                        <input
                          value={checkoutForm.address}
                          onChange={(e) => setCheckoutForm((f) => ({ ...f, address: e.target.value }))}
                          placeholder="Delivery address"
                        />
                      </div>
                    ) : null}

                    <div className="vp-divider" />

                    <div className="vp-checkout-payment">
                      <div className="vp-checkout-section-title">Payment</div>
                      <div className="vp-radio-grid">
                        <button
                          type="button"
                          className={`vp-radio ${checkoutForm.paymentMethod === "demo_card" ? "is-active" : ""}`}
                          onClick={() => setCheckoutForm((f) => ({ ...f, paymentMethod: "demo_card" }))}
                        >
                          Demo Card
                        </button>
                      </div>
                      <p className="vp-muted">Press “Pay Now” to simulate a successful charge.</p>
                    </div>
                  </div>

                  <aside className="vp-checkout-summary">
                    <div className="vp-checkout-summary-title">Items</div>
                    <div className="vp-checkout-item-list">
                      {items.map((entry, idx) => {
                        const p = productByName.get(entry.product);
                        if (!p) return null;
                        const selections = entry?.selections || {};
                        const lines = Object.entries(selections)
                          .filter(([, v]) => v)
                          .map(([k, v]) => {
                            const label =
                              k === "color" ? "Color" : k === "size" ? "Size" : k === "pack" ? "Pack" : k;
                            return `${label}: ${v}`;
                          });
                        return (
                          <div className="vp-checkout-item" key={`${entry.product}-${idx}`}>
                            <div className="vp-checkout-item-name">{p.name}</div>
                            {lines.length ? <div className="vp-checkout-item-meta">{lines.join(" • ")}</div> : null}
                            <div className="vp-checkout-item-price">{p.price}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="vp-checkout-total">
                      <div className="vp-muted">Total items</div>
                      <div className="vp-total-strong">{totalCount}</div>
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {!checkoutDone ? (
              <div className="vp-modal-footer">
                <button
                  type="button"
                  className="primary-link dark-link"
                  onClick={demoPay}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? "Processing…" : "Pay Now"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AddressSelector({
  addresses,
  selectedAddressIndex,
  setSelectedAddressIndex,
  setUseNewAddress,
  useNewAddress
}) {
  if (!addresses.length) {
    return (
      <div className="vp-address-empty">
        <strong>No saved address</strong>
        <span>Add a delivery address to continue checkout.</span>
        <a href="#/account/add-address">Add address in profile</a>
      </div>
    );
  }

  return (
    <div className="vp-address-select">
      <div className="vp-checkout-section-title">Delivery Address</div>
      <div className="vp-address-grid">
        {addresses.map((address, index) => (
          <button
            type="button"
            className={`vp-address-card ${!useNewAddress && selectedAddressIndex === index ? "is-active" : ""}`}
            key={address.id || `${formatAddress(address)}-${index}`}
            onClick={() => {
              setSelectedAddressIndex(index);
              setUseNewAddress(false);
            }}
          >
            <strong>{address.label || address.name || `Address ${index + 1}`}</strong>
            <span>{formatAddress(address)}</span>
          </button>
        ))}
        <button
          type="button"
          className={`vp-address-card vp-address-add ${useNewAddress ? "is-active" : ""}`}
          onClick={() => setUseNewAddress(true)}
        >
          <strong>Add new address</strong>
          <span>Use another address for this order.</span>
        </button>
      </div>
    </div>
  );
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address;
  return (
    address.address ||
    address.value ||
    [
      address.fullAddress,
      address.line1,
      address.line2,
      address.city,
      address.district,
      address.state,
      address.pincode || address.zip
    ]
      .filter(Boolean)
      .join(", ")
  );
}

function formatMobileForInput(value) {
  const raw = String(value || "");
  return raw.replace(/^\+91/, "");
}

function getOrderTotal(items) {
  const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);

  if (!total) {
    return `${items.length} item${items.length === 1 ? "" : "s"}`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(total);
}

function parsePrice(value) {
  const amount = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export default BagPage;


