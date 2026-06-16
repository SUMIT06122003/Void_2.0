const CART_KEY = "voidCartDraft";

export function readCartDraft() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeCartDraft(next) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function getCartCount() {
  return readCartDraft().length;
}

export function clearCartDraft() {
  try {
    window.localStorage.removeItem(CART_KEY);
  } catch {
    // ignore
  }
}

