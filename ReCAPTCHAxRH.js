function setupRHFormTracking() {
  document.querySelectorAll('.form-call').forEach(form => {
    form.addEventListener('submit', e => {
      const data = {
        name: form.querySelector('#firstname')?.value || '',
        email: form.querySelector('#email')?.value || '',
        phone_number: form.querySelector('#phone')?.value || '',
        extra_field: form.querySelector('#user_country_name')?.value || ''
      };

      RH.pendingReferral(data);
    });
  });
}


function setupReCAPTCHAxRHForm({ formSelector, redirectFields = null, redirectUrl = null }) {
  const siteKey = '6LcGI2grAAAAAN9XteKVEWbw1UK_Zle_0PDKpDaj';
  const verifyEndpoint = 'https://recaptchaverification.netlify.app/.netlify/functions/verify-recaptcha';

  function handleFormSubmit(e, form) {
    if (form.dataset.skipCaptcha === 'true') return;

    e.preventDefault();
    e.stopPropagation();

    const hubspotUrl = form.getAttribute('data-webflow-hubspot-api-form-url');
    form.removeAttribute('data-webflow-hubspot-api-form-url');

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

        fetch(verifyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
          .then(res => res.json())
          .then(data => {
            if (!data.success) {
              alert('reCAPTCHA verification failed. Please try again.');
              console.warn('Verification failed:', data);
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

            const submitForm = () => {
              form.dataset.skipCaptcha = 'true';
              form.setAttribute('data-webflow-hubspot-api-form-url', hubspotUrl);
              form.requestSubmit();
              setTimeout(() => {
                form.removeAttribute('data-webflow-hubspot-api-form-url');
              }, 500);
            };

            if (!redirectFields || !redirectUrl) {
              submitForm();
              return;
            }

            const wrapper = form.closest('.w-form');
            const observer = new MutationObserver(() => {
              const done = wrapper.querySelector('.w-form-done');
              const fail = wrapper.querySelector('.w-form-fail');

              if (done && done.offsetParent !== null) {
                observer.disconnect();
                delete form.dataset.skipCaptcha;

                const params = new URLSearchParams();
                redirectFields.forEach(id => {
                  const el = form.querySelector(`#${id}`);
                  if (!el) console.warn(`Missing field with id #${id}`);
                  params.append(id, el?.value || '');
                });

                window.location.href = `${redirectUrl}?${params}`;
              }

              if (fail && fail.offsetParent !== null) {
                observer.disconnect();
                delete form.dataset.skipCaptcha;
              }
            });

            observer.observe(wrapper, {
              childList: true,
              subtree: true,
              attributes: true,
              attributeFilter: ['style', 'class']
            });

            submitForm();
          })
          .catch(error => {
            console.error('Verification error:', error);
            alert('reCAPTCHA server error. Please try again.');
          });
      });
    });
  }

  function initForms() {
    document.querySelectorAll(formSelector).forEach(form => {
      form.addEventListener('submit', e => handleFormSubmit(e, form));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}

