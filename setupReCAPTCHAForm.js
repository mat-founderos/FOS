function setupReCAPTCHAForm({
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

      // ensure HubSpot attribute persists
      const hubspotUrl = form.getAttribute('data-webflow-hubspot-api-form-url');
      if (hubspotUrl) {
        form.setAttribute('data-webflow-hubspot-api-form-url', hubspotUrl);
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
            if (!el) {
              console.warn(`setupReCAPTCHAForm: missing field #${id}`);
            }
            params.append(id, el?.value || '');
          });

          const go = () => {
            window.location.href = `${redirectUrl}?${params.toString()}`;
          };

          delay && Number(delay) > 0 ? setTimeout(go, Number(delay)) : go();
        }

        if (fail && fail.offsetParent !== null) {
          observer.disconnect();
          submitted = false; // allow resubmit
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