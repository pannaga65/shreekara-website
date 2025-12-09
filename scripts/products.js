let PRODUCT_DATA = null;

// Load products.json once
async function loadProducts() {
  if (PRODUCT_DATA) return PRODUCT_DATA;

  try {
    const res = await fetch("products.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    PRODUCT_DATA = await res.json();
    return PRODUCT_DATA;
  } catch (err) {
    console.error("Failed to load products.json", err);
    if (typeof showNotification === "function") {
      showNotification("Unable to load products. Please refresh the page.", "error");
    }
    return { products: [] };
  }
}

// Find product by id
async function getProductById(id) {
  const data = await loadProducts();
  return data.products.find((p) => p.id === id);
}

// Format price in ₹
function formatPrice(value) {
  if (value == null) return "";
  return "₹" + Number(value).toLocaleString("en-IN");
}

// Open / close modal
function openProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.classList.add("open");
    document.body.classList.add("no-scroll");
  }
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }
}

// Render product into modal and show
async function showProductInModal(productId) {
  const product = await getProductById(productId);
  if (!product) {
    if (typeof showNotification === "function") {
      showNotification("Product not found.", "error");
    }
    return;
  }

  const body = document.querySelector("#productModal .product-modal-body");
  if (!body) return;

  const usesList = product.uses
    .map((u) => `<li><i class="fas fa-check-circle"></i> ${u}</li>`)
    .join("");

  const variantOptions = product.variants
    .map(
      (v) =>
        `<option value="${v.id}">
          ${v.label} — ${formatPrice(v.price)}
        </option>`
    )
    .join("");

  body.innerHTML = `
    <div class="product-modal-main">
      <div class="product-modal-image">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-modal-info">
        <h3>${product.name}</h3>
        <p class="product-modal-sub">${product.shortDescription}</p>

        <div class="product-modal-meta">
          <span><strong>Brand:</strong> ${product.brand}</span>
          <span><strong>Supplier:</strong> ${product.supplier}</span>
          <span><strong>Category:</strong> ${product.category}</span>
        </div>

        <h4>Uses & Benefits</h4>
        <ul class="product-modal-uses">
          ${usesList}
        </ul>

        <div class="product-modal-variants">
          <label for="variantSelect">
            <i class="fas fa-list"></i> Select Variant
          </label>
          <select id="variantSelect" class="variant-select">
            <option value="">Choose size / pack</option>
            ${variantOptions}
          </select>
        </div>

        <div class="product-modal-price">
          <span class="product-modal-price-label">Price: </span>
          <span class="product-modal-price-value">—</span>
        </div>

        <button class="btn btn-primary" id="modalAddToCart">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>

        <a href="product.html?id=${product.id}" class="btn btn-outline-dark product-modal-link">
          <i class="fas fa-file-medical-alt"></i> View Full Details
        </a>
      </div>
    </div>
  `;

  const variantSelect = document.getElementById("variantSelect");
  const priceEl = document.querySelector(".product-modal-price-value");
  const addBtn = document.getElementById("modalAddToCart");

  function updatePriceDisplay() {
    const variantId = variantSelect.value;
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) {
      priceEl.textContent = formatPrice(variant.price);
    } else {
      priceEl.textContent = "—";
    }
  }

  if (variantSelect) {
    variantSelect.addEventListener("change", updatePriceDisplay);
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const variantId = variantSelect.value;
      if (!variantId) {
        if (typeof showNotification === "function") {
          showNotification("Please select a variant first.", "error");
        }
        return;
      }

      const variant = product.variants.find((v) => v.id === variantId);
      
      // Add to cart
      if (typeof cartCount === "number") {
        cartCount += 1;
        if (typeof updateCartUI === "function") updateCartUI();
      }

      const msg = `${product.name} (${variant.label}) added to cart!`;
      if (typeof showNotification === "function") {
        showNotification(msg, "success");
      }

      closeProductModal();
    });
  }

  openProductModal();
}

// Fill prices on cards
async function populateCardPrices() {
  const data = await loadProducts();
  const elements = document.querySelectorAll("[data-product-price-for]");

  elements.forEach((el) => {
    const id = el.getAttribute("data-product-price-for");
    const product = data.products.find((p) => p.id === id);
    if (!product || !product.variants || !product.variants.length) return;

    const prices = product.variants
      .map((v) => v.price)
      .filter((p) => typeof p === "number");

    if (!prices.length) return;

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
      el.textContent = formatPrice(min);
    } else {
      el.textContent = `${formatPrice(min)} — ${formatPrice(max)}`;
    }
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Load products on page load
  loadProducts();

  // Handle "Add to Cart" buttons - open modal for variant selection
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const productId = btn.getAttribute("data-product-handle");
      if (productId) {
        showProductInModal(productId);
      }
    });
  });

  // Handle "Quick View" buttons on products.html
  document.querySelectorAll(".product-quickview-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = btn.getAttribute("data-product-id");
      if (productId) {
        showProductInModal(productId);
      }
    });
  });

  // Close modal when clicking elements with data-modal-close
  document.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", () => {
      closeProductModal();
    });
  });

  // Close modal when clicking overlay
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("product-modal-overlay")) {
        closeProductModal();
      }
    });
  }

  // Close modal on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("open")) {
      closeProductModal();
    }
  });

  // Populate card prices
  populateCardPrices();

  // If on product.html, render single product page
  const productPageContainer = document.getElementById("productPage");
  if (productPageContainer) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      renderProductPage(id);
    } else {
      productPageContainer.innerHTML = `
        <section class='section'>
          <div class='container'>
            <p>No product specified. <a href="products.html">View all products</a></p>
          </div>
        </section>
      `;
    }
  }
});

// Render full product page (product.html)
async function renderProductPage(id) {
  const container = document.getElementById("productPage");
  const product = await getProductById(id);

  if (!product) {
    container.innerHTML = `
      <section class='section'>
        <div class='container'>
          <p>Product not found. <a href="products.html">View all products</a></p>
        </div>
      </section>
    `;
    return;
  }

  const usesList = product.uses
    .map((u) => `<li><i class="fas fa-check-circle"></i> ${u}</li>`)
    .join("");

  const variantList = product.variants
    .map(
      (v) => `<li><strong>${v.label}</strong> — ${formatPrice(v.price)}</li>`
    )
    .join("");

  container.innerHTML = `
    <section class="page-hero">
      <div class="container">
        <h1 class="page-hero-title">${product.name}</h1>
        <div class="breadcrumbs">
          <a href="index.html">Home</a> / 
          <a href="products.html">Products</a> / 
          ${product.name}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container product-page-layout">
        <div class="product-page-image">
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="product-page-info">
          <h2>${product.name}</h2>
          <p class="product-page-sub">${product.shortDescription}</p>

          <div class="product-page-meta">
            <div><strong>Brand:</strong> ${product.brand}</div>
            <div><strong>Supplier:</strong> ${product.supplier}</div>
            <div><strong>Category:</strong> ${product.category}</div>
          </div>

          <h3>Uses & Benefits</h3>
          <ul class="detail-list">
            ${usesList}
          </ul>

          <h3>Available Variants & Pricing</h3>
          <ul class="detail-list">
            ${variantList}
          </ul>

          <button class="btn btn-primary add-to-cart" data-product-handle="${product.id}">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
          
          <a href="products.html" class="btn btn-outline-dark" style="margin-left: 0.5rem;">
            <i class="fas fa-arrow-left"></i> Back to Products
          </a>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer-top">
        <div>
          <h4 class="footer-heading"><i class="fas fa-hospital"></i> Shreekara Traders</h4>
          <p>Advanced wound care & surgical supplies distributor.</p>
        </div>

        <div>
          <h4 class="footer-heading"><i class="fas fa-link"></i> Quick Links</h4>
          <p><a href="products.html"><i class="fas fa-angle-right"></i> Products</a></p>
          <p><a href="clients.html"><i class="fas fa-angle-right"></i> Partners</a></p>
        </div>

        <div>
          <h4 class="footer-heading"><i class="fas fa-info-circle"></i> Company</h4>
          <p><a href="about.html"><i class="fas fa-angle-right"></i> About Us</a></p>
          <p><a href="contact.html"><i class="fas fa-angle-right"></i> Contact</a></p>
        </div>

        <div>
          <h4 class="footer-heading"><i class="fas fa-map-marker-alt"></i> Contact</h4>
          <p><i class="fas fa-home"></i> Bangalore, Karnataka</p>
          <p><i class="fas fa-phone"></i> Phone: 6361673634</p>
          <p><i class="fas fa-envelope"></i> Email: info@shreekaratraders.com</p>
        </div>
      </div>

      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Shreekara Traders. All Rights Reserved.</span>
      </div>
    </footer>
  `;
}