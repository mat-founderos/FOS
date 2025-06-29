function isSpammyInput(e, t) {
  const o = e.toLowerCase();
  return ("firstname" === t || "lastname" === t) && e.length > 100
    ? "Please keep your response concise."
    : /([a-z]{3,})\1{2,}/i.test(e.replace(/[^a-z]/gi, ""))
    ? "Your response appears to repeat too often."
    : /[bcdfghjklmnpqrstvwxyz]{6,}/i.test(e) && !/\s/.test(e)
    ? "Please check your response for missing spaces or typos."
    : /@(tempmail|mailinator|sharklasers|guerrillamail)/i.test(o)
    ? "Please use a personal or business email, not a temporary one."
    : /asdf|sdfg|dfgh|fghj|hjkl|qwer|zxcv/i.test(o)
    ? "Please avoid using random key patterns."
    : /^[0-9]+@/.test(o)
    ? "Please use a valid email address, not one made of only numbers."
    : null;
}

document.addEventListener("DOMContentLoaded", (function () {
  const e = document.querySelectorAll("form"),
        t = document.querySelector(".work-email"),
        o = Date.now(),
        n = document.createElement("input");

  n.type = "hidden";
  n.name = "js-check";
  n.value = "valid-js-token";
  e.forEach((e => e.appendChild(n)));

  const a = navigator.userAgent.toLowerCase();
  if (["curl", "python", "scrapy", "httpclient", "wget", "node"].some((e => a.includes(e)))) {
    console.warn("Blocked by User-Agent filter.");
    document.body.innerHTML = "";
    return;
  }

  // ✅ Updated input listener to re-enable submit button if field is cleared
  t && t.addEventListener("input", function () {
    const disable = t.value.length > 0;
    document.querySelectorAll('input[type="submit"]').forEach((e) => {
      e.disabled = disable;
    });
  });

  e.forEach((e => {
    e.addEventListener("submit", (function (t) {
      const n = e.querySelector(".work-email");
      if (n && n.value.trim().length > 0) {
        t.preventDefault();
        t.stopImmediatePropagation();
        console.warn("Submission blocked by honeypot.");

        const o = {};
        e.querySelectorAll("input, select, textarea").forEach((e => {
          const t = e.name || e.id;
          if (!t) return;
          if ("checkbox" === e.type) o[t] = e.checked;
          else if ("radio" === e.type) e.checked && (o[t] = e.value);
          else o[t] = e.value.trim();
        }));

        fetch("https://founderos.app.n8n.cloud/webhook/spam-logger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "spam-detected",
            timestamp: (new Date).toISOString(),
            formData: o
          })
        }).then(() => {
          console.info("Partial spam submission sent.");
        }).catch((e => {
          console.error("Failed to send spam data:", e);
        }));
        return;
      }

      if ((Date.now() - o) / 1e3 < 5) {
        t.preventDefault();
        t.stopImmediatePropagation();
        console.warn("Submission blocked: too fast.");
        alert("Form submitted too quickly. Please take a moment before submitting.");
        return;
      }

      setTimeout(() => {
        document.querySelectorAll("form").forEach((e => {
          if (!e.querySelector('input[name="js-check"]')) {
            const t = document.createElement("input");
            t.type = "hidden";
            t.name = "js-check";
            t.value = "valid-js-token";
            e.appendChild(t);
          }
        }));
      }, 500);

      let a = !1,
          r = "";
      e.querySelectorAll("input:not([type='hidden']), textarea").forEach((e => {
        const t = e.name || "";
        if ("cf-turnstile-response" === t) return;
        if ("g-recaptcha-response" === t) return;
        const o = isSpammyInput(e.value.trim(), t);
        if (o && !a) {
          a = !0;
          r = o;
        }
      }));

      if (a) {
        t.preventDefault();
        t.stopImmediatePropagation();
        const o = e.querySelector(".spam-error-message");
        o && o.remove();
        const n = document.createElement("label");
        n.className = "spam-error-message";
        n.style.cssText = "color: red; display: block; margin-bottom: 10px; font-weight: normal;";
        n.textContent = r;
        const a = e.querySelector(".form-disclaimer-checkbox") || e.firstChild;
        e.insertBefore(n, a);
      }
    }), !0);
  }));
}));
