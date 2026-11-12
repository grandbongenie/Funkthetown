(function () {
  var body = document.body;

  if (!body || body.dataset.navDisabled === "true") {
    return;
  }

  var activeKey = body.dataset.navActive || "";
  var homeHref = body.dataset.navHome || "index.html?skipIntro=1";
  var links = [
    { key: "home", label: "Home", href: homeHref },
    { key: "music", label: "Music", href: "Funkthetown Music.html" },
    { key: "radio", label: "Radio", href: "Funkthetown Radio.html" },
    { key: "studio", label: "Studio", href: "Funkthetown Studio.html" },
    { key: "events", label: "Events", href: "Funkthetown Events.html" },
    { key: "dream", label: "Dream", href: "Funkthetown Dream.html" },
    { key: "clothes", label: "Clothes", href: "Funkthetown Clothes.html" },
    { key: "network", label: "Network", href: "https://discord.gg/qdRW8cN", external: true }
  ];

  var linkMarkup = links.map(function (item) {
    var classes = "ft-nav__link";
    if (item.key === activeKey) {
      classes += " is-active";
    }

    return (
      '<a class="' +
      classes +
      '" href="' +
      item.href +
      '"' +
      (item.external ? ' target="_blank" rel="noreferrer"' : "") +
      ">" +
      item.label +
      "</a>"
    );
  }).join("");

  var drawerMarkup = links.map(function (item) {
    var classes = "ft-nav__drawer-link";
    if (item.key === activeKey) {
      classes += " is-active";
    }

    return (
      '<a class="' +
      classes +
      '" href="' +
      item.href +
      '"' +
      (item.external ? ' target="_blank" rel="noreferrer"' : "") +
      ">" +
      item.label +
      "</a>"
    );
  }).join("");

  var navMarkup =
    '<nav class="ft-nav" aria-label="Main navigation">' +
    '<div class="ft-nav__shell">' +
    '<a class="ft-nav__brand" href="' + homeHref + '">' +
    '<span class="ft-nav__brand-mark"><img src="images/F2T_Logocircle.png" alt="Funkthetown"></span>' +
    '<span class="ft-nav__brand-copy">' +
    '<span class="ft-nav__brand-title">Funkthetown</span>' +
    '<span class="ft-nav__brand-subtitle">Paix Amour Harmonie</span>' +
    "</span>" +
    "</a>" +
    '<div class="ft-nav__links">' + linkMarkup + "</div>" +
    '<div class="ft-nav__actions">' +
    '<a class="ft-nav__cta" href="https://radio.funkthetown.net" target="_blank" rel="noreferrer">Listen Live</a>' +
    '<button class="ft-nav__toggle" type="button" aria-expanded="false" aria-controls="ft-nav-drawer">' +
    '<span class="ft-nav__toggle-label">Menu</span>' +
    '<span class="ft-nav__toggle-lines" aria-hidden="true"><span></span><span></span><span></span></span>' +
    "</button>" +
    "</div>" +
    "</div>" +
    '<div class="ft-nav__overlay" hidden></div>' +
    '<aside class="ft-nav__drawer" id="ft-nav-drawer" aria-hidden="true">' +
    '<div class="ft-nav__drawer-links">' + drawerMarkup + "</div>" +
    '<a class="ft-nav__drawer-link ft-nav__drawer-cta" href="https://radio.funkthetown.net" target="_blank" rel="noreferrer">Listen Live</a>' +
    "</aside>" +
    '<div class="ft-orientation-guard" aria-hidden="true">' +
    '<div class="ft-orientation-guard__inner">' +
    '<div class="ft-orientation-guard__phone" aria-hidden="true"></div>' +
    '<p class="ft-orientation-guard__title">Tournez votre telephone</p>' +
    '<p class="ft-orientation-guard__copy">Le site est optimise pour le mode paysage sur mobile.</p>' +
    "</div>" +
    "</div>" +
    "</nav>";

  body.classList.add("has-site-nav");
  body.insertAdjacentHTML("afterbegin", navMarkup);

  var nav = document.querySelector(".ft-nav");
  var toggle = nav.querySelector(".ft-nav__toggle");
  var overlay = nav.querySelector(".ft-nav__overlay");
  var drawer = nav.querySelector(".ft-nav__drawer");

  function setOpen(isOpen) {
    body.classList.toggle("ft-nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    drawer.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      overlay.removeAttribute("hidden");
    } else {
      overlay.setAttribute("hidden", "");
    }
  }

  function syncMobileOrientationState() {
    var isMobileViewport = window.matchMedia("(max-width: 932px)").matches;
    var isCoarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    var isPortrait = window.matchMedia("(orientation: portrait)").matches;
    var isMobileDevice = isMobileViewport && isCoarsePointer;

    body.classList.toggle("ft-mobile-device", isMobileDevice);
    body.classList.toggle("ft-mobile-portrait", isMobileDevice && isPortrait);
    body.classList.toggle("ft-mobile-landscape", isMobileDevice && !isPortrait);

    if (isMobileDevice && isPortrait && body.classList.contains("ft-nav-open")) {
      setOpen(false);
    }
  }

  function tryLockLandscape() {
    if (!screen.orientation || typeof screen.orientation.lock !== "function") {
      return;
    }

    screen.orientation.lock("landscape").catch(function () {});
  }

  toggle.addEventListener("click", function () {
    setOpen(!body.classList.contains("ft-nav-open"));
  });

  overlay.addEventListener("click", function () {
    setOpen(false);
  });

  drawer.addEventListener("click", function (event) {
    var link = event.target.closest(".ft-nav__drawer-link, .ft-nav__drawer-cta");

    if (!link) {
      return;
    }

    var href = link.getAttribute("href");
    var target = link.getAttribute("target");

    setOpen(false);

    if (!href) {
      return;
    }

    event.preventDefault();

    window.setTimeout(function () {
      if (target === "_blank") {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      window.location.assign(href);
    }, 80);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("ft-nav-open")) {
      setOpen(false);
    }
  });

  syncMobileOrientationState();
  window.addEventListener("resize", syncMobileOrientationState);
  window.addEventListener("orientationchange", syncMobileOrientationState);
  window.addEventListener("load", syncMobileOrientationState);
  document.addEventListener("click", tryLockLandscape, { once: true });
})();
