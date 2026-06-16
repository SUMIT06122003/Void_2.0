import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { policyPages, products as fallbackProducts } from "./data/storeData";
import AboutPage from "./pages/AboutPage";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import InfoPage from "./pages/InfoPage";
import ProductPage from "./pages/ProductPage";
import ShopPage from "./pages/ShopPage";
import BagPage from "./pages/BagPage";
import { buildStorefrontCategories, buildStorefrontProducts } from "./utils/catalog";
import { getCurrentPath } from "./utils/routing";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(getCurrentPath);
  const [isHeaderLifted, setIsHeaderLifted] = useState(false);
  const [authToken, setAuthToken] = useState(
    () => window.localStorage.getItem("voidAuthToken") || ""
  );
  const [authUser, setAuthUser] = useState(null);
  const [sessionError, setSessionError] = useState("");
  const [isSessionReady, setIsSessionReady] = useState(() => !window.localStorage.getItem("voidAuthToken"));
  const [storefrontCatalog, setStorefrontCatalog] = useState(() => ({
    products: [],
    categories: []
  }));

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getCurrentPath());
      setBagOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load storefront catalog.");
        }

        const catalog = data.catalog || {};
        const products = buildStorefrontProducts(catalog.products, fallbackProducts);
        const categories = buildStorefrontCategories(catalog.categories, products);

        if (isMounted) {
          setStorefrontCatalog({ products, categories });
        }
      } catch {
        if (isMounted) {
          setStorefrontCatalog({
            products: [],
            categories: []
          });
        }
      }
    }

    loadCatalog();
    window.addEventListener("void:catalog-updated", loadCatalog);

    return () => {
      isMounted = false;
      window.removeEventListener("void:catalog-updated", loadCatalog);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderLifted(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!authToken) {
        setAuthUser(null);
        setSessionError("");
        setIsSessionReady(true);
        return;
      }

      setIsSessionReady(false);
      setSessionError("");

      try {
        const user = await fetchAuthUser(authToken);
        if (isMounted) {
          setAuthUser(user);
          setIsSessionReady(true);
        }
      } catch {
        if (isMounted) {
          window.localStorage.removeItem("voidAuthToken");
          setAuthToken("");
          setAuthUser(null);
          setSessionError("Session expired. Please login again.");
          setIsSessionReady(true);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const handleLogout = () => {
    window.localStorage.removeItem("voidAuthToken");
    setAuthToken("");
    setAuthUser(null);
    setSessionError("");
    setIsSessionReady(true);
    setBagOpen(false);
    window.location.hash = "#/login";
  };

  const handleRequireLogin = () => {
    setBagOpen(false);
    window.location.hash = "#/login";
  };

  const [cartPulse, setCartPulse] = useState(0);

  useEffect(() => {
    const onAdded = (e) => {
      setCartPulse((n) => n + 1);
      const msg = e?.detail?.product ? `Added ${e.detail.product} to cart` : "Added to cart";
      try {
        window.dispatchEvent(new CustomEvent("void:toast", { detail: { msg } }));
      } catch {
        // ignore
      }
    };
    window.addEventListener("void:add-to-bag", onAdded);
    return () => window.removeEventListener("void:add-to-bag", onAdded);
  }, []);

  const [toastMsg, setToastMsg] = useState("");
  const [toastTick, setToastTick] = useState(0);


  useEffect(() => {
    const onToast = (e) => {
      const msg = e?.detail?.msg || "Added to cart";
      setToastMsg(String(msg));
      const el = document.querySelector(".site-shell");
      if (el) {
        el.classList.remove("is-toast-visible");
        // next frame so animation can restart
        requestAnimationFrame(() => el.classList.add("is-toast-visible"));
      }
      setToastTick((t) => t + 1);

      // auto-hide
      window.setTimeout(() => {
        setToastMsg("");
      }, 1300);
    };

    window.addEventListener("void:toast", onToast);
    return () => window.removeEventListener("void:toast", onToast);
  }, []);

  return (
    <div className={`site-shell ${toastMsg ? "is-toast-visible" : ""}`}>
      <div className="void-toast" aria-live="polite" key={toastTick}>
        {toastMsg}
      </div>
      <Header
        categories={storefrontCatalog.categories}
          currentPath={currentPath}
          isAdmin={Boolean(authUser?.isAdmin)}
          isLoggedIn={Boolean(authToken)}
          isSessionReady={isSessionReady}
        isHeaderLifted={isHeaderLifted}
        menuOpen={menuOpen}
        onLogout={handleLogout}
        onOpenBag={() => {
          setMenuOpen(false);
          setBagOpen(true);
        }}
        setMenuOpen={setMenuOpen}
        cartPulse={cartPulse}
        products={storefrontCatalog.products}
      />
      <div className={`mobile-bag-backdrop ${bagOpen ? "is-open" : ""}`} onClick={() => setBagOpen(false)} role="presentation" />
      <aside className={`mobile-bag-drawer ${bagOpen ? "is-open" : ""}`} aria-label="Shopping bag" aria-hidden={!bagOpen}>
        {bagOpen ? (
          <BagPage
            isDrawer
            authToken={authToken}
            isLoggedIn={Boolean(authToken)}
            products={storefrontCatalog.products}
            onClose={() => setBagOpen(false)}
            onRequireLogin={handleRequireLogin}
          />
        ) : null}
      </aside>
      <main>
        <Page
          authToken={authToken}
          currentPath={currentPath}
          isLoggedIn={Boolean(authToken)}
          isAdmin={Boolean(authUser?.isAdmin)}
          sessionError={sessionError}
          products={storefrontCatalog.products}
          categories={storefrontCatalog.categories}
          onAuthSuccess={async (token, user) => {
            window.localStorage.setItem("voidAuthToken", token);
            setIsSessionReady(false);
            setSessionError("");
            setAuthToken(token);
            setAuthUser(user || null);
            try {
              const freshUser = await fetchAuthUser(token);
              setAuthUser(freshUser);
              setIsSessionReady(true);
              return freshUser;
            } catch {
              setSessionError("Could not refresh session. Please reload and try again.");
              setIsSessionReady(true);
              return user || null;
            }
          }}
          onLogout={handleLogout}
          onRequireLogin={handleRequireLogin}
        />
      </main>
      <Footer />
    </div>
  );
}

async function fetchAuthUser(token) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  const response = await fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    },
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to load session.");
  }

  return data.user || null;
}

function Page({ authToken, categories, currentPath, isAdmin, isLoggedIn, isSessionReady, onAuthSuccess, onLogout, onRequireLogin, products, sessionError }) {
  if (currentPath === "/login") {
    if (isLoggedIn) {
      window.location.hash = "#/account";
      return <AccountPage authToken={authToken} currentPath="/account" onDemoLogout={onLogout} />;
    }

    return <AuthPage mode="login" onAuthSuccess={onAuthSuccess} />;
  }

  if (currentPath === "/register") {
    if (isLoggedIn) {
      window.location.hash = "#/account";
      return <AccountPage authToken={authToken} currentPath="/account" onDemoLogout={onLogout} />;
    }

    return <AuthPage mode="register" onAuthSuccess={onAuthSuccess} />;
  }

  if (currentPath.startsWith("/account")) {
    if (!isLoggedIn) {
      window.location.hash = "#/login";
      return <AuthPage mode="login" onAuthSuccess={onAuthSuccess} />;
    }

    return <AccountPage authToken={authToken} currentPath={currentPath} onDemoLogout={onLogout} />;
  }

  if (currentPath.startsWith("/admin")) {
    if (!isLoggedIn) {
      window.location.hash = "#/login";
      return <AuthPage mode="login" onAuthSuccess={onAuthSuccess} />;
    }

    if (!isSessionReady) {
      return <section className="page-section">Checking admin access...</section>;
    }

    if (sessionError) {
      return (
        <section className="page-section">
          <div className="admin-notice is-error">{sessionError}</div>
        </section>
      );
    }

    if (!isAdmin) {
      return (
        <section className="page-section">
          <div className="admin-notice is-error">Admin access required.</div>
          <button
            type="button"
            className="primary-link dark-link"
            onClick={() => {
              window.location.hash = "#/account";
            }}
          >
            Go to Account
          </button>
        </section>
      );
    }

    return <AdminPage authToken={authToken} />;
  }

  if (currentPath === "/about") {
    return <AboutPage />;
  }

  if (policyPages[currentPath]) {
    return <InfoPage page={policyPages[currentPath]} />;
  }

  if (currentPath.startsWith("/product/")) {
    return <ProductPage currentPath={currentPath} products={products} />;
  }

  if (currentPath.startsWith("/shop")) {
    return <ShopPage categories={categories} currentPath={currentPath} products={products} />;
  }

  if (currentPath === "/bag") {
    // eslint-disable-next-line global-require
    // Use static import to avoid `require` in bundler/lint environments.
    return <BagPage authToken={authToken} isLoggedIn={isLoggedIn} products={products} onRequireLogin={onRequireLogin} />;
  }

  return <HomePage />;
}


export default App;
