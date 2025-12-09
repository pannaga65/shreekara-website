// Simple frontend cart counter
let cartCount = 0;

// Toggle Mobile Navigation
function toggleNav() {
  const nav = document.querySelector(".nav");
  nav.classList.toggle("open");
  
  // Toggle icon
  const toggle = document.querySelector(".nav-toggle i");
  if (nav.classList.contains("open")) {
    toggle.classList.remove("fa-bars");
    toggle.classList.add("fa-times");
  } else {
    toggle.classList.remove("fa-times");
    toggle.classList.add("fa-bars");
  }
}

// Close mobile nav when clicking on a link or resizing window
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".nav a");
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle i");
  
  // Close on link click
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 992) {
        nav.classList.remove("open");
        toggle.classList.remove("fa-times");
        toggle.classList.add("fa-bars");
      }
    });
  });

  // Close on window resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 992 && nav.classList.contains("open")) {
      nav.classList.remove("open");
      toggle.classList.remove("fa-times");
      toggle.classList.add("fa-bars");
    }
  });
});

// Update cart UI
function updateCartUI() {
  const cartCountSpan = document.getElementById("cart-count");
  if (cartCountSpan) {
    cartCountSpan.textContent = cartCount;
    
    // Add animation when item is added
    cartCountSpan.parentElement.classList.add("cart-bounce");
    setTimeout(() => {
      cartCountSpan.parentElement.classList.remove("cart-bounce");
    }, 500);
  }
}

// Show notification
function showNotification(message, type = 'success') {
  // Remove existing notification if any
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;

  // Add to body
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Back to Top Button
document.addEventListener("DOMContentLoaded", function () {
  const backToTopBtn = document.getElementById("backToTop");

  if (backToTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener("scroll", function () {
      if (window.scrollY > 300) {
        backToTopBtn.classList.add("show");
      } else {
        backToTopBtn.classList.remove("show");
      }
    });

    // Scroll to top on click
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }
});

// Contact form validation
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.querySelector('form[name="contact"]');
  
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      const name = this.querySelector('input[name="name"]');
      const email = this.querySelector('input[name="email"]');
      const message = this.querySelector('textarea[name="message"]');
      
      let isValid = true;
      
      // Simple validation
      if (name && name.value.trim().length < 2) {
        showNotification("Please enter a valid name", "error");
        isValid = false;
      }
      
      if (email && !email.value.match(/^\S+@\S+\.\S+$/)) {
        showNotification("Please enter a valid email address", "error");
        isValid = false;
      }
      
      if (message && message.value.trim().length < 10) {
        showNotification("Please enter a message (at least 10 characters)", "error");
        isValid = false;
      }
      
      if (!isValid) {
        e.preventDefault();
      } else {
        // Show success message (Netlify will handle the actual submission)
        showNotification("Sending your message...", "success");
      }
    });
  }
});

// Add loading animation for images
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("img");
  
  images.forEach(img => {
    if (img.complete) {
      img.classList.add("loaded");
    } else {
      img.addEventListener("load", function () {
        this.classList.add("loaded");
      });
    }
  });
});

// Update footer year dynamically
document.addEventListener("DOMContentLoaded", function() {
  const footerYear = document.querySelector('.footer-bottom span');
  if (footerYear && footerYear.textContent.includes('2024')) {
    const currentYear = new Date().getFullYear();
    footerYear.textContent = footerYear.textContent.replace('2024', currentYear);
  }
});