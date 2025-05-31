function userScroll() {
  const toTopBtn = document.querySelector("#to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      toTopBtn.classList.add("show");
    } else {
      toTopBtn.classList.remove("show");
    }
  });
}

function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function incrementStats() {
  const counters = document.querySelectorAll(".counter");

  counters.forEach((counter) => {
    counter.innerText = 0;

    const updateCounter = () => {
      const target = +counter.getAttribute("data-target");
      const c = +counter.innerText;

      const increment = target / 200;

      if (c < target) {
        counter.innerText = Math.ceil(c + increment);
        setTimeout(updateCounter, 1);
      } else {
        counter.innerText = target;
      }
    };

    updateCounter();
  });
}

// Event Listeners
document.addEventListener("DOMContentLoaded", userScroll);
document.addEventListener("DOMContentLoaded", incrementStats);
if (document.querySelector("#to-top")) {
  document.querySelector("#to-top").addEventListener("click", scrollToTop);
}

// Video Modal
const videoBtn = document.querySelector(".video-btn");
const videoModal = document.querySelector("#videoModal");
const video = document.querySelector("#video");
let videoSrc;

if (videoBtn !== null) {
  videoBtn.addEventListener("click", () => {
    videoSrc = videoBtn.getAttribute("data-bs-src");
  });
}

if (videoModal !== null) {
  videoModal.addEventListener("shown.bs.modal", () => {
    video.setAttribute(
      "src",
      `${videoSrc}?autoplay=1&modestbranding=1&showInfo=0`
    );
  });

  videoModal.addEventListener("hide.bs.modal", () => {
    video.setAttribute("src", "");
  });
}

// When the modal is closed, reset the form + Form Validation
const contactForms = document.querySelectorAll("#contactForm");

contactForms.forEach((form) => {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitButton = form.querySelector("#submitButton");
    const loadingSpinner = form.querySelector("#loadingSpinner");
    const buttonText = submitButton.querySelector(".button-text");
    const validationErrors = form.querySelectorAll(".validation-error");
    const fullName = form.querySelector("#name");
    const phone = form.querySelector("#phone");
    const turnstileResponse = form.querySelector("#cf-turnstile-response-adda");

    // Clear old validation errors
    validationErrors.forEach((el) => el.classList.add("display-none"));

    let isValid = true;

    if (fullName.value === "") {
      validationErrors[0].classList.remove("display-none");
      isValid = false;
    }

    if (phone.value === "") {
      validationErrors[1].classList.remove("display-none");
      isValid = false;
    }

    // Check if Turnstile token exists
    if (!turnstileResponse.value) {
      alert("Vă rugăm să completați verificarea Turnstile.");
      return;
    }

    if (!isValid) return;

    submitButton.disabled = true;
    loadingSpinner.classList.remove("d-none");
    buttonText.textContent = "Se trimite...";

    try {
      const formData = new FormData(form);
      const encodedData = new URLSearchParams(formData);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: encodedData.toString(),
      });

      const result = await response.json();

      // Reset form state regardless of response
      form.reset();
      submitButton.disabled = false;
      loadingSpinner.classList.add("d-none");
      buttonText.textContent = "Trimite cererea";

      // Handle redirects (both success and rate limit cases)
      if (result.redirectTo) {
        const modal = form.closest(".modal");

        if (modal) {
          const modalInstance =
            bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          modalInstance.hide();
        }

        // Short delay before redirect to allow modal to close
        setTimeout(
          () => {
            window.location.href = result.redirectTo;
          },
          modal ? 500 : 0
        ); // Shorter delay if no modal
      }
      // Handle error cases without redirect
      else if (!response.ok) {
        const errorMessage =
          result.message || "A apărut o eroare la trimiterea formularului";
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Error submitting form: ", err);
      submitButton.disabled = false;
      loadingSpinner.classList.add("d-none");
      buttonText.textContent = "Trimite cererea";
      alert("A apărut o eroare de conexiune. Vă rugăm încercați din nou.");
    }
  });
});

// Portfolio implementation

// JavaScript to filter categories
const buttons = document.querySelectorAll(".btn");
const photos = document.querySelectorAll(".photo-item");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.getAttribute("data-category");

    // Hide or show photos based on selected category
    photos.forEach((photo) => {
      if (
        photo.getAttribute("data-category") === category ||
        category === "all"
      ) {
        photo.style.display = "block";
      } else {
        photo.style.display = "none";
      }
    });
  });
});

// Default to show wedding photos
if (document.querySelector('[data-category="wedding"]')) {
  document.querySelector('[data-category="wedding"]').click();
}

// Lightbox options
// lightbox.option({
//   resizeDuration: 200,
//   wrapAround: true,
//   albumLabel: false,
// });

// contact page - copy button
function copyToClipboard() {
  const addressText = document.getElementById("addressLink").textContent;

  // Using Clipboard API to copy text to clipboard
  navigator.clipboard
    .writeText(addressText)
    .then(function () {
      // Create the toast with a faster hide time (e.g., 2000ms = 2 seconds)
      var toast = new bootstrap.Toast(
        document.getElementById("toastNotification"),
        {
          delay: 1000, // Adjust the delay time (in milliseconds)
        }
      );
      toast.show();
    })
    .catch(function (err) {
      console.error("Error copying text: ", err);
      // Optional: Display an error toast here
    });
}

// cookies logic

if (!localStorage.getItem("cookieConsent")) {
  document.getElementById("cookie-popup").classList.remove("d-none");
}

// Handle acceptance
document.getElementById("cookie-accept").addEventListener("click", function () {
  localStorage.setItem("cookieConsent", "true");
  document.getElementById("cookie-popup").classList.add("d-none");
});
