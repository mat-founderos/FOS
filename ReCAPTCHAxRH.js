function setupReCAPTCHAxRHForm({
  formSelector,
  redirectFields = null,
  redirectUrl = null,
  delay = 0
}) {

  function attachHandler(form) {
    let submitted = false;

    form.addEventListener('submit', () => {
      if (submitted) return;
      submitted = true;

      // ensure HubSpot attribute stays intact
      const hubspotUrl = form.getAttribute('data-webflow-hubspot-api-form-url');
      if (hubspotUrl) {
        form.setAttribute('data-webflow-hubspot-api-form-url', hubspotUrl);
      }

      // RH.pendingReferral
      try {
        const data = {
          name: form.querySelector('#firstname, #first_name')?.value || '',
          email: form.querySelector('#email')?.value || ''
        };

        if (window.RH && typeof RH.pendingReferral === 'function') {
          RH.pendingReferral(data);
        }
      } catch (err) {
        console.warn('RH.pendingReferral failed:', err);
      }
      
      // no redirect configured → nothing else to do
      if (!redirectFields || !redirectUrl) return;

      const wrapper = form.closest('.w-form');
      if (!wrapper) return;

      const observer = new MutationObserver(() => {
        const done = wrapper.querySelector('.w-form-done');
        const fail = wrapper.querySelector('.w-form-fail');

        if (done && done.offsetParent !== null) {
          observer.disconnect();

          const params = new URLSearchParams();
          redirectFields.forEach(id => {
            const el = form.querySelector(`#${id}`);
            if (!el) console.warn(`Missing field with id #${id}`);
            params.append(id, el?.value || '');
          });

          const go = () => {
            window.location.href = `${redirectUrl}?${params}`;
          };

          delay && Number(delay) > 0 ? setTimeout(go, Number(delay)) : go();
        }

        if (fail && fail.offsetParent !== null) {
          observer.disconnect();
          submitted = false; // allow retry
        }
      });

      observer.observe(wrapper, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    });
  }

  function initForms() {
    document.querySelectorAll(formSelector).forEach(attachHandler);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initForms);
  } else {
    initForms();
  }
}