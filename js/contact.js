/* ==========================================================================
   CONTACT FORM VALIDATION & SUCCESS FEEDBACK MODAL
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
});

function initContactForm() {
  const form = document.getElementById('contact-message-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const phoneInput = document.getElementById('contact-phone');
  const messageInput = document.getElementById('contact-message');

  // Success Modal elements
  const successOverlay = document.getElementById('contact-success-overlay');
  const successCloseBtn = document.getElementById('btn-close-success');

  if (!form) return;

  // Clear errors dynamically on input
  [nameInput, emailInput, phoneInput, messageInput].forEach(input => {
    input.addEventListener('input', () => {
      clearError(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    // 1. Name Check
    if (nameInput.value.trim() === '') {
      showError(nameInput, 'error-name', 'Full Name is required.');
      isValid = false;
    } else {
      clearError(nameInput);
    }

    // 2. Email Check
    const emailValue = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue === '') {
      showError(emailInput, 'error-email', 'Email Address is required.');
      isValid = false;
    } else if (!emailRegex.test(emailValue)) {
      showError(emailInput, 'error-email', 'Please enter a valid email (e.g. name@domain.com).');
      isValid = false;
    } else {
      clearError(emailInput);
    }

    // 3. Phone Check
    const phoneValue = phoneInput.value.trim();
    const phoneRegex = /^\d+$/; // Digits only
    if (phoneValue === '') {
      showError(phoneInput, 'error-phone', 'Phone Number is required.');
      isValid = false;
    } else if (!phoneRegex.test(phoneValue)) {
      showError(phoneInput, 'error-phone', 'Phone number must contain *only* digits.');
      isValid = false;
    } else {
      clearError(phoneInput);
    }

    // 4. Message Check
    if (messageInput.value.trim() === '') {
      showError(messageInput, 'error-message', 'Message content cannot be empty.');
      isValid = false;
    } else {
      clearError(messageInput);
    }

    // If validations pass, show success overlay modal
    if (isValid) {
      // Simulate saving message log to local storage
      const sentMessages = JSON.parse(localStorage.getItem('sent-messages')) || [];
      sentMessages.push({
        id: Date.now(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        message: messageInput.value.trim(),
        date: new Date().toISOString()
      });
      localStorage.setItem('sent-messages', JSON.stringify(sentMessages));

      // Clear Form Fields
      form.reset();

      // Show Success Modal
      successOverlay.classList.add('active');
    }
  });

  // Modal Close event listeners
  successCloseBtn.addEventListener('click', () => {
    successOverlay.classList.remove('active');
  });

  successOverlay.addEventListener('click', (e) => {
    if (e.target === successOverlay) {
      successOverlay.classList.remove('active');
    }
  });

  // Error Helper Functions
  function showError(inputElement, errorDivId, message) {
    inputElement.classList.add('invalid');
    const errorDiv = document.getElementById(errorDivId);
    if (errorDiv) {
      errorDiv.innerText = message;
      errorDiv.style.display = 'block';
    }
  }

  function clearError(inputElement) {
    inputElement.classList.remove('invalid');
    // Map input element ID to its specific error div ID
    const elementId = inputElement.getAttribute('id');
    let errorId = '';
    if (elementId === 'contact-name') errorId = 'error-name';
    else if (elementId === 'contact-email') errorId = 'error-email';
    else if (elementId === 'contact-phone') errorId = 'error-phone';
    else if (elementId === 'contact-message') errorId = 'error-message';

    const errorDiv = document.getElementById(errorId);
    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
  }
}
