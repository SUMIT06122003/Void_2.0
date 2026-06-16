export const categoryToSlug = (category) =>
  String(category || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const productToSlug = (product) =>
  categoryToSlug(product?.slug || product?.name || product?.id || "product");

export function buildStorefrontProducts(catalogProducts = [], fallbackProducts = []) {
  const fallbackByName = new Map(fallbackProducts.map((product) => [normalizeKey(product.name), product]));
  const fallbackByCategory = new Map(fallbackProducts.map((product) => [normalizeKey(product.category), product]));
  const adminProducts = Array.isArray(catalogProducts) ? catalogProducts : [];

  if (!adminProducts.length) {
    return [];
  }

  return adminProducts
    .filter((product) => String(product.status || "Published").toLowerCase() === "published")
    .map((product) => {
      const fallback = fallbackByName.get(normalizeKey(product.name)) || fallbackByCategory.get(normalizeKey(product.category)) || {};
      const image = product.image || fallback.image || "";
      const gallery = normalizeGallery(product.gallery, image || fallback.image, fallback.gallery);
      const colors = splitList(product.colors);
      const sizes = splitList(product.sizes);
      const variants = {
        ...(colors.length ? { color: colors } : {}),
        ...(sizes.length ? { size: sizes } : {})
      };

      return {
        ...fallback,
        ...product,
        image,
        gallery,
        badge: product.badge || fallback.badge || "VOID",
        compareAt: product.compareAt || fallback.compareAt || "",
        rating: product.rating || fallback.rating || "",
        description: product.description || fallback.description || "",
        specialisation: product.specialisation || product.specialization || fallback.specialisation || "",
        variants: Object.keys(variants).length ? variants : fallback.variants || {},
        specs: splitList(product.specs).length ? splitList(product.specs) : fallback.specs || []
      };
    });
}

export function buildStorefrontCategories(catalogCategories = [], storefrontProducts = []) {
  const categories = Array.isArray(catalogCategories) ? catalogCategories : [];
  const visibleCategories = categories
    .filter((category) => ["visible", "published", "active"].includes(String(category.status || "Visible").toLowerCase()))
    .map((category) => category.name)
    .filter(Boolean);
  const productCategories = storefrontProducts.map((product) => product.category).filter(Boolean);

  return Array.from(new Set([...visibleCategories, ...productCategories]));
}

function normalizeGallery(value, image, fallbackGallery = []) {
  const fromValue = Array.isArray(value) ? value : splitList(value);
  const gallery = [...fromValue];

  if (image && !gallery.includes(image)) {
    gallery.unshift(image);
  }

  if (!gallery.length && Array.isArray(fallbackGallery)) {
    gallery.push(...fallbackGallery);
  }

  return gallery.filter(Boolean);
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase();
}
