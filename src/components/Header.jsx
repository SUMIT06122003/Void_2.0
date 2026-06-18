import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Menu, Shield, ShoppingBag, User, UserPlus, X } from "lucide-react";
import { brandAssets, products as fallbackProducts, routes } from "../data/storeData";
import { categoryToSlug } from "../utils/catalog";
import { isActiveRoute } from "../utils/routing";

function BagButton({ onOpenBag }) {
  const [count, setCount] = useState(() => {
    try {
      const raw = window.localStorage.getItem("voidCartDraft");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "voidCartDraft") return;
      try {
        const raw = e.newValue;
        const arr = raw ? JSON.parse(raw) : [];
        setCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setCount(0);
      }
    };

    window.addEventListener("storage", onStorage);
    const id = window.setInterval(() => {
      // also update for same-tab clicks
      try {
        const raw = window.localStorage.getItem("voidCartDraft");
        const arr = raw ? JSON.parse(raw) : [];
        setCount(Array.isArray(arr) ? arr.length : 0);
      } catch {
        setCount(0);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
    };
  }, []);

  const handleBagClick = (event) => {
    event.preventDefault();
    onOpenBag();
  };

  return (
    <a className="bag-button ghost-icon" href="#/bag" aria-label="Shopping bag" onClick={handleBagClick}>
      <ShoppingBag size={18} />
      {count ? <span>{count}</span> : null}
    </a>
  );
}

function Header({
  categories = [],
  currentPath,
  isAdmin,
  isHeaderLifted,
  isLoggedIn,
  menuOpen,
  onLogout,
  onOpenBag,
  setMenuOpen,
  cartPulse,
  products = fallbackProducts,
  promoStrip = null
}) {
  const [shopByOpen, setShopByOpen] = useState(true);
  const categoryImages = new Map(
    products.flatMap((product) => [
      [product.category, product.image],
      [categoryToSlug(product.category), product.image],
      [categoryToSlug(product.name), product.image]
    ])
  );
  const menuCategories = (categories.length ? categories : Array.from(new Set(products.map((product) => product.category))))
    .filter(Boolean)
    .map((category) => ({
      label: category,
      image: categoryImages.get(category) || categoryImages.get(categoryToSlug(category)) || products[0]?.image || "",
      path: `/shop/${categoryToSlug(category)}`
    }));

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout();
  };
  const strip = promoStrip || {
    enabled: true,
    message: "First order 20% off",
    ctaLabel: "Shop Now ->",
    href: "#/shop"
  };
  const showPromoStrip = strip.enabled !== false;

  return (
    <header
      className={`site-header ${isHeaderLifted ? "is-lifted" : ""} ${menuOpen ? "is-menu-open" : ""} ${cartPulse ? "has-cart-pulse" : ""}`}
      key={cartPulse}
    >
      {showPromoStrip ? (
        <div className="void-promo-bar">
          <span>{strip.message || "First order 20% off"}</span>
          <a href={strip.href || "#/shop"}>{strip.ctaLabel || "Shop Now ->"}</a>
        </div>
      ) : null}
      <div className="primary-nav">
        <button
          className="icon-button mobile-only"
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={19} />
        </button>

        <a className="brand" href="#/" aria-label="VOID Activewear home">
          <img src={brandAssets.logo} alt="VOID" />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {routes.map((item) =>
            item.path === "/shop" ? (
              <div className="desktop-shop-menu" key={item.path}>
                <a
                  className={isActiveRoute(currentPath, item.path) ? "is-active" : ""}
                  href={`#${item.path}`}
                >
                  {item.label} <ChevronDown size={13} />
                </a>
                <div className="desktop-shop-dropdown" aria-label="Shop products">
                  <div className="desktop-shop-grid">
                    {menuCategories.map((category) => (
                      <a href={`#${category.path}`} key={category.label}>
                        <img src={category.image} alt="" />
                        <span>{category.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <a
                className={isActiveRoute(currentPath, item.path) ? "is-active" : ""}
                href={`#${item.path}`}
                key={item.path}
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="nav-actions">
          {isAdmin ? (
            <a className="icon-button ghost-icon admin-nav-link" href="#/admin" aria-label="Admin dashboard">
              <Shield size={18} />
              <span>Admin</span>
            </a>
          ) : null}
          {isLoggedIn ? (
            <>
              <a className="icon-button ghost-icon" href="#/account" aria-label="My account">
                <User size={18} />
              </a>
            </>
          ) : (
            <>
              <a className="icon-button ghost-icon" href="#/login" aria-label="Login">
                <User size={18} />
              </a>
              <a className="icon-button ghost-icon" href="#/register" aria-label="Register">
                <UserPlus size={18} />
              </a>
            </>
          )}
          <BagButton onOpenBag={onOpenBag} />

        </div>
      </div>

      <button
        className={`mobile-menu-backdrop ${menuOpen ? "is-open" : ""}`}
        type="button"
        aria-label="Close menu"
        onClick={() => setMenuOpen(false)}
      />

      <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
        <div className="mobile-menu-head">
          <a className="mobile-menu-brand" href="#/" aria-label="VOID Activewear home" onClick={() => setMenuOpen(false)}>
            <img src={brandAssets.logo} alt="VOID" />
          </a>
          <button
            className="icon-button mobile-menu-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <a
          className={isActiveRoute(currentPath, "/") ? "is-active" : ""}
          href="#/"
          onClick={() => setMenuOpen(false)}
        >
          Home
        </a>

        <div className={`mobile-shop-block ${shopByOpen ? "is-open" : ""}`}>
          <button
            aria-expanded={shopByOpen}
            className="mobile-menu-section-title"
            onClick={() => setShopByOpen((open) => !open)}
            type="button"
          >
            <span>Shop By</span>
            <ChevronUp size={21} />
          </button>
          {shopByOpen ? (
            <div className="mobile-category-grid">
              {menuCategories.map((category) => (
                <a href={`#${category.path}`} key={category.label} onClick={() => setMenuOpen(false)}>
                  <img src={category.image} alt="" />
                  <strong>{category.label}</strong>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {routes
          .filter((item) => item.path !== "/" && item.path !== "/shop")
          .map((item) => (
            <a
              className={isActiveRoute(currentPath, item.path) ? "is-active" : ""}
              href={`#${item.path}`}
              key={item.path}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}

        {isAdmin ? (
          <a
            className={isActiveRoute(currentPath, "/admin") ? "is-active" : ""}
            href="#/admin"
            onClick={() => setMenuOpen(false)}
          >
            Admin
          </a>
        ) : null}

        <a
          className={isActiveRoute(currentPath, "/account") ? "is-active" : ""}
          href="#/account"
          onClick={() => setMenuOpen(false)}
        >
          My Account
        </a>

        <button className="mobile-menu-action" disabled={!isLoggedIn} type="button" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}

export default Header;
