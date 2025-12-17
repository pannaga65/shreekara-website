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
      (v) => {
        if (v.offerPrice !== undefined) {
          // For Silicone Gel Sheet, show MRP and offer price
          const discount = Math.round(((v.mrp - v.offerPrice) / v.mrp) * 100);
          return `<option value="${v.id}">
            ${v.label} — <span style="text-decoration: line-through;">${formatPrice(v.mrp)}</span> ${formatPrice(v.offerPrice)} (${discount}% OFF)
          </option>`;
        } else if (v.price !== undefined) {
          // For other products with price, show just price
          return `<option value="${v.id}">
            ${v.label} — ${formatPrice(v.price)}
          </option>`;
        } else {
          // For other products without price
          return `<option value="${v.id}">
            ${v.label}
          </option>`;
        }
      }
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

        ${product.id === 'silicon-gel-sheet' ? `
        <div class="product-modal-pricing">
          <span class="product-modal-mrp">${formatPrice(product.variants[0].mrp)}</span>
          <span class="product-modal-price-value">${formatPrice(product.variants[0].offerPrice)}</span>
          <span class="product-modal-discount">${Math.round(((product.variants[0].mrp - product.variants[0].offerPrice) / product.variants[0].mrp) * 100)}% OFF</span>
        </div>

        <button class="btn btn-primary" id="modalAddToCart">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        ` : `
        <a href="contact.html?product=${encodeURIComponent(product.id)}" class="btn btn-outline-dark">
          <i class="fas fa-file-alt"></i> Get Quote
        </a>
        `}

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
    // Only update price display for Silicone Gel Sheet
    if (product.id === 'silicon-gel-sheet') {
      const variantId = variantSelect.value;
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        if (variant.offerPrice !== undefined) {
          // For Silicone Gel Sheet, show offer price
          priceEl.textContent = formatPrice(variant.offerPrice);
        }
      } else {
        priceEl.textContent = "—";
      }
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
              
      // Add to cart - only for Silicone Gel Sheet
      if (product.id === 'silicon-gel-sheet') {
        if (typeof cartCount === "number") {
          cartCount += 1;
          if (typeof updateCartUI === "function") updateCartUI();
        }
      
        const msg = `${product.name} (${variant.label}) added to cart!`;
        if (typeof showNotification === "function") {
          showNotification(msg, "success");
        }
      } else {
        // For other products, redirect to contact page
        window.location.href = `contact.html?product=${encodeURIComponent(product.id)}`;
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

    // For Silicone Gel Sheet, use offerPrice; for others, use price
    const prices = product.variants
      .map((v) => v.offerPrice !== undefined ? v.offerPrice : v.price)
      .filter((p) => typeof p === "number");

    // If no prices available (for non-Silicone Gel Sheet products), return early
    if (prices.length === 0) return;

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
    // Check if this button already has an event listener by checking for a marker
    if (!btn.hasAttribute('data-listener-attached')) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute("data-product-handle");
        if (productId) {
          showProductInModal(productId);
        }
      });
      // Mark the button as having an event listener attached
      btn.setAttribute('data-listener-attached', 'true');
    }
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

// Initialize product gallery functionality
function initializeGallery() {
  const thumbnails = document.querySelectorAll('.product-gallery .thumb');
  const mainImage = document.getElementById('mainImage');
  
  if (!thumbnails.length || !mainImage) return;
  
  // Set up click handlers for thumbnails
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', function() {
      // Update active thumbnail
      thumbnails.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Update main image
      const src = this.getAttribute('data-src');
      if (src) {
        mainImage.src = src;
      }
    });
  });
  
  // Preload images to prevent layout shifts
  // This ensures smooth transitions when switching between thumbnails
  thumbnails.forEach(thumb => {
    const img = new Image();
    img.src = thumb.getAttribute('data-src');
  });
}

// Initialize event listeners for dynamically added elements
function initializeEventListeners() {
  // Attach event listener to "Add to Cart" button on product detail page
  const addToCartButtons = document.querySelectorAll(".add-to-cart");
  addToCartButtons.forEach((btn) => {
    // Check if this button already has an event listener by checking for a marker
    if (!btn.hasAttribute('data-listener-attached')) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.getAttribute("data-product-handle");
        if (productId) {
          showProductInModal(productId);
        }
      });
      // Mark the button as having an event listener attached
      btn.setAttribute('data-listener-attached', 'true');
    }
  });
}

// Initialize variant selection functionality
function initializeVariantSelection() {
  const variantButtons = document.querySelectorAll('.variant-btn');
  const priceDisplay = document.querySelector('.product-price');
  const mrpDisplay = document.querySelector('.product-modal-mrp');
  const discountDisplay = document.querySelector('.product-modal-discount');
  const singleBuyNowBtn = document.getElementById('singleBuyNowBtn'); // Single Buy Now button
  
  if (!variantButtons.length) return;
  
  // Set the first variant as selected by default and update price display
  if (variantButtons.length > 0) {
    const firstButton = variantButtons[0];
    firstButton.classList.add('selected');
    
    // Update price display with first variant's price
    const firstMrp = firstButton.getAttribute('data-mrp');
    const firstOfferPrice = firstButton.getAttribute('data-offer-price');
    const firstPrice = firstButton.getAttribute('data-price');
    
    if (firstMrp && firstOfferPrice && mrpDisplay && priceDisplay && discountDisplay) {
      // Silicone Gel Sheet with MRP and offer price
      mrpDisplay.textContent = formatPrice(Number(firstMrp));
      priceDisplay.textContent = formatPrice(Number(firstOfferPrice));
      const discount = Math.round(((Number(firstMrp) - Number(firstOfferPrice)) / Number(firstMrp)) * 100);
      discountDisplay.textContent = `${discount}% OFF`;
    }
    
    // Update the Buy Now button with the first variant's data
    if (singleBuyNowBtn) {
      singleBuyNowBtn.setAttribute('data-selected-variant', firstButton.getAttribute('data-variant-id'));
      // In future, this would be set to the variant's amazonLink
      singleBuyNowBtn.setAttribute('data-amazon-link', '');
    }
  }
  
  // Add event listeners to variant buttons
  variantButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove selected class from all buttons
      variantButtons.forEach(btn => btn.classList.remove('selected'));
      
      // Add selected class to clicked button
      this.classList.add('selected');
      
      // Update price display
      const mrp = this.getAttribute('data-mrp');
      const offerPrice = this.getAttribute('data-offer-price');
      const price = this.getAttribute('data-price');
      
      if (mrp && offerPrice && mrpDisplay && priceDisplay && discountDisplay) {
        // Silicone Gel Sheet with MRP and offer price
        mrpDisplay.textContent = formatPrice(Number(mrp));
        priceDisplay.textContent = formatPrice(Number(offerPrice));
        const discount = Math.round(((Number(mrp) - Number(offerPrice)) / Number(mrp)) * 100);
        discountDisplay.textContent = `${discount}% OFF`;
      }
      
      // Update the Buy Now button with the selected variant's data
      if (singleBuyNowBtn) {
        singleBuyNowBtn.setAttribute('data-selected-variant', this.getAttribute('data-variant-id'));
        // In future, this would be set to the variant's amazonLink
        singleBuyNowBtn.setAttribute('data-amazon-link', '');
      }
    });
  });
  
  // Add event listener to the single Buy Now button
  // This button does not redirect for now as per requirements
  if (singleBuyNowBtn) {
    singleBuyNowBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Do nothing - no redirect, no alert, no console log as per requirements
      // Button is enabled visually but has no action
      // The selected variant is stored in the data-selected-variant attribute
      return false;
    });
  }
}

// Initialize quantity selector functionality (removed for cart removal)
function initializeQuantitySelector() {
  // Removed as part of cart functionality removal
  // Quantity selectors are no longer needed
}

// Initialize accordion functionality
function initializeAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const accordion = this.parentElement;
      const content = accordion.querySelector('.accordion-content');
      const icon = this.querySelector('.icon');
      
      // Toggle the accordion
      content.classList.toggle('open');
      
      // Update the icon
      if (content.classList.contains('open')) {
        icon.textContent = '–';
      } else {
        icon.textContent = '+';
      }
    });
  });
}

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

  // Generate variant buttons HTML
  let variantButtons = '';
  let firstPrice = null;
  let firstMrp = null;
  let firstOfferPrice = null;
  
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v, index) => {
      const isSelected = index === 0 ? 'selected' : '';
      if (index === 0) {
        // For Silicone Gel Sheet, use offerPrice; for others, use price
        if (v.offerPrice !== undefined) {
          firstPrice = v.offerPrice;
          firstMrp = v.mrp;
          firstOfferPrice = v.offerPrice;
        } else if (v.price !== undefined) {
          firstPrice = v.price;
        } else {
          firstPrice = null;
        }
      }
      
      // For Silicone Gel Sheet, include MRP and offerPrice; for others, just price
      if (v.offerPrice !== undefined) {
        variantButtons += `<button class="variant-btn ${isSelected}" data-mrp="${v.mrp}" data-offer-price="${v.offerPrice}" data-variant-id="${v.id}">${v.label}</button>`;
      } else if (v.price !== undefined) {
        variantButtons += `<button class="variant-btn ${isSelected}" data-price="${v.price}" data-variant-id="${v.id}">${v.label}</button>`;
      } else {
        variantButtons += `<button class="variant-btn ${isSelected}" data-variant-id="${v.id}">${v.label}</button>`;
      }
    });
  }

  // Generate placeholder image names based on product ID
  const productIdSlug = product.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const placeholderImages = [
    `assets/images/${productIdSlug}_gallery_01.png`,
    `assets/images/${productIdSlug}_gallery_02.png`,
    `assets/images/${productIdSlug}_gallery_03.png`
  ];

  container.innerHTML = `
    <section class="section product-detail-section">
      <div class="container product-page-layout">        <div class="product-gallery-container">
          <div class="product-gallery">
            <div class="main-image-frame">
              <img id="mainImage" src="${product.image}" alt="${product.name}" class="main-image" />
            </div>
            <div class="thumbnail-row">
              <img src="${product.image}" alt="${product.name} - View 1" class="thumb active" data-src="${product.image}" />
              <img src="${placeholderImages[0]}" alt="${product.name} - View 2" class="thumb" data-src="${placeholderImages[0]}" />
              <img src="${placeholderImages[1]}" alt="${product.name} - View 3" class="thumb" data-src="${placeholderImages[1]}" />
              <img src="${placeholderImages[2]}" alt="${product.name} - View 4" class="thumb" data-src="${placeholderImages[2]}" />
            </div>
          </div>
        </div>
        <div class="product-page-info">
          <h2>${product.name}</h2>


          ${product.variants && product.variants.length > 0 ? `
          <div class="variant-section">
            <div class="variant-options">
              ${variantButtons}
            </div>
          </div>
          
          ${product.id === 'silicon-gel-sheet' ? `
          <div class="product-pricing-display">
            ${firstMrp ? `
            <div class="product-modal-pricing">
              <span class="product-modal-mrp">${formatPrice(firstMrp)}</span>
              <span class="product-price">${formatPrice(firstOfferPrice)}</span>
              <span class="product-modal-discount">${Math.round(((firstMrp - firstOfferPrice) / firstMrp) * 100)}% OFF</span>
            </div>
            ` : ''}
          </div>
          
          <!-- Single Buy Now button for Silicone Gel Sheet -->
          <div class="buy-now-section">
            <button class="btn btn-primary buy-now-btn" id="singleBuyNowBtn" data-selected-variant="${product.variants[0]?.id || ''}" data-amazon-link="${product.variants[0]?.amazonLink || ''}">
              <i class="fas fa-shopping-bag"></i> Buy Now
            </button>
          </div>
          ` : `
          <div class="quantity-cart-row">
            <a href="contact.html?product=${encodeURIComponent(product.id)}" class="btn btn-outline-dark">
              <i class="fas fa-file-alt"></i> Get Quote
            </a>
          </div>
          `}
          ` : ''}
          
          <div class="accordion-section">
            <div class="accordion">
              <div class="accordion-header">
                <span>Product Overview</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <p>${product.overview || product.shortDescription}</p>
                <p><strong>Brand:</strong> ${product.brand}</p>
                <p><strong>Company:</strong> ${product.company || 'Not specified'}</p>
                <p><strong>Ingredients:</strong> ${product.ingredients || 'Not specified'}</p>
                <p><strong>Supplier:</strong> ${product.supplier}</p>
                <p><strong>Category:</strong> ${product.category}</p>
              </div>
            </div>
                      
            ${product.indications ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>Indications</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ul>`;
              product.indications.forEach(indication => {
                html += `<li>${indication}</li>`;
              });
              html += `</ul>
              </div>
            </div>`;
              return html;
            })() : ''}
                      
            ${product.howItWorks ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>How It Works</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ul>`;
              product.howItWorks.forEach(item => {
                html += `<li>${item}</li>`;
              });
              html += `</ul>
              </div>
            </div>`;
              return html;
            })() : ''}
                      
            ${product.benefits ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>Benefits</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ul>`;
              product.benefits.forEach(benefit => {
                html += `<li>${benefit}</li>`;
              });
              html += `</ul>
              </div>
            </div>`;
              return html;
            })() : ''}
                      
            ${product.contraindications ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>Contraindications</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ul>`;
              product.contraindications.forEach(item => {
                html += `<li>${item}</li>`;
              });
              html += `</ul>
              </div>
            </div>`;
              return html;
            })() : ''}
                      
            ${product.usage ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>How to Use</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ol>`;
              product.usage.forEach(instruction => {
                html += `<li>${instruction}</li>`;
              });
              html += `</ol>
              </div>
            </div>`;
              return html;
            })() : ''}
                      
            ${product.usedIn ? (() => {
              let html = `
            <div class="accordion">
              <div class="accordion-header">
                <span>Used In</span>
                <span class="icon">+</span>
              </div>
              <div class="accordion-content">
                <ul>`;
              product.usedIn.forEach(use => {
                html += `<li>${use}</li>`;
              });
              html += `</ul>
              </div>
            </div>`;
              return html;
            })() : ''}
          </div>

          <a href="products.html" class="btn btn-outline-dark" style="margin-top: 1rem;">
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
          <p class="gst-info"><i class="fas fa-file-invoice"></i> GSTIN: 29AFSFS4060F1ZK</p>
        </div>
      </div>

      <div class="container footer-bottom">
        <span>© ${new Date().getFullYear()} Shreekara Traders. All Rights Reserved. GSTIN: 29AFSFS4060F1ZK</span>
      </div>
    </footer>
  `;

  // Add gallery functionality and event listeners after HTML is inserted
  setTimeout(() => {
    initializeGallery();
    initializeEventListeners();
    initializeVariantSelection();
    initializeQuantitySelector();
    initializeAccordions();
  }, 0);
}
