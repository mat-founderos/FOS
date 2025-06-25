document.addEventListener('DOMContentLoaded', () => {
  const redirectFields = ['firstname', 'email', 'phone'];
  const siteKey = '6LcGI2grAAAAAN9XteKVEWbw1UK_Zle_0PDKpDaj';

  document.querySelectorAll('.workshop-form-hubspot').forEach(form => {
    form.addEventListener('submit', e => {
      if (form.dataset.skipCaptcha === 'true') return;

      e.preventDefault();
      e.stopPropagation();

      if (!window.grecaptcha) return alert('reCAPTCHA not loaded');

      grecaptcha.ready(() => {
        grecaptcha.execute(siteKey, { action: 'submit' }).then(token => {
          if (!token || token.length < 10) return alert('reCAPTCHA failed');

          let input = form.querySelector('textarea[name="g-recaptcha-response"]');
          if (!input) {
            input = document.createElement('textarea');
            input.name = 'g-recaptcha-response';
            input.style.display = 'none';
            form.appendChild(input);
          }
          input.value = token;
          form.dataset.skipCaptcha = 'true';

          const wrapper = form.closest('.w-form');
          const observer = new MutationObserver(() => {
            const done = wrapper.querySelector('.w-form-done');
            if (done && done.offsetParent !== null) {
              observer.disconnect();
              const params = new URLSearchParams();
              redirectFields.forEach(id => {
                const val = form.querySelector(`#${id}`)?.value || '';
                params.append(id, val);
              });
              window.location.href = `/thank-you/workshop?${params}`;
            }
          });

          observer.observe(wrapper, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

          form.querySelector('[type="submit"]').click();
        });
      });
    });
  });
});
