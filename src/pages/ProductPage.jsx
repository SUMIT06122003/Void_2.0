import { useEffect, useMemo, useState } from "react";
import { productToSlug } from "../utils/catalog";
import { trackAddToCart, trackViewContent } from "../utils/metaPixel";

function ProductPage({ currentPath, products = [] }) {
  const slug = currentPath.replace(/^\/product\//, "");
  const product = products.find((entry) => productToSlug(entry) === slug);
  const [activePhoto, setActivePhoto] = useState(0);
  const [selections, setSelections] = useState({});

  const photos = useMemo(() => getProductPhotos(product), [product]);
  const specialisations = splitList(product?.specialisation);
  const specs = Array.isArray(product?.specs) ? product.specs : splitList(product?.specs);
  const variantGroups = product?.variants ? Object.entries(product.variants) : [];
  const hasQuantity = product?.quantity !== undefined && product?.quantity !== "";
  const isOutOfStock = hasQuantity && Number(product.quantity) <= 0;

  useEffect(() => {
    if (product) {
      trackViewContent(product);
    }
  }, [product]);

  if (!product) {
    return (
      <section className="page-section product-detail-page">
        <div className="empty-state">
          <span>Product not found</span>
          <h3>This product is not available</h3>
          <a className="primary-link dark-link" href="#/shop">
            Back to Shop
          </a>
        </div>
      </section>
    );
  }

  const handleAddToBag = () => {
    const selected = { ...selections };

    for (const [key, values] of variantGroups) {
      if (!selected[key]) {
        selected[key] = Array.isArray(values) ? values[0] || "" : "";
      }
    }

    const payload = {
      product: product.name,
      price: product.price,
      image: product.image,
      variantPhotoId: null,
      selections: selected
    };

    try {
      const key = "voidCartDraft";
      const raw = window.localStorage.getItem(key);
      const draft = raw ? JSON.parse(raw) : [];
      window.localStorage.setItem(key, JSON.stringify([...draft, payload]));
      window.dispatchEvent(new CustomEvent("void:add-to-bag", { detail: { product: product.name } }));
      trackAddToCart(product);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <section className="page-section product-detail-page">
      <div className="product-detail-shell">
        <div className="product-detail-media">
          <div className="product-detail-stage">
            {photos[activePhoto] ? (
              <img src={photos[activePhoto]} alt={product.name} />
            ) : (
              <div className="product-image-placeholder">{product.name}</div>
            )}
          </div>
          {photos.length > 1 ? (
            <div className="product-detail-thumbs" aria-label={`${product.name} photos`}>
              {photos.map((photo, index) => (
                <button
                  type="button"
                  className={index === activePhoto ? "is-active" : ""}
                  key={`${photo}-${index}`}
                  onClick={() => setActivePhoto(index)}
                >
                  <img src={photo} alt="" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="product-detail-copy">
          <span>{product.category}</span>
          <h1>{product.name}</h1>
          <div className="price-row product-detail-price">
            <strong>{product.price}</strong>
            {product.compareAt ? <del>{product.compareAt}</del> : null}
          </div>
          {hasQuantity ? <p className="product-stock-line">{isOutOfStock ? "Currently unavailable" : `${product.quantity} in stock`}</p> : null}
          {product.description ? <p className="product-description">{product.description}</p> : null}

          {variantGroups.length ? (
            <div className="product-detail-options">
              {variantGroups.map(([key, values]) =>
                Array.isArray(values) && values.length ? (
                  <div className="vp-variant-row" key={key}>
                    <span>{key === "color" ? "Colour" : key === "size" ? "Size" : key}</span>
                    <div className="vp-variant-options">
                      {values.map((value) => (
                        <button
                          type="button"
                          className={selections[key] === value ? "is-active vp-option" : "vp-option"}
                          key={value}
                          onClick={() => setSelections((current) => ({ ...current, [key]: value }))}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : null}

          <button className="primary-link dark-link product-detail-add" type="button" onClick={handleAddToBag} disabled={isOutOfStock}>
            {isOutOfStock ? "Out of Stock" : "Add to Bag"}
          </button>

          {specialisations.length ? (
            <div className="product-detail-block">
              <h2>Specialisation</h2>
              <ul>
                {specialisations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {specs.length ? (
            <div className="product-detail-block">
              <h2>Specifications</h2>
              <ul>
                {specs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getProductPhotos(product) {
  if (!product) return [];
  const photos = [];

  if (product.image) photos.push(product.image);

  if (Array.isArray(product.gallery)) {
    for (const photo of product.gallery) {
      if (photo && !photos.includes(photo)) photos.push(photo);
    }
  }

  return photos;
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

export default ProductPage;
