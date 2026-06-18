import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { productToSlug } from "../utils/catalog";
import { trackAddToCart } from "../utils/metaPixel";

function ProductGrid({ products, className = "" }) {
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeGallery, setActiveGallery] = useState(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [selections, setSelections] = useState({});
  const [failedPhotos, setFailedPhotos] = useState({});

  const variantGroups = useMemo(() => {
    if (!activeProduct?.variants) return [];
    const groups = [];
    for (const [key, values] of Object.entries(activeProduct.variants)) {
      groups.push({ key, values: Array.isArray(values) ? values : [] });
    }
    return groups;
  }, [activeProduct]);

  const openVariantModal = (product) => {
    setActiveProduct(product);
    const nextSelections = {};
    for (const [groupKey, values] of Object.entries(product.variants || {})) {
      const arr = Array.isArray(values) ? values : [];
      nextSelections[groupKey] = arr[0] || "";
    }
    setSelections(nextSelections);
  };

  const closeVariantModal = () => {
    setActiveProduct(null);
    setSelections({});
  };

  const openGalleryModal = (product, photoIndex = 0) => {
    setActiveGallery(product);
    setActiveGalleryIndex(photoIndex);
    setIsZoomed(false);
  };

  const closeGalleryModal = () => {
    setActiveGallery(null);
    setActiveGalleryIndex(0);
    setIsZoomed(false);
  };

  const galleryPhotos = activeGallery
    ? getProductPhotos(activeGallery).filter((photo) => !failedPhotos[photo])
    : [];
  const activePhoto = galleryPhotos[activeGalleryIndex] || galleryPhotos[0] || "";

  const showGalleryPhoto = (index) => {
    setActiveGalleryIndex(index);
    setIsZoomed(false);
  };

  const markPhotoFailed = (photo) => {
    setFailedPhotos((current) => ({ ...current, [photo]: true }));
  };

  const persistAddToBag = (product, selected) => {
    // No backend cart exists in this repo; keep it to UI/selection only.
    const payload = {
      product: product.name,
      price: product.price,
      image: product.image,
      variantPhotoId: null,
      selections: selected
    };

    // eslint-disable-next-line no-console
    console.log("Add to bag:", payload);

    try {
      const key = "voidCartDraft";
      const raw = window.localStorage.getItem(key);
      const draft = raw ? JSON.parse(raw) : [];
      const next = [...draft, payload];
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }

    try {
      window.dispatchEvent(
        new CustomEvent("void:add-to-bag", { detail: { product: product.name } })
      );
      trackAddToCart(product);
    } catch {
      // ignore
    }
  };

  const handleConfirmAdd = () => {
    if (!activeProduct) return;
    // Ensure all variant groups have a value.
    const selected = { ...selections };
    for (const { key, values } of variantGroups) {
      if (!selected[key]) selected[key] = values[0] || "";
    }
    persistAddToBag(activeProduct, selected);
    closeVariantModal();
  };

  if (!products.length) {
    return (
      <div className="empty-state">
        <span>Nothing here yet</span>
        <p>This category is being prepared. Explore the full VOID core range meanwhile.</p>
        <a className="primary-link dark-link" href="#/shop">
          View All Products
        </a>
      </div>
    );
  }

  return (
    <div>
      {activeProduct ? (
        <div className="vp-modal-backdrop" role="presentation" onClick={closeVariantModal}>
          <div
            className="vp-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Select options for ${activeProduct.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vp-modal-header">
              <div className="vp-modal-title">
                <span>{activeProduct.category}</span>
                <h3>{activeProduct.name}</h3>
              </div>
              <button type="button" className="vp-close" onClick={closeVariantModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="vp-modal-body">
              {variantGroups.map((group) => {
                if (!group.values.length) return null;
                const displayLabel =
                  group.key === "color" ? "Color" : group.key === "size" ? "Size" : group.key;

                return (
                  <div className="vp-variant-panel" key={group.key}>
                    <div className="vp-variant-row">
                      <span>{displayLabel}</span>
                      <div className="vp-variant-options">
                        {group.values.map((v) => {
                          const isActive = selections?.[group.key] === v;
                          return (
                            <button
                              type="button"
                              key={v}
                              className={`vp-option ${isActive ? "is-active" : ""}`}
                              onClick={() => setSelections((s) => ({ ...s, [group.key]: v }))}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="vp-modal-footer">
              <button type="button" className="primary-link dark-link" onClick={handleConfirmAdd}>
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeGallery ? (
        <div className="vp-modal-backdrop product-gallery-backdrop" role="presentation" onClick={closeGalleryModal}>
          <div
            className="vp-modal product-gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeGallery.name} photos`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vp-modal-header">
              <div className="vp-modal-title">
                <span>{activeGallery.category}</span>
                <h3>{activeGallery.name}</h3>
              </div>
              <button type="button" className="vp-close" onClick={closeGalleryModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="product-gallery-viewer">
              <button
                type="button"
                className={`product-gallery-stage ${isZoomed ? "is-zoomed" : ""}`}
                onClick={() => setIsZoomed((zoomed) => !zoomed)}
                aria-label={isZoomed ? "Zoom out" : "Zoom in"}
              >
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={`${activeGallery.name} photo ${activeGalleryIndex + 1}`}
                    onError={() => markPhotoFailed(activePhoto)}
                  />
                ) : (
                  <div className="product-image-placeholder">{activeGallery.name}</div>
                )}
              </button>
              <div className="product-gallery-viewer-strip" aria-label="Choose product photo">
                {galleryPhotos.map((photo, index) => (
                  <button
                    type="button"
                    className={index === activeGalleryIndex ? "is-active" : ""}
                    key={`${photo}-${index}`}
                    onClick={() => showGalleryPhoto(index)}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <img src={photo} alt="" onError={() => markPhotoFailed(photo)} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`product-grid ${className}`.trim()}>
        {products.map((product) => {
          const hasQuantity = product.quantity !== undefined && product.quantity !== "";
          const isOutOfStock = hasQuantity && Number(product.quantity) <= 0;
          const photos = getProductPhotos(product).filter((photo) => !failedPhotos[photo]);
          const image = product.image && !failedPhotos[product.image] ? product.image : photos[0] || "";

          return (
            <article className="product-card" key={product.id || product.sku || product.name}>
              <div className="product-image">
                {image ? (
                  <button type="button" className="product-image-button" onClick={() => openGalleryModal(product, 0)}>
                    <img src={image} alt={product.name} onError={() => markPhotoFailed(image)} />
                  </button>
                ) : (
                  <div className="product-image-placeholder">{product.name}</div>
                )}
                {isOutOfStock ? <span>Out of stock</span> : product.badge ? <span>{product.badge}</span> : null}
              </div>

              {photos.length > 1 ? (
                <div className="product-gallery-strip" aria-label={`${product.name} photos`}>
                  {photos.map((photo, index) => (
                    <button type="button" onClick={() => openGalleryModal(product, index)} key={`${photo}-${index}`}>
                      <img src={photo} alt="" onError={() => markPhotoFailed(photo)} />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="product-info">
                <div className="product-meta">
                  <span>{product.category}</span>
                  {product.rating ? <strong>Rated {product.rating}</strong> : null}
                </div>
                <h3>
                  <a href={`#/product/${productToSlug(product)}`}>{product.name}</a>
                </h3>
                <div className="price-row">
                  <strong>{product.price}</strong>
                  <del>{product.compareAt}</del>
                </div>
                {hasQuantity ? <p className="product-stock-line">{isOutOfStock ? "Currently unavailable" : `${product.quantity} in stock`}</p> : null}

                {product.specs?.length ? (
                  <ul className="spec-list">
                    {product.specs.map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="product-cta">
                  <a className="product-detail-link" href={`#/product/${productToSlug(product)}`}>
                    View Details
                  </a>
                  <button type="button" onClick={() => openVariantModal(product)} disabled={isOutOfStock}>
                    {isOutOfStock ? "Out of Stock" : "Add to Bag"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function getProductPhotos(product) {
  const photos = [];

  if (product.image) {
    photos.push(product.image);
  }

  if (Array.isArray(product.gallery)) {
    for (const photo of product.gallery) {
      if (photo && !photos.includes(photo)) {
        photos.push(photo);
      }
    }
  }

  return photos;
}

export default ProductGrid;
