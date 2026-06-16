import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { accountItems, products, testimonials } from "../data/storeData";

const emptyAccountData = {
  orders: [],
  wishlist: [],
  addresses: [],
  rewardPoints: 0,
  notifications: [],
  recentlyViewed: [],
  returns: [],
  coupons: []
};

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];

const pageCopy = {
  dashboard: {
    eyebrow: "Dashboard",
    title: "Account overview",
    text: "Your real account activity, orders, rewards, and support details appear here."
  },
  profile: {
    eyebrow: "Profile",
    title: "Profile details",
    text: "Your saved VOID account details."
  },
  "saved-details": {
    eyebrow: "Profile",
    title: "Saved details",
    text: "Your current account information."
  },
  "reward-points": {
    eyebrow: "Rewards",
    title: "Reward points",
    text: "Track your VOID reward balance."
  },
  "order-status": {
    eyebrow: "Orders",
    title: "Order status",
    text: "All order statuses, tracking details, and order history in one place."
  },
  wishlist: {
    eyebrow: "Wishlist",
    title: "Wishlist",
    text: "Products saved to your wishlist."
  },
  "add-address": {
    eyebrow: "Address Book",
    title: "Add address",
    text: "Add or review delivery addresses connected to your account."
  },
  "returns-&-refunds": {
    eyebrow: "Returns",
    title: "Returns and refunds",
    text: "Your return and refund requests."
  },
  "coupons-&-rewards": {
    eyebrow: "Coupons",
    title: "Coupons and rewards",
    text: "Active coupons and reward offers."
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Notifications",
    text: "Account and order updates."
  },
  "recently-viewed-products": {
    eyebrow: "Recently viewed",
    title: "Recently viewed products",
    text: "Products you viewed recently."
  },
  "account-settings": {
    eyebrow: "Settings",
    title: "Account settings",
    text: "Account preferences and communication settings."
  },
  "security-settings": {
    eyebrow: "Security",
    title: "Security settings",
    text: "Password and login security controls."
  },
  "help-&-support": {
    eyebrow: "Support",
    title: "Help and support",
    text: "Contact VOID support for order, return, and product help."
  },
  logout: {
    eyebrow: "Logout",
    title: "Logout",
    text: "Use the button below to end this account session."
  }
};

const orderSlugAliases = new Set([
  "my-orders",
  "orders",
  "pending-orders",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "order-tracking"
]);

function AccountPage({ authToken, currentPath, onDemoLogout }) {
  const activeSlug = normalizeAccountSlug(currentPath.replace("/account", "").replace(/^\//, "") || "dashboard");
  const [account, setAccount] = useState({ user: null, ...emptyAccountData });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Unable to load account details.");
        }

        if (isMounted) {
          setAccount(normalizeAccountData(data.user));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load account details.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const handleAccountUpdate = (user) => {
    setAccount(normalizeAccountData(user));
  };

  return (
    <section className="page-section account-page">
      <div className="account-section">
        <AccountSidebar activeSlug={activeSlug} user={account.user} />
        <AccountPanel
          account={account}
          activeSlug={activeSlug}
          authToken={authToken}
          error={error}
          isLoading={isLoading}
          onAccountUpdate={handleAccountUpdate}
          onDemoLogout={onDemoLogout}
        />
      </div>
    </section>
  );
}

function AccountSidebar({ activeSlug, user }) {
  const displayName = user?.name || user?.mobile || "VOID member";

  return (
    <aside className="account-sidebar" aria-label="Account navigation">
      <div className="sidebar-heading">
        <span>My Account</span>
        <strong>{displayName}</strong>
      </div>
      <nav>
        {accountItems.map((item) => {
          const itemSlug = getSlug(item.label);
          const isActive = activeSlug === itemSlug || (itemSlug === "dashboard" && activeSlug === "dashboard");

          return (
            <div className="account-group" key={item.label}>
              <a className={isActive ? "is-active" : ""} href={`#/account${itemSlug === "dashboard" ? "" : `/${itemSlug}`}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.children ? <ChevronRight size={16} /> : null}
              </a>
              {item.children ? (
                <div className="subnav">
                  {item.children.map((child) => {
                    const childSlug = getSlug(child);

                    return (
                      <a
                        className={activeSlug === childSlug ? "is-active" : ""}
                        href={`#/account/${childSlug}`}
                        key={child}
                      >
                        {child}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function AccountPanel({
  account,
  activeSlug,
  authToken,
  error,
  isLoading,
  onAccountUpdate,
  onDemoLogout
}) {
  const page = pageCopy[activeSlug] || pageCopy.dashboard;

  return (
    <div className="dashboard-panel">
      <div className="dashboard-header">
        <div>
          <span>{page.eyebrow}</span>
          <h2>{page.title}</h2>
          <p>{page.text}</p>
        </div>
        {activeSlug === "logout" ? (
          <button className="primary-link dark-link" type="button" onClick={onDemoLogout}>
            Logout
          </button>
        ) : null}
      </div>

      {isLoading ? <AccountLoading /> : null}
      {!isLoading && error ? <AccountError message={error} /> : null}
      {!isLoading && !error ? (
        <AccountView
          account={account}
          activeSlug={activeSlug}
          authToken={authToken}
          onAccountUpdate={onAccountUpdate}
        />
      ) : null}
    </div>
  );
}

function AccountView({ account, activeSlug, authToken, onAccountUpdate }) {
  if (activeSlug === "dashboard") {
    return <DashboardOverview account={account} />;
  }

  if (activeSlug === "profile" || activeSlug === "saved-details") {
    return <ProfileDetails account={account} />;
  }

  if (activeSlug === "order-status") {
    return <OrderStatus orders={account.orders} />;
  }

  if (activeSlug === "add-address") {
    return <AddAddressManager account={account} authToken={authToken} onAccountUpdate={onAccountUpdate} />;
  }

  if (activeSlug === "reward-points") {
    return <SimpleValue label="Reward Points" value={account.rewardPoints} text="Your available VOID reward balance." />;
  }

  return <AccountCollection account={account} activeSlug={activeSlug} />;
}

function DashboardOverview({ account }) {
  const latestOrder = account.orders[0];
  const displayName = account.user?.name || account.user?.mobile || "VOID member";
  const featuredProducts = products.slice(0, 3);
  const featuredReview = testimonials[0];

  return (
    <>
      <div className="account-hero-media-card">
        <div>
          <span>Member Kit</span>
          <h3>Welcome back, {displayName}</h3>
          <p>Orders, saved addresses, support, and VOID product drops stay connected to this account.</p>
        </div>
        <div className="account-product-stack">
          {featuredProducts.map((product) => (
            <img src={product.gallery?.[0] || product.image} alt={product.name} key={product.name} />
          ))}
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Total Orders" value={account.orders.length} />
        <Metric label="Return Requests" value={account.returns.length} />
        <Metric label="Reward Points" value={account.rewardPoints} />
        <Metric label="Addresses" value={account.addresses.length} />
      </div>

      <div className="dashboard-content">
        <article className="status-card">
          <span>Latest Order</span>
          <h3>{latestOrder ? latestOrder.id || latestOrder.orderId || "Recent order" : "No orders yet"}</h3>
          <p>
            {latestOrder
              ? `${getOrderStatus(latestOrder)}${latestOrder.trackingNumber ? ` - Tracking ${latestOrder.trackingNumber}` : ""}`
              : "Your first VOID order will appear here with tracking and delivery status."}
          </p>
          <a className="primary-link dark-link" href="#/account/order-status">
            Order Status
          </a>
        </article>
        <article className="support-card">
          <span>Review Video</span>
          <h3>{displayName}</h3>
          <div className="account-review-mini">
            <video src={featuredReview.video} controls playsInline preload="metadata" />
          </div>
          <p>Member since {formatDate(account.user?.createdAt)}. Watch real VOID feedback while tracking your account.</p>
        </article>
      </div>
    </>
  );
}

function ProfileDetails({ account }) {
  const displayName = account.user?.name || "VOID member";
  const mobile = account.user?.mobile || "Not available";

  return (
    <div className="profile-experience">
      <article className="profile-hero-card">
        <div className="profile-identity">
          <span>VOID member profile</span>
          <h3>{displayName}</h3>
          <p>{mobile}</p>
        </div>
        <div className="profile-member-chip">
          Member since {formatDate(account.user?.createdAt)}
        </div>
      </article>

      <div className="profile-action-grid" aria-label="Profile quick actions">
        <a href="#/account/order-status">Track orders</a>
        <a href="#/account/returns-&-refunds">Returns & refunds</a>
        <a href="#/account/add-address">Add address</a>
      </div>

      <div className="account-detail-grid profile-detail-grid">
        <DetailCard label="Name" value={displayName} />
        <DetailCard label="Mobile Number" value={mobile} />
        <DetailCard label="Member Since" value={formatDate(account.user?.createdAt)} />
        <DetailCard label="Addresses" value={account.addresses.length} />
        <DetailCard label="Reward Points" value={account.rewardPoints} />
        <DetailCard label="Return Requests" value={account.returns.length} />
      </div>
    </div>
  );
}

function AddAddressManager({ account, authToken, onAccountUpdate }) {
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const addresses = Array.isArray(account.addresses) ? account.addresses : [];

  const handleSave = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    setMessage("");

    if (address.trim().length < 8) {
      setMessage("Enter a complete delivery address.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/addresses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ label, address })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save address.");
      }

      onAccountUpdate(data.user);
      setAddress("");
      setLabel("Home");
      setMessage("Address saved. It will appear during checkout.");
    } catch (saveError) {
      setMessage(saveError.message || "Unable to save address.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="address-manager">
      <form className="address-form" onSubmit={handleSave}>
        <div className="form-field">
          <label>Address Label</label>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Home, Work, Gym"
          />
        </div>
        <div className="form-field">
          <label>Delivery Address</label>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Flat / house, street, city, state, pincode"
          />
        </div>
        {message ? <p className="address-form-message">{message}</p> : null}
        <button className="primary-link dark-link" type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Address"}
        </button>
      </form>

      <div className="account-list address-list">
        {addresses.length ? (
          addresses.map((item, index) => (
            <DetailCard
              label={item.label || `Address ${index + 1}`}
              value={formatAddress(item)}
              key={item.id || item.address || index}
            />
          ))
        ) : (
          <div className="account-empty compact-empty">
            <span>No address saved</span>
            <h3>Add your first delivery address</h3>
            <p>Checkout will use your saved profile address automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderStatus({ orders }) {
  const statusLabels = useMemo(
    () => [...new Set([...orderStatuses, ...orders.map((order) => getOrderStatus(order))])],
    [orders]
  );
  const ordersByStatus = useMemo(
    () =>
      statusLabels.map((status) => ({
        status,
        orders: orders.filter((order) => getOrderStatus(order).toLowerCase() === status.toLowerCase())
      })),
    [orders, statusLabels]
  );

  if (!orders.length) {
    return (
      <div className="account-empty">
        <span>Orders</span>
        <h3>No orders yet</h3>
        <p>No order records are saved for this account yet. When a real order is added, it will show here with status and tracking.</p>
        <a className="primary-link dark-link" href="#/shop">
          Shop VOID Core
        </a>
      </div>
    );
  }

  return (
    <div className="order-status-view">
      <div className="order-status-grid">
        <Metric label="All Orders" value={orders.length} />
        {ordersByStatus.map(({ status, orders: statusOrders }) => (
          <Metric label={status} value={statusOrders.length} key={status} />
        ))}
      </div>

      {ordersByStatus.map(({ status, orders: statusOrders }) => (
        <section className="order-status-section" key={status}>
          <div className="section-heading compact-heading">
            <span>{status}</span>
            <h2>{statusOrders.length} Orders</h2>
          </div>
          {statusOrders.length ? (
            <div className="order-list">
              {statusOrders.map((order) => (
                <OrderCard order={order} key={order.id || order.orderId || JSON.stringify(order)} />
              ))}
            </div>
          ) : (
            <p className="muted-line">No {status.toLowerCase()} orders.</p>
          )}
        </section>
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <article className="order-card">
      <div>
        <span>{getOrderStatus(order)}</span>
        <h3>{order.id || order.orderId || "Order"}</h3>
        <p>{items.length ? items.map((item) => item.name || item.title || "VOID item").join(", ") : "Order items not listed"}</p>
      </div>
      <div className="order-meta">
        <strong>{order.total || order.amount || "Total unavailable"}</strong>
        <span>{formatDate(order.createdAt || order.date)}</span>
        {order.trackingNumber ? <span>Tracking: {order.trackingNumber}</span> : null}
      </div>
    </article>
  );
}

function AccountCollection({ account, activeSlug }) {
  const page = pageCopy[activeSlug] || pageCopy.dashboard;
  const collection = getCollection(account, activeSlug);

  if (!collection.length) {
    return (
      <div className="account-empty">
        <span>{page.eyebrow}</span>
        <h3>{page.title}</h3>
        <p>{page.text}</p>
        {activeSlug === "wishlist" || activeSlug === "recently-viewed-products" ? (
          <a className="primary-link dark-link" href="#/shop">
            Shop VOID Core
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="account-list">
      {collection.map((item, index) => (
        <DetailCard
          label={item.label || item.name || item.title || `${page.title} ${index + 1}`}
          value={item.value || item.detail || item.status || item.address || "Saved"}
          key={item.id || item.label || item.name || index}
        />
      ))}
    </div>
  );
}

function SimpleValue({ label, value, text }) {
  return (
    <article className="account-empty">
      <span>{label}</span>
      <h3>{value}</h3>
      <p>{text}</p>
    </article>
  );
}

function AccountLoading() {
  return (
    <div className="account-empty">
      <span>Loading</span>
      <h3>Fetching account</h3>
      <p>Loading your real account details.</p>
    </div>
  );
}

function AccountError({ message }) {
  return (
    <div className="account-empty">
      <span>Account</span>
      <h3>Could not load</h3>
      <p>{message}</p>
      <a className="primary-link dark-link" href="#/login">
        Login Again
      </a>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <article className="detail-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function normalizeAccountData(user) {
  return {
    user,
    orders: sortOrders(user?.orders),
    wishlist: Array.isArray(user?.wishlist) ? user.wishlist : [],
    addresses: Array.isArray(user?.addresses) ? user.addresses : [],
    rewardPoints: Number(user?.rewardPoints || 0),
    notifications: Array.isArray(user?.notifications) ? user.notifications : [],
    recentlyViewed: Array.isArray(user?.recentlyViewed) ? user.recentlyViewed : [],
    returns: Array.isArray(user?.returns) ? user.returns : [],
    coupons: Array.isArray(user?.coupons) ? user.coupons : []
  };
}

function sortOrders(orders) {
  if (!Array.isArray(orders)) {
    return [];
  }

  return [...orders].sort((first, second) => new Date(second.createdAt || second.date || 0) - new Date(first.createdAt || first.date || 0));
}

function getCollection(account, activeSlug) {
  const collectionMap = {
    wishlist: account.wishlist,
    "add-address": account.addresses,
    "returns-&-refunds": account.returns,
    "coupons-&-rewards": account.coupons,
    notifications: account.notifications,
    "recently-viewed-products": account.recentlyViewed
  };

  return collectionMap[activeSlug] || [];
}

function getOrderStatus(order) {
  return String(order.status || order.orderStatus || "Pending");
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function formatAddress(address) {
  if (!address) return "Not available";
  if (typeof address === "string") return address;
  return (
    address.address ||
    address.value ||
    [address.line1, address.line2, address.city, address.state, address.pincode || address.zip]
      .filter(Boolean)
      .join(", ") ||
    "Not available"
  );
}

function normalizeAccountSlug(slug) {
  return orderSlugAliases.has(slug) ? "order-status" : slug;
}

function getSlug(label) {
  return label.toLowerCase().replaceAll(" ", "-");
}

export default AccountPage;
