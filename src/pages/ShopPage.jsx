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
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  // Keep chip state in sync with route changes.

  useEffect(() => {
    setActiveCategory(requestedCategory || null);
  }, [requestedCategory]);

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    const activeSlug = categoryToSlug(activeCategory);
    return products.filter((product) => {
      const productCategorySlug = categoryToSlug(product.category);
      const productNameSlug = categoryToSlug(product.name);
      return product.category === activeCategory || productCategorySlug === activeSlug || productNameSlug === activeSlug;
    });
  }, [activeCategory, products]);

  const title = activeCategory ? activeCategory : "VOID Core";
  const heroProducts = filteredProducts.length ? filteredProducts : products;
  const visibleHeroProducts = heroProducts.slice(0, 3);
  const activeHeroIndex = heroSlideIndex % Math.max(visibleHeroProducts.length, 1);
  const heroProduct = visibleHeroProducts[activeHeroIndex] || heroProducts[0];
  const heroDetails = activeCategory
    ? heroProduct?.specs || []
    : heroProducts.map((product) => `${product.category}: ${product.name}`);

  useEffect(() => {
    setHeroSlideIndex(0);
  }, [activeCategory, heroProducts.length]);

  useEffect(() => {
    if (visibleHeroProducts.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setHeroSlideIndex((index) => (index + 1) % visibleHeroProducts.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [visibleHeroProducts.length]);

  return (
    <section className={`page-section shop-page ${activeCategory ? "is-category-view" : "is-all-view"}`}>
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
          {visibleHeroProducts.map((product, index) => (
            <a
              className={`shop-hero-product-card ${index === activeHeroIndex ? "is-active" : ""}`}
              href={`#/shop/${categoryToSlug(product.category)}`}
              key={product.name}
            >
              <img src={product.gallery?.[0] || product.image} alt={product.name} />
              <span>{product.category}</span>
              <strong>{product.name}</strong>
            </a>
          ))}
          <article>
            <span>{activeCategory ? heroProduct?.badge || "VOID" : "VOID KIT"}</span>
            <strong>{activeCategory ? heroProduct?.name || title : "All Products"}</strong>
            <small>{activeCategory ? heroProduct?.price || "Performance essentials" : "Complete performance range"}</small>
            {heroDetails.length ? (
              <ul>
                {heroDetails.slice(0, 3).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
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
