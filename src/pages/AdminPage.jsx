import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Boxes,
  FileText,
  Film,
  ImagePlus,
  PackageSearch,
  Percent,
  Plus,
  RefreshCw,
  Tags,
  Truck,
  Trash2,
  Undo2,
  Upload,
  Users
} from "lucide-react";
import { products as assetProducts, testimonials as assetReviewVideos } from "../data/storeData";

const sections = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "products", label: "Products", icon: PackageSearch },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "refunds", label: "Refunds", icon: Undo2 },
  { id: "coupons", label: "Coupons", icon: Percent },
  { id: "customers", label: "Customers", icon: Users },
  { id: "cms", label: "CMS", icon: FileText },
  { id: "reviewVideos", label: "Review Videos", icon: Film },
  { id: "categories", label: "Categories", icon: Tags }
];

const editableSections = new Set([
  "products",
  "inventory",
  "shipping",
  "refunds",
  "coupons",
  "cms",
  "reviewVideos",
  "categories"
]);

const emptyDashboard = {
  metrics: {},
  recentOrders: [],
  customers: [],
  lowStock: [],
  catalog: {
    products: [],
    inventory: [],
    shipping: [],
    refunds: [],
    coupons: [],
    categories: [],
    cms: [],
    reviewVideos: []
  }
};

const productAssets = assetProducts.map((product) => ({
  name: product.name,
  category: product.category,
  image: product.image,
  price: product.price,
  badge: product.badge
}));

const reviewVideoAssets = assetReviewVideos.map((review) => ({
  title: review.name,
  product: review.detail,
  video: review.video
}));

function AdminPage({ authToken }) {
  const [activeSection, setActiveSection] = useState("analytics");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [catalog, setCatalog] = useState(emptyDashboard.catalog);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeConfig = sections.find((section) => section.id === activeSection) || sections[0];

  const metrics = useMemo(
    () => [
      { label: "Revenue", value: dashboard.metrics.revenue || "Rs. 0" },
      { label: "Orders", value: dashboard.metrics.orders || 0 },
      { label: "Customers", value: dashboard.metrics.customers || 0 },
      { label: "Pending", value: dashboard.metrics.pendingOrders || 0 },
      { label: "Refunds", value: dashboard.metrics.refundRequests || 0 },
      { label: "Low Stock", value: dashboard.metrics.lowStock || 0 },
      { label: "Coupons", value: dashboard.metrics.activeCoupons || 0 },
      { label: "Products", value: dashboard.metrics.products || 0 }
    ],
    [dashboard.metrics]
  );

  const loadDashboard = async () => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load admin dashboard.");
      }

      setDashboard(data);
      setCatalog(data.catalog || emptyDashboard.catalog);
    } catch (loadError) {
      setError(loadError.message || "Unable to load admin dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const saveCatalog = async () => {
    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/catalog", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ catalog })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save admin data.");
      }

      setCatalog(data.catalog);
      setDashboard((current) => ({ ...current, catalog: data.catalog }));
      setMessage("Admin data saved.");
      window.dispatchEvent(new CustomEvent("void:catalog-updated"));
    } catch (saveError) {
      setError(saveError.message || "Unable to save admin data.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (sectionId, itemIndex, key, value) => {
    setCatalog((current) => {
      const nextCatalog = {
        ...current,
        [sectionId]: current[sectionId].map((item, index) =>
          index === itemIndex ? { ...item, [key]: value } : item
        )
      };

      return sectionId === "products" ? syncInventoryWithProducts(nextCatalog) : nextCatalog;
    });
  };

  const addItem = (sectionId) => {
    const template = getTemplate(sectionId);
    setCatalog((current) => {
      const nextCatalog = {
        ...current,
        [sectionId]: [
          ...current[sectionId],
          {
            ...template,
            id: `${sectionId}-${Date.now()}`
          }
        ]
      };

      return sectionId === "products" ? syncInventoryWithProducts(nextCatalog) : nextCatalog;
    });
  };

  const removeItem = (sectionId, itemIndex) => {
    setCatalog((current) => {
      const nextCatalog = {
        ...current,
        [sectionId]: current[sectionId].filter((_, index) => index !== itemIndex)
      };

      return sectionId === "products" ? syncInventoryWithProducts(nextCatalog) : nextCatalog;
    });
  };

  return (
    <section className="page-section admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar" aria-label="Admin sections">
          <div className="admin-brand">
            <span>VOID Admin</span>
            <strong>Control Center</strong>
            <p>Catalog, customers, fulfillment, and content.</p>
          </div>
          <nav>
            {sections.map((section) => (
              <button
                className={activeSection === section.id ? "is-active" : ""}
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                type="button"
              >
                <section.icon size={18} />
                <span>{section.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-panel">
          <div className="admin-header">
            <div>
              <span>Admin Dashboard</span>
              <h1>{activeConfig.label}</h1>
              <p>Manage storefront operations, orders, customers, content, and catalog data from one workspace.</p>
            </div>
            <div className="admin-actions">
              <button type="button" className="bag-secondary-action" onClick={loadDashboard} disabled={isLoading}>
                <RefreshCw size={16} />
                Refresh
              </button>
              {editableSections.has(activeSection) ? (
                <button type="button" className="primary-link dark-link" onClick={saveCatalog} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              ) : null}
            </div>
          </div>

          {message ? <div className="admin-notice">{message}</div> : null}
          {error ? <div className="admin-notice is-error">{error}</div> : null}

          {isLoading ? (
            <div className="account-empty">
              <span>Loading</span>
              <h3>Preparing admin</h3>
              <p>Fetching orders, customers, inventory, and storefront data.</p>
            </div>
          ) : (
            <div className="admin-content-card">
              <AdminSection
                activeSection={activeSection}
                authToken={authToken}
                catalog={catalog}
                dashboard={dashboard}
                metrics={metrics}
                onAdd={addItem}
                onRemove={removeItem}
                onUpdate={updateItem}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AdminSection({ activeSection, authToken, catalog, dashboard, metrics, onAdd, onRemove, onUpdate }) {
  if (activeSection === "analytics") {
    return (
      <div className="admin-stack">
        <div className="admin-hero-insight">
          <div>
            <span>Today at a glance</span>
            <h2>{metrics[1].value} orders tracked</h2>
            <p>
              Revenue, customer growth, low stock, refunds, and campaign readiness are pulled into one operating view.
            </p>
          </div>
          <div className="admin-hero-media">
            {productAssets.slice(0, 3).map((product) => (
              <img src={product.image} alt={product.name} key={product.name} />
            ))}
          </div>
        </div>
        <div className="admin-metrics">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
        <div className="admin-grid-two">
          <AdminReadTable title="Recent Orders" rows={dashboard.recentOrders} emptyText="No orders saved yet." />
          <AdminReadTable title="Low Stock" rows={dashboard.lowStock} emptyText="No low-stock products." />
        </div>
      </div>
    );
  }

  if (activeSection === "customers") {
    return <AdminReadTable title="Customers" rows={dashboard.customers} emptyText="No customer accounts yet." />;
  }

  if (activeSection === "products") {
    return (
      <div className="admin-stack">
        <LocalProductMedia items={catalog.products || []} />
        <EditableCollection
          authToken={authToken}
          items={catalog.products || []}
          sectionId="products"
          title="Products"
          categories={catalog.categories || []}
          onAdd={onAdd}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      </div>
    );
  }

  if (activeSection === "reviewVideos") {
    return (
      <div className="admin-stack">
        <LocalReviewMedia />
        <EditableCollection
          items={catalog.reviewVideos || []}
          sectionId="reviewVideos"
          title="Review Videos"
          onAdd={onAdd}
          onRemove={onRemove}
          onUpdate={onUpdate}
        />
      </div>
    );
  }

  return (
    <EditableCollection
      items={catalog[activeSection] || []}
      sectionId={activeSection}
      title={sections.find((section) => section.id === activeSection)?.label || "Admin"}
      onAdd={onAdd}
      onRemove={onRemove}
      onUpdate={onUpdate}
    />
  );
}

function LocalProductMedia({ items }) {
  return (
    <div className="admin-media-section">
      <div className="admin-editor-head compact">
        <div>
          <span>Asset Library</span>
          <h2>Product photos</h2>
        </div>
      </div>
      <div className="admin-product-media-grid">
        {items.map((item) => {
          const asset = getProductAsset(item);
          const image = item.image || asset.image;

          return (
            <article className="admin-product-preview" key={item.id || item.sku || item.name}>
              {image ? <img src={image} alt={item.name || asset.name} /> : <div className="admin-photo-placeholder">No photo</div>}
              <div>
                <span>{item.category || asset.category}</span>
                <strong>{item.name || asset.name}</strong>
                <p>{item.price || asset.price}</p>
              </div>
              <em>{item.status || "Draft"}</em>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function LocalReviewMedia() {
  return (
    <div className="admin-media-section">
      <div className="admin-editor-head compact">
        <div>
          <span>Asset Library</span>
          <h2>Review videos</h2>
        </div>
      </div>
      <div className="admin-review-media-grid">
        {reviewVideoAssets.map((review) => (
          <article className="admin-review-preview" key={review.video}>
            <video src={review.video} controls playsInline preload="metadata" />
            <div>
              <strong>{review.title}</strong>
              <span>{review.product}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function EditableCollection({ authToken = "", categories = [], items, sectionId, title, onAdd, onRemove, onUpdate }) {
  if (sectionId === "products") {
    return (
      <ProductEditor
        authToken={authToken}
        categories={categories}
        items={items}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={onUpdate}
      />
    );
  }

  const keys = getKeys(items, getTemplate(sectionId));

  return (
    <div className="admin-editor">
      <div className="admin-editor-head">
        <div>
          <span>{title}</span>
          <h2>{items.length} records</h2>
        </div>
        <button type="button" className="primary-link dark-link" onClick={() => onAdd(sectionId)}>
          Add Record
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {keys.map((key) => (
                <th key={key}>{toLabel(key)}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id || index}>
                {keys.map((key) => (
                  <td key={key}>
                    <input
                      value={item[key] ?? ""}
                      onChange={(event) => onUpdate(sectionId, index, key, event.target.value)}
                      aria-label={`${toLabel(key)} for ${title} ${index + 1}`}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" className="admin-delete" onClick={() => onRemove(sectionId, index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductEditor({ authToken, categories, items, onAdd, onRemove, onUpdate }) {
  const visibleCategories = categories.map((category) => category.name).filter(Boolean);

  const updateListField = (itemIndex, key, values) => {
    onUpdate("products", itemIndex, key, values.map((value) => String(value || "")));
  };

  const addListOption = (itemIndex, key) => {
    const values = getEditableList(items[itemIndex]?.[key]);
    onUpdate("products", itemIndex, key, [...values, ""]);
  };

  const removeListOption = (itemIndex, key, optionIndex) => {
    const values = getEditableList(items[itemIndex]?.[key]);
    updateListField(
      itemIndex,
      key,
      values.filter((_, index) => index !== optionIndex)
    );
  };

  const handleMainPhoto = async (itemIndex, file) => {
    if (!file) return;
    const image = await uploadImageFile(file, authToken);
    if (image) {
      onUpdate("products", itemIndex, "image", image);
    }
  };

  const handleGalleryPhotos = async (itemIndex, files) => {
    const images = await Promise.all(Array.from(files || []).map((file) => uploadImageFile(file, authToken)));
    const currentGallery = Array.isArray(items[itemIndex]?.gallery)
      ? items[itemIndex].gallery
      : splitAdminList(items[itemIndex]?.gallery);
    onUpdate("products", itemIndex, "gallery", [...currentGallery, ...images.filter(Boolean)]);
  };

  const removeGalleryPhoto = (itemIndex, photoIndex) => {
    const currentGallery = Array.isArray(items[itemIndex]?.gallery)
      ? items[itemIndex].gallery
      : splitAdminList(items[itemIndex]?.gallery);
    onUpdate(
      "products",
      itemIndex,
      "gallery",
      currentGallery.filter((_, index) => index !== photoIndex)
    );
  };

  return (
    <div className="admin-editor product-editor">
      <div className="admin-editor-head">
        <div>
          <span>Products</span>
          <h2>{items.length} records</h2>
        </div>
        <button type="button" className="primary-link dark-link" onClick={() => onAdd("products")}>
          Add Product
        </button>
      </div>

      <div className="admin-product-editor-list">
        {items.map((item, index) => {
          const gallery = Array.isArray(item.gallery) ? item.gallery : splitAdminList(item.gallery);

          return (
            <article className="admin-product-editor-card" key={item.id || item.sku || index}>
              <div className="admin-product-photo-editor">
                {item.image ? (
                  <img src={item.image} alt={item.name || "Product"} />
                ) : (
                  <div className="admin-photo-placeholder">
                    <ImagePlus size={24} />
                    <span>Main photo</span>
                  </div>
                )}
                <label className="admin-upload-button">
                  <Upload size={15} />
                  Upload Photo
                  <input accept="image/*" type="file" onChange={(event) => handleMainPhoto(index, event.target.files?.[0])} />
                </label>
              </div>

              <div className="admin-product-form-grid">
                <AdminField label="Name" value={item.name} onChange={(value) => onUpdate("products", index, "name", value)} />
                <label className="admin-form-field">
                  <span>Category</span>
                  <select
                    value={item.category || ""}
                    onChange={(event) => onUpdate("products", index, "category", event.target.value)}
                  >
                    <option value="">Choose category</option>
                    {visibleCategories.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                    {item.category && !visibleCategories.includes(item.category) ? (
                      <option value={item.category}>{item.category}</option>
                    ) : null}
                  </select>
                </label>
                <AdminField label="Price" value={item.price} onChange={(value) => onUpdate("products", index, "price", value)} />
                <AdminField label="Compare At" value={item.compareAt} onChange={(value) => onUpdate("products", index, "compareAt", value)} />
                <AdminField label="Quantity" type="number" value={item.quantity} onChange={(value) => onUpdate("products", index, "quantity", value)} />
                <AdminField label="Badge" value={item.badge} onChange={(value) => onUpdate("products", index, "badge", value)} />
                <AdminField label="Rating" value={item.rating} onChange={(value) => onUpdate("products", index, "rating", value)} />
                <AdminField label="SKU" value={item.sku} onChange={(value) => onUpdate("products", index, "sku", value)} />
                <label className="admin-form-field">
                  <span>Status</span>
                  <select
                    value={item.status || "Draft"}
                    onChange={(event) => onUpdate("products", index, "status", event.target.value)}
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </label>
                <AdminOptionList
                  label="Colours"
                  values={getEditableList(item.colors)}
                  onAdd={() => addListOption(index, "colors")}
                  onChange={(optionIndex, value) => {
                    const values = getEditableList(item.colors);
                    values[optionIndex] = value;
                    updateListField(index, "colors", values);
                  }}
                  onRemove={(optionIndex) => removeListOption(index, "colors", optionIndex)}
                />
                <AdminOptionList
                  label="Sizes"
                  values={getEditableList(item.sizes)}
                  onAdd={() => addListOption(index, "sizes")}
                  onChange={(optionIndex, value) => {
                    const values = getEditableList(item.sizes);
                    values[optionIndex] = value;
                    updateListField(index, "sizes", values);
                  }}
                  onRemove={(optionIndex) => removeListOption(index, "sizes", optionIndex)}
                />
                <AdminField isWide label="Specs" value={item.specs} onChange={(value) => onUpdate("products", index, "specs", value)} />
                <AdminField isWide label="Description" value={item.description} onChange={(value) => onUpdate("products", index, "description", value)} />
                <AdminField isWide label="Specialisation" value={item.specialisation} onChange={(value) => onUpdate("products", index, "specialisation", value)} />
              </div>

              <div className="admin-gallery-editor">
                <div className="admin-gallery-head">
                  <strong>Gallery photos</strong>
                  <label className="admin-upload-button compact">
                    <Upload size={14} />
                    Add Photos
                    <input accept="image/*" multiple type="file" onChange={(event) => handleGalleryPhotos(index, event.target.files)} />
                  </label>
                </div>
                {gallery.length ? (
                  <div className="admin-gallery-strip">
                    {gallery.map((photo, photoIndex) => (
                      <div className="admin-gallery-thumb" key={`${photo.slice(0, 40)}-${photoIndex}`}>
                        <img src={photo} alt="" />
                        <button type="button" onClick={() => removeGalleryPhoto(index, photoIndex)} aria-label="Remove gallery photo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="admin-empty-line">Add extra product photos for the storefront gallery.</p>
                )}
              </div>

              <button type="button" className="admin-delete product-delete" onClick={() => onRemove("products", index)}>
                Remove Product
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AdminField({ isWide = false, label, onChange, type = "text", value }) {
  return (
    <label className={`admin-form-field ${isWide ? "is-wide" : ""}`}>
      <span>{label}</span>
      <input type={type} min={type === "number" ? "0" : undefined} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AdminOptionList({ label, onAdd, onChange, onRemove, values }) {
  return (
    <div className="admin-option-list">
      <div className="admin-option-list-head">
        <span>{label}</span>
        <button type="button" onClick={onAdd}>
          <Plus size={14} />
          Add
        </button>
      </div>
      {values.length ? (
        <div className="admin-option-rows">
          {values.map((value, index) => (
            <div className="admin-option-row" key={`${label}-${index}`}>
              <input value={value} onChange={(event) => onChange(index, event.target.value)} />
              <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${label} option`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button type="button" className="admin-empty-option" onClick={onAdd}>
          Add first {label.toLowerCase()} option
        </button>
      )}
    </div>
  );
}

function AdminReadTable({ title, rows, emptyText }) {
  const keys = getKeys(rows);

  return (
    <article className="admin-read-card">
      <div className="admin-editor-head compact">
        <div>
          <span>{title}</span>
          <h2>{rows.length} records</h2>
        </div>
      </div>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table read-only">
            <thead>
              <tr>
                {keys.map((key) => (
                  <th key={key}>{toLabel(key)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  {keys.map((key) => (
                    <td key={key}>{formatValue(row[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty-line">{emptyText}</p>
      )}
    </article>
  );
}

function getTemplate(sectionId) {
  const templates = {
    products: {
      name: "New Product",
      category: "",
      price: "Rs. 0",
      compareAt: "",
      badge: "New",
      rating: "",
      quantity: "0",
      image: "",
      gallery: [],
      colors: "",
      sizes: "",
      specs: "",
      description: "",
      specialisation: "",
      status: "Draft",
      sku: "VOID-NEW"
    },
    inventory: { sku: "VOID-NEW", product: "New Product", stock: 0, reorderAt: 5, location: "Mumbai" },
    shipping: { zone: "New Zone", partner: "Manual Dispatch", fee: "Free", eta: "3-6 days", status: "Draft" },
    refunds: { type: "Refund rule", rule: "Describe policy", status: "Draft" },
    coupons: { code: "NEWCODE", discount: "10%", status: "Draft", expires: "2026-12-31" },
    categories: { name: "New Category", slug: "new-category", status: "Hidden" },
    cms: { page: "Home", block: "Section", title: "New content", status: "Draft" },
    reviewVideos: { title: "New Review", product: "VOID product", status: "Draft" }
  };

  return templates[sectionId] || { name: "New Record", status: "Draft" };
}

function getKeys(rows, fallback = {}) {
  const source = rows.length ? rows[0] : fallback;
  return Object.keys(source).filter((key) => key !== "_id");
}

function toLabel(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (value && typeof value === "object") {
    return Object.values(value).filter(Boolean).join(", ");
  }

  return value || "Not available";
}

function getProductAsset(item) {
  const name = String(item?.name || "").toLowerCase();
  const category = String(item?.category || "").toLowerCase();

  return (
    productAssets.find((product) => product.name.toLowerCase() === name) ||
    productAssets.find((product) => product.category.toLowerCase() === category) ||
    productAssets[0]
  );
}

async function uploadImageFile(file, authToken) {
  if (!file || !file.type?.startsWith("image/")) {
    return "";
  }

  if (file.size > 8 * 1024 * 1024) {
    showAdminToast("Use images under 8 MB");
    return "";
  }

  try {
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": file.type
      },
      body: file
    });
    const data = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || `Unable to upload product photo. Server returned ${response.status}.`);
    }

    return data.url || "";
  } catch (error) {
    showAdminToast(error.message || "Unable to upload product photo.");
    return "";
  }
}

function splitAdminList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getEditableList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? ""));
  }

  return splitAdminList(value);
}

function showAdminToast(msg) {
  window.dispatchEvent(new CustomEvent("void:toast", { detail: { msg } }));
}

function syncInventoryWithProducts(catalog) {
  const products = Array.isArray(catalog.products) ? catalog.products : [];
  const existingInventory = Array.isArray(catalog.inventory) ? catalog.inventory : [];
  const inventoryByProductId = new Map(existingInventory.map((item) => [String(item.productId || ""), item]));
  const inventoryBySku = new Map(existingInventory.map((item) => [String(item.sku || ""), item]));
  const inventoryByName = new Map(existingInventory.map((item) => [String(item.product || "").toLowerCase(), item]));

  return {
    ...catalog,
    inventory: products.map((product) => {
      const productId = String(product.id || "");
      const sku = String(product.sku || "");
      const name = String(product.name || "New Product");
      const existing =
        inventoryByProductId.get(productId) ||
        inventoryBySku.get(sku) ||
        inventoryByName.get(name.toLowerCase()) ||
        {};
      const stock = Number(product.quantity ?? existing.stock ?? 0);

      return {
        id: existing.id || `inv-${productId || Date.now()}`,
        productId,
        sku: sku || existing.sku || "VOID-NEW",
        product: name,
        stock: Number.isFinite(stock) ? stock : 0,
        reorderAt: existing.reorderAt ?? 5,
        location: existing.location || "Mumbai"
      };
    })
  };
}

async function readJsonResponse(response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) };
  }
}

export default AdminPage;
