import { useEffect, useMemo, useState } from "react";

import ProductGrid from "../components/ProductGrid";
import { products as fallbackProducts } from "../data/storeData";
import { categoryToSlug } from "../utils/catalog";

const slugToCategory = (slug, allCategories) => {
  const normalized = slug?.toLowerCase?.() || "";
  return allCategories.find((c) => categoryToSlug(c) === normalized) || null;
};

function ShopPage({ categories = [], currentPath, products = fallbackProducts }) {
  const allCategories = useMemo(
    () => (categories.length ? categories : Array.from(new Set(products.map((p) => p.category)))).filter(Boolean).sort(),
    [categories, products]
  );

  // currentPath examples:
  // - "/shop" => All
  // - "/shop/t-shirt" => filter to "T-Shirt" (via slug mapping)
  // When currentPath is exactly "/shop" the toolbar should show all products.
  const isShopRoot = currentPath === "/shop";
  const slugSegment = currentPath.startsWith("/shop/")
    ? currentPath.slice("/shop/".length)
    : "";

  const requestedCategory = isShopRoot
    ? null
    : slugToCategory(slugSegment, allCategories);

  const [activeCategory, setActiveCategory] = useState(
    requestedCategory || null
  );

  // Keep chip state in sync with route changes.

  useEffect(() => {
    setActiveCategory(requestedCategory || null);
  }, [requestedCategory]);

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const title = activeCategory ? activeCategory : "VOID Core";
  const heroProducts = filteredProducts.length ? filteredProducts : products;
  const heroProduct = heroProducts[0];

  return (
    <section className="page-section shop-page">
      <div className="shop-hero-panel">
        <div className="shop-hero-copy">
          <span>Shop</span>
          <h1>{title}</h1>
          <p>Build your VOID kit from performance essentials, daily training layers, and recovery-ready accessories.</p>
          <div className="shop-hero-meta">
            <strong>{filteredProducts.length}</strong>
            <span>{filteredProducts.length === 1 ? "Product" : "Products"} ready</span>
          </div>
        </div>
        <div className="shop-hero-gallery" aria-label="Featured category products">
          {heroProducts.slice(0, 3).map((product) => (
            <img src={product.gallery?.[0] || product.image} alt={product.name} key={product.name} />
          ))}
          <article>
            <span>{heroProduct?.badge || "VOID"}</span>
            <strong>{heroProduct?.name || "VOID Core"}</strong>
            <small>{heroProduct?.price || "Performance essentials"}</small>
          </article>
        </div>
      </div>

      <div className="shop-toolbar" role="navigation" aria-label="Shop categories">
        <button
          type="button"
          className={`shop-chip ${activeCategory === null ? "is-active" : ""}`}
          onClick={() => {
            setActiveCategory(null);
            window.location.hash = "#/shop";
          }}
        >
          All
        </button>

        {allCategories.map((category) => {
          const slug = categoryToSlug(category);
          const isActive = activeCategory === category;
          return (
            <a
              key={category}
              className={`shop-chip ${isActive ? "is-active" : ""}`}
              href={`#/shop/${slug}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </a>
          );
        })}
      </div>

      <ProductGrid products={filteredProducts} />
    </section>
  );
}

export default ShopPage;
