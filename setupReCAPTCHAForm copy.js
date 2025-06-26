function setupReCAPTCHAForm({ formSelector, redirectFields = null, redirectUrl = null }) {
  const siteKey = '6LcGI2grAAAAAN9XteKVEWbw1UK_Zle_0PDKpDaj'; // your reCAPTCHA v3 site key
  const verifyEndpoint = 'https://recaptchaverification.netlify.app/.netlify/functions/verify-recaptcha'; // change to your Netlify function URL

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

            // Call Netlify server function to validate token
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

              // Optional: Add token to form for logging
              let input = form.querySelector('textarea[name="g-recaptcha-response"]');
              if (!input) {
                input = document.createElement('textarea');
                input.name = 'g-recaptcha-response';
                input.style.display = 'none';
                form.appendChild(input);
              }
              input.value = token;

              
              if (!redirectFields || !redirectUrl) {
                form.dataset.skipCaptcha = 'true';
                form.requestSubmit();
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
                  return;
                }
              });

              observer.observe(wrapper, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
              });

              form.dataset.skipCaptcha = 'true';
              form.requestSubmit();
            })
            .catch(error => {
              console.error('Verification error:', error);
              alert('reCAPTCHA server error. Please try again.');
            });
          });
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}
