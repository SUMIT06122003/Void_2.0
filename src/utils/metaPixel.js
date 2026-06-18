/* global __META_PIXEL_ID__ */

const pixelId = String(__META_PIXEL_ID__ || "").trim();
const scriptId = "meta-pixel-script";
let isInitialized = false;
let lastPageViewKey = "";

export function initMetaPixel() {
  if (!pixelId || typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (!window.fbq) {
    const fbq = function fbq() {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };

    if (!window._fbq) {
      window._fbq = fbq;
    }

    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
  }

  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  if (!isInitialized) {
    window.fbq("init", pixelId);
    isInitialized = true;
  }

  return true;
}

export function trackPageView(path = getCurrentPageKey()) {
  if (!initMetaPixel()) return;

  const pageKey = String(path || getCurrentPageKey());
  if (pageKey === lastPageViewKey) return;

  lastPageViewKey = pageKey;
  window.fbq("track", "PageView");
}

export function trackViewContent(product) {
  trackStandardEvent("ViewContent", productPayload(product));
}

export function trackAddToCart(product) {
  trackStandardEvent("AddToCart", productPayload(product));
}

export function trackInitiateCheckout({ items = [], value = 0 } = {}) {
  trackStandardEvent("InitiateCheckout", cartPayload(items, value));
}

export function trackPurchase({ items = [], orderId = "", value = 0 } = {}) {
  trackStandardEvent("Purchase", {
    ...cartPayload(items, value),
    order_id: orderId || undefined
  });
}

function trackStandardEvent(eventName, payload = {}) {
  if (!initMetaPixel()) return;
  window.fbq("track", eventName, removeEmptyValues(payload));
}

function productPayload(product) {
  if (!product) return {};

  const value = parsePrice(product.price);
  return removeEmptyValues({
    content_ids: [product.id || product.sku || product.name],
    content_name: product.name,
    content_category: product.category,
    content_type: "product",
    currency: "INR",
    value: value || undefined
  });
}

function cartPayload(items, value) {
  const safeItems = Array.isArray(items) ? items : [];
  const totalValue = Number(value) || safeItems.reduce((sum, item) => sum + parsePrice(item.price), 0);

  return removeEmptyValues({
    content_ids: safeItems.map((item) => item.id || item.sku || item.product || item.name).filter(Boolean),
    content_name: safeItems.map((item) => item.name || item.product).filter(Boolean).join(", "),
    content_type: "product",
    contents: safeItems.map((item) => ({
      id: item.id || item.sku || item.product || item.name,
      quantity: item.quantity || 1,
      item_price: parsePrice(item.price) || undefined
    })),
    currency: "INR",
    num_items: safeItems.length,
    value: totalValue || undefined
  });
}

function removeEmptyValues(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && !value.length) return false;
      return true;
    })
  );
}

function getCurrentPageKey() {
  return `${window.location.pathname}${window.location.hash || ""}`;
}

function parsePrice(value) {
  const prices = String(value || "").match(/\d+(?:\.\d+)?/g);
  if (!prices?.length) return 0;

  return Number(prices[0]) || 0;
}
