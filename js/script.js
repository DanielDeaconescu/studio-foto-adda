function userScroll() {
  const navbar = document.querySelector(".navbar");
  const toTopBtn = document.querySelector("#to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("navbar-sticky");
      toTopBtn.classList.add("show");
    } else {
      navbar.classList.remove("navbar-sticky");
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
document.querySelector("#to-top").addEventListener("click", scrollToTop);

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

const formModal = document.querySelector("#studio-foto-modal");
const contactForm = document.querySelector("#contactForm");
const fullName = document.querySelector("#name");
const phone = document.querySelector("#phone");
const validationErrors = document.querySelectorAll(".validation-error");

const submitButton = document.querySelector("#submitButton");
const loadingSpinner = document.querySelector("#loadingSpinner");
const buttonText = submitButton.querySelector(".button-text");

contactForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  // Clear old validation errors
  validationErrors.forEach((el) => el.classList.add("display-none"));

  // Basic validation
  let isValid = true;

  if (fullName.value === "") {
    validationErrors[0].classList.remove("display-none");
    isValid = false;
  }

  if (phone.value === "") {
    validationErrors[1].classList.remove("display-none");
    isValid = false;
  }

  if (!isValid) return;

  // Activate loading state
  submitButton.disabled = true;
  loadingSpinner.classList.remove("d-none");
  buttonText.textContent = "Se trimite...";

  // Send data via fetch
  try {
    const formData = new FormData(contactForm);
    const encodedData = new URLSearchParams(formData);

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodedData.toString(),
    });

    if (!response.ok) throw new Error("Failed to send email");

    // Redirect to the thank-you page
    const result = await response.json();

    if (result.success && result.redirectTo) {
      window.location.href = result.redirectTo;
    } else {
      console.log("Form submitted, but no redirect provided.");
    }
  } catch (err) {
    console.error("Error submitting form: ", err);

    // Reset loading state
    submitButton.disabled = false;
    loadingSpinner.classList.add("d-none");
    buttonText.textContent = "Trimite cererea";
  }
});

formModal.addEventListener("hidden.bs.modal", () => {
  const form = formModal.querySelector("#contactForm");
  form.reset();
});
