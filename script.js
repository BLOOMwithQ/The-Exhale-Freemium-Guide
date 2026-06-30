/* =====================================================================
   THE EXHALE — BLOOM with Quadia
   Interactions: scroll reveal, gentle parallax, sticky header,
   single-open accordion, graceful form handoff.
   All motion respects prefers-reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- SCROLL REVEAL ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    reveals.forEach(function (el) {
      io.observe(el);
      // reveal anything already in view on load
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) && r.bottom > 0) el.classList.add("in");
    });

    // failsafe: never leave content hidden
    setTimeout(function () {
      document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
        el.classList.add("in");
      });
    }, 1600);
  }

  /* ---------- GENTLE PARALLAX ON PHOTOS ---------- */
  var paraEls = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  if (!reduce && paraEls.length) {
    var ticking = false;
    var vh = window.innerHeight || 800;

    function applyParallax() {
      ticking = false;
      paraEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return; // offscreen, skip
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.06;
        // position of element center relative to viewport center, -1..1
        var center = rect.top + rect.height / 2;
        var offset = (center - vh / 2) / vh; // negative above center
        var shift = -offset * speed * vh;     // subtle drift
        el.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
      });
    }
    function requestParallax() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(applyParallax); }
    }
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", function () { vh = window.innerHeight; requestParallax(); }, { passive: true });
    applyParallax();
  }

  /* ---------- STICKY HEADER ---------- */
  var nav = document.getElementById("siteNav");
  if (nav) {
    var trigger = 560;
    function onScroll() {
      if (window.scrollY > trigger) nav.classList.add("show");
      else nav.classList.remove("show");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- SINGLE-OPEN ACCORDION ---------- */
  var qas = document.querySelectorAll("details.qa");
  qas.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        qas.forEach(function (o) { if (o !== d) o.removeAttribute("open"); });
      }
    });
  });

  /* ---------- FORM HANDOFF ---------- */
  /* If the form still points at the placeholder action, we do NOT post to a
     dead URL. Instead we save the email locally and send the visitor to the
     thank-you page, so the experience never breaks while MailerLite is wired.
     Once a real MailerLite action URL is in place, the native post proceeds
     and (if data-redirect is present) we follow it after a short beat. */
  var forms = document.querySelectorAll("form.signup");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      var action = (form.getAttribute("action") || "").trim();
      var redirect = form.getAttribute("data-redirect");
      var emailField = form.querySelector('input[type="email"]');
      var unwired = !action || action.indexOf("REPLACE_WITH_") === 0;

      if (unwired) {
        // No live endpoint yet — graceful local handoff.
        ev.preventDefault();
        try {
          if (emailField && emailField.value) {
            localStorage.setItem("exhale_email", emailField.value);
          }
        } catch (e) {}
        if (redirect) { window.location.href = redirect; }
        return;
      }

      // Live MailerLite endpoint present.
      // If a same-tab redirect is desired and the form opens in a new tab,
      // honor data-redirect after letting the post fire.
      if (redirect && form.getAttribute("target") === "_blank") {
        setTimeout(function () { window.location.href = redirect; }, 400);
      }
    });
  });

})();
