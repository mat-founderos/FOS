function setupReCAPTCHAForm({ formSelector, redirectFields = null, redirectUrl = null }) {
  const siteKey = '6LcGI2grAAAAAN9XteKVEWbw1UK_Zle_0PDKpDaj'; // fixed globally

  function initForms() {
    document.querySelectorAll(formSelector).forEach(form => {
      form.addEventListener('submit', e => {
        if (form.dataset.skipCaptcha === 'true') return;

        e.preventDefault();
        e.stopPropagation();

        if (!window.grecaptcha) {
          alert('reCAPTCHA not loaded');
          return;
        }

        grecaptcha.ready(() => {
          grecaptcha.execute(siteKey, { action: 'submit' }).then(token => {
            
            if (!token || token.length < 10) {
              alert('reCAPTCHA failed');
              return;
            }

            let input = form.querySelector('textarea[name="g-recaptcha-response"]');
            if (!input) {
              input = document.createElement('textarea');
              input.name = 'g-recaptcha-response';
              input.style.display = 'none';
              form.appendChild(input);
            }
            input.value = token;
            form.dataset.skipCaptcha = 'true';

            // If redirection is not required, just resubmit the form
            if (!redirectFields || !redirectUrl) {
              form.requestSubmit(); // safer than .click()
              return;
            }

            const wrapper = form.closest('.w-form');
            const observer = new MutationObserver(() => {
              const done = wrapper.querySelector('.w-form-done');
              if (done && done.offsetParent !== null) {
                observer.disconnect();

                // Clear skipCaptcha flag after submission
                delete form.dataset.skipCaptcha;

                const params = new URLSearchParams();
                redirectFields.forEach(id => {
                  const el = form.querySelector(`#${id}`);
                  if (!el) console.warn(`Missing field with id #${id}`);
                  params.append(id, el?.value || '');
                });

                window.location.href = `${redirectUrl}?${params}`;
              }
            });

            observer.observe(wrapper, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            });

            form.requestSubmit(); // safer than .click()
          }).catch(error => {
            console.error('reCAPTCHA error:', error);
            alert('reCAPTCHA error. Please try again.');
          });
        });
      });
    });
  }

  // Fix #1: Handle case where DOMContentLoaded already fired
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}
