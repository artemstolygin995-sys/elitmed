(() => {
  "use strict";
  const data = window.ELITMED_DATA || { services: [], doctors: [], products: [], preparations: [], certificates: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => matchMedia("(max-width:700px), (pointer:coarse)").matches;
  const esc = (v = "") => String(v).replace(/[&<>'"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c]));
  const two = n => String(n).padStart(2, "0");
  const clean = (v = "") => String(v).replace(/\s+/g, " ").replace(/…\s*[^.]{0,70}$/u, "…").trim();
  const capitalizeFirst = (v = "") => { const text = clean(v); return text ? text.replace(/^([а-яёa-z])/u, m => m.toUpperCase()) : text; };

  let toastTimer;
  function toast(message) { const node = $("#toast"); if (!node) return; node.textContent = message; node.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove("is-visible"), 2600); }

  addEventListener("load", () => setTimeout(() => $(".page-intro")?.classList.add("is-hidden"), reduceMotion ? 0 : 950));

  // Keep scroll work on the compositor/frame boundary instead of doing it on every raw scroll event.
  const headerNode = $(".header");
  let headerScrolled = scrollY > 18;
  let scrollFrame = 0;
  let scrollIdleTimer = 0;
  let scrolling = false;
  headerNode?.classList.toggle("is-scrolled", headerScrolled);
  const markScrollIdle = () => {
    scrolling = false;
    document.body.classList.remove("is-scrolling");
  };
  addEventListener("scroll", () => {
    if (!scrolling) {
      scrolling = true;
      document.body.classList.add("is-scrolling");
    }
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = setTimeout(markScrollIdle, 140);
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const next = scrollY > 18;
      if (next !== headerScrolled) {
        headerScrolled = next;
        headerNode?.classList.toggle("is-scrolled", next);
      }
    });
  }, { passive:true });

  $$('[data-delay]').forEach(n => n.style.setProperty("--delay", `${n.dataset.delay}ms`));
  if ("IntersectionObserver" in window && !reduceMotion) { const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }), { threshold:.08, rootMargin:"0px 0px -5%" }); $$(".reveal-organic").forEach(n => io.observe(n)); } else $$(".reveal-organic").forEach(n => n.classList.add("is-visible"));

  // Move the decorative glow with a transform and at most once per animation frame.
  // Unlike changing left/top this does not force layout while the pointer moves.
  if (!reduceMotion && matchMedia("(pointer:fine)").matches) {
    const glow = $(".garden-glow");
    let glowFrame = 0, glowX = innerWidth * .5, glowY = innerHeight * .5;
    const paintGlow = () => {
      glowFrame = 0;
      if (glow) glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
    };
    paintGlow();
    addEventListener("pointermove", e => {
      if (!glow || scrolling) return;
      glowX = e.clientX; glowY = e.clientY;
      if (!glowFrame) glowFrame = requestAnimationFrame(paintGlow);
    }, { passive:true });
  }

  const veil = $(".page-veil");
  let lastFocus = null;
  let pageScrollAnimation = 0;
  function smoothScrollTo(target) {
    if (!target) return;
    cancelAnimationFrame(pageScrollAnimation);
    const header = $(".header");
    const end = Math.max(0, target.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 0));
    if (reduceMotion) { window.scrollTo({ top:end, left:0, behavior:"auto" }); return; }
    window.scrollTo({ top:end, left:0, behavior:"smooth" });
  }
  function syncVeil() { const active = Boolean($(".drawer.is-open, .detail-modal.is-open")); veil?.classList.toggle("is-visible", active); veil?.setAttribute("aria-hidden", String(!active)); document.body.classList.toggle("is-locked", active || $(".document-viewer.is-open")); }
  function closeDrawers(restore = true) { $$(".drawer.is-open").forEach(d => { d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); }); syncVeil(); if (restore) lastFocus?.focus?.(); }
  function closeDrawersForNavigation() {
    const openDrawers = $$(".drawer.is-open");
    if (!openDrawers.length) return;
    document.body.classList.add("is-drawer-jump");
    openDrawers.forEach(d => {
      d.classList.add("is-closing-instant");
      d.classList.remove("is-open");
      d.setAttribute("aria-hidden", "true");
    });
    syncVeil();
    requestAnimationFrame(() => {
      openDrawers.forEach(d => d.classList.remove("is-closing-instant"));
      document.body.classList.remove("is-drawer-jump");
    });
  }
  function openDrawer(name, trigger = document.activeElement) { const drawer = $(`#drawer-${name}`); if (!drawer) return; if (!$(".drawer.is-open")) lastFocus = trigger; closeDrawers(false); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); syncVeil(); setTimeout(() => $("button,input,a", drawer)?.focus(), reduceMotion ? 0 : 220); }
  document.addEventListener("click", e => {
    const opener = e.target.closest("[data-drawer]");
    if (opener) { e.preventDefault(); const target = opener.dataset.scroll; if (target) smoothScrollTo($(target)); openDrawer(opener.dataset.drawer, opener); return; }
    const hashLink = e.target.closest('a[href^="#"]');
    if (hashLink) {
      const target = $(hashLink.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (hashLink.closest(".drawer")) closeDrawersForNavigation();
      else if (e.target.closest("[data-drawer-close]")) closeDrawers(false);
      if (hashLink.matches(".scroll-bud, .footer-flower")) {
        cancelAnimationFrame(pageScrollAnimation);
        scrollTo(0, Math.max(0, target.getBoundingClientRect().top + scrollY));
      } else {
        smoothScrollTo(target);
      }
      history.replaceState(null, "", hashLink.getAttribute("href"));
      return;
    }
    if (e.target.closest("[data-drawer-close]")) closeDrawers();
  });
  veil?.addEventListener("click", () => { closeDetail(); closeDrawers(); });

  $$('[data-phone]').forEach(link => link.addEventListener("click", async e => {
    if (mobile()) return;
    e.preventDefault(); const number = link.dataset.phone;
    try { await navigator.clipboard.writeText(number); } catch { const input = document.createElement("textarea"); input.value = number; document.body.append(input); input.select(); document.execCommand("copy"); input.remove(); }
    toast("Скопировано");
  }));

  const priceFor = title => {
    const t = title.toLowerCase();
    if (/мexa|механич/.test(t)) return "2 500–3 500 ₽";
    if (/sylfirm/.test(t)) return "от 20 500 ₽";
    if (/profacial/.test(t)) return "от 4 500 ₽";
    if (/prp|плазм/.test(t)) return "от 5 000 ₽";
    if (/узи/.test(t)) return "от 1 500 ₽";
    if (/нитев/.test(t)) return "от 20 000 ₽";
    if (/липолит/.test(t)) return "от 6 000 ₽";
    if (/мезотерап/.test(t)) return "от 4 500 ₽";
    if (/ботул|ксеомин|диспорт/.test(t)) return "от 200 ₽ / ед.";
    if (/контур|филлер/.test(t)) return "от 18 500 ₽";
    if (/биоревитал/.test(t)) return "от 6 500 ₽";
    if (/сосуд/.test(t)) return "от 500 ₽";
    if (/эпиляц/.test(t)) return "от 800 ₽";
    if (/чистк|пилинг|карбокс|diamond|дермабраз/.test(t)) return "от 2 500 ₽";
    if (/процедур/.test(t)) return "от 500 ₽";
    return "Стоимость после консультации";
  };

  const detail = $("#detail-modal");
  function openDetail(item, kind, price = "") { if (!detail) return; $("#detail-kind").textContent = kind; $("#detail-title").textContent = item.title; $("#detail-price").textContent = price; $("#detail-price").hidden = !price; $("#detail-description").textContent = capitalizeFirst(item.description || "Подробную информацию можно получить у администратора клиники."); const img = $(".detail-media img", detail); img.src = item.image; img.alt = item.title; detail.classList.add("is-open"); detail.setAttribute("aria-hidden", "false"); syncVeil(); }
  function closeDetail() { detail?.classList.remove("is-open"); detail?.setAttribute("aria-hidden", "true"); syncVeil(); }
  $("[data-detail-close]")?.addEventListener("click", closeDetail);

  const servicesList = $("#drawer-services-list");
  function renderServices() { const q = ($("#service-search")?.value || "").trim().toLowerCase(); const list = data.services.filter(x => `${x.title} ${x.description}`.toLowerCase().includes(q)); servicesList.innerHTML = list.map(x => `<article class="service-row"><button type="button" data-service="${esc(x.id)}"><img src="${esc(x.image)}" alt="" width="96" height="96" loading="lazy" decoding="async"><span><b>${esc(x.title)}</b><strong>${esc(priceFor(x.title))}</strong></span></button></article>`).join("") || '<p class="legal-note">Ничего не найдено.</p>'; }
  renderServices();
  $("#service-search")?.addEventListener("input", renderServices);
  servicesList?.addEventListener("click", e => { const b = e.target.closest("[data-service]"); if (!b) return; const item = data.services.find(x => String(x.id) === b.dataset.service); if (item) openDetail(item, "Услуга ElitMed", priceFor(item.title)); });

  const doctorsList = $("#drawer-doctors-list");
  if (doctorsList) doctorsList.innerHTML = data.doctors.map(d => `<article class="doctor-row"><img src="${esc(d.image)}" alt="${esc(d.title)}" width="420" height="520" loading="lazy" decoding="async"><div><small>Специалист ElitMed</small><h3>${esc(d.title)}</h3><p>${esc(capitalizeFirst(d.description))}</p><a href="https://n1601618.yclients.com" target="_blank" rel="noopener">Записаться →</a></div></article>`).join("");
  data.doctors.forEach(d => { const image = new Image(); image.decoding = "async"; image.src = d.image; });

  const doctorQuotes = ["«Красивый результат — тот, в котором вы узнаёте себя»","«Уход начинается с внимательного отношения к индивидуальности»","«Современная косметология — это точность и чувство меры»","«Здоровая кожа всегда выглядит естественно красиво»","«Точность диагностики начинается с внимания к человеку»","«Понятное объяснение — важная часть хорошей диагностики»"];
  const doctorRoles = ["Основатель клиники · ведущий врач-косметолог","Косметолог-эстет","Врач-косметолог","Врач-дерматовенеролог · косметолог","Врач УЗИ · гинеколог","Врач ультразвуковой диагностики"];
  const featuredDoctorIndexes = data.doctors.map((_, index) => index).filter(index => index < 4);
  let featuredDoctorPosition = 0;
  const nameView = title => { const p = title.split(" "); return p.length > 2 ? `${p.slice(1).join(" ")}<br>${p[0]}` : title; };
  function showDoctor(index, position = featuredDoctorIndexes.indexOf(index)) { const section = $(".doctor-feature"), d = data.doctors[index]; if (!section || !d) return; section.classList.add("is-switching"); const preload = new Image(); preload.decoding = "async"; preload.src = d.image; const update = () => setTimeout(() => { const img = $("#doctor-feature-image"); img.src = d.image; img.alt = d.title; $("#doctor-feature-role").textContent = doctorRoles[index] || "Специалист ElitMed"; $("#doctor-feature-quote").textContent = doctorQuotes[index] || doctorQuotes[0]; $("#doctor-feature-title").innerHTML = nameView(esc(d.title)); $("#doctor-feature-description").textContent = capitalizeFirst(d.description); const visiblePosition = position >= 0 ? position : 0; $("#doctor-count").textContent = `${two(visiblePosition + 1)} / ${two(featuredDoctorIndexes.length)}`; section.classList.remove("is-switching"); }, reduceMotion ? 0 : 300); if (preload.complete) update(); else { preload.onload = update; preload.onerror = update; } }
  if (featuredDoctorIndexes.length > 1 && !reduceMotion) setInterval(() => { if (document.body.classList.contains("is-scrolling")) return; featuredDoctorPosition = (featuredDoctorPosition + 1) % featuredDoctorIndexes.length; showDoctor(featuredDoctorIndexes[featuredDoctorPosition], featuredDoctorPosition); }, 6000);

  const shelf = $("#product-shelf");
  const selectByIds = (source, ids) => ids.map(id => source.find(x => Number(x.id) === id)).filter(Boolean);
  const uniqueShelfItems = items => {
    const seen = new Set();
    return items.filter(item => {
      if (!item) return false;
      const key = `${item._source || "item"}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const featuredCosmetics = selectByIds(data.products, [2787, 2785, 2760, 2765, 2762, 2763]);
  const extraCosmetics = data.products.filter(x => !featuredCosmetics.some(y => Number(y.id) === Number(x.id))).slice(0, 4);
  const baseShelfItems = uniqueShelfItems([
    ...featuredCosmetics.map(x => ({...x,_kind:"Косметика",_source:"products"})),
    ...extraCosmetics.map(x => ({...x,_kind:"Косметика",_source:"products"})),
    ...data.preparations.slice(0,6).map(x => ({...x,_kind:"Препарат",_source:"preparations"}))
  ]);
  if (shelf && baseShelfItems.length) {
    const cloneCount = Math.min(4, baseShelfItems.length);
    const loopedShelfItems = [
      ...baseShelfItems.slice(-cloneCount),
      ...baseShelfItems,
      ...baseShelfItems.slice(0, cloneCount)
    ];
    shelf.innerHTML = loopedShelfItems.map((x, i) => {
      const realIndex = ((i - cloneCount) % baseShelfItems.length + baseShelfItems.length) % baseShelfItems.length;
      return `<button class="shelf-product" type="button" data-shelf-real-index="${realIndex}"><img src="${esc(x.image)}" alt="${esc(x.title)}" width="320" height="360" loading="lazy" decoding="async"><small>${esc(x._kind)}</small><span>${two(realIndex + 1)} · ${esc(x.title)}</span></button>`;
    }).join("");
    const getShelfStep = () => {
      const card = $(".shelf-product", shelf);
      if (!card) return Math.max(240, shelf.clientWidth * .4);
      const styles = getComputedStyle(shelf);
      const gap = parseFloat(styles.columnGap || styles.gap || 14) || 14;
      return card.getBoundingClientRect().width + gap;
    };
    const jumpToShelfStart = () => { shelf.scrollLeft = getShelfStep() * cloneCount; };
    requestAnimationFrame(jumpToShelfStart);
    addEventListener("resize", () => requestAnimationFrame(jumpToShelfStart), { passive:true });
    let shelfFixFrame = 0;
    const normalizeShelfLoop = () => {
      const step = getShelfStep();
      const baseSpan = step * baseShelfItems.length;
      const minEdge = step * (cloneCount - .5);
      const maxEdge = step * (cloneCount + baseShelfItems.length - .5);
      if (shelf.scrollLeft < minEdge) shelf.scrollLeft += baseSpan;
      else if (shelf.scrollLeft > maxEdge) shelf.scrollLeft -= baseSpan;
    };
    shelf.addEventListener("scroll", () => {
      if (shelfFixFrame) return;
      shelfFixFrame = requestAnimationFrame(() => {
        shelfFixFrame = 0;
        normalizeShelfLoop();
      });
    }, { passive:true });
    shelf.addEventListener("click", e => {
      const b = e.target.closest("[data-shelf-real-index]");
      if (!b) return;
      const item = baseShelfItems[Number(b.dataset.shelfRealIndex)];
      if (item) openDetail(item, item._kind);
    });
    shelf.addEventListener("dragstart", e => e.preventDefault());
    let shelfAnimation = 0;
    function moveShelf(direction) {
      cancelAnimationFrame(shelfAnimation);
      const start = shelf.scrollLeft;
      const end = start + direction * getShelfStep();
      if (reduceMotion) { shelf.scrollLeft = end; normalizeShelfLoop(); return; }
      const started = performance.now();
      const duration = 420;
      const frame = now => {
        const t = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        shelf.scrollLeft = start + (end - start) * eased;
        if (t < 1) shelfAnimation = requestAnimationFrame(frame);
        else normalizeShelfLoop();
      };
      shelfAnimation = requestAnimationFrame(frame);
    }
    $("[data-shelf-prev]")?.addEventListener("click", () => moveShelf(-1));
    $("[data-shelf-next]")?.addEventListener("click", () => moveShelf(1));
  }

  let catalogTab = "products", catalogQuery = "", catalogLimit = 12;
  const catalogGrid = $("#drawer-catalog-grid"), catalogSwitch = $(".catalog-switch");
  function renderCatalog() { const source = catalogTab === "products" ? data.products : data.preparations; const filtered = source.filter(x => `${x.title} ${x.description || ""}`.toLowerCase().includes(catalogQuery)); catalogGrid.innerHTML = filtered.slice(0,catalogLimit).map(x => `<button class="catalog-item" type="button" data-catalog-item="${esc(x.id)}"><img src="${esc(x.image)}" alt="${esc(x.title)}" width="320" height="320" loading="lazy" decoding="async"><small>${catalogTab === "products" ? "Профессиональная косметика" : "Препарат"}</small><h3>${esc(x.title)}</h3></button>`).join("") || '<p class="legal-note">Ничего не найдено.</p>'; $("#catalog-more")?.toggleAttribute("hidden", catalogLimit >= filtered.length); }
  renderCatalog();
  $$('[data-catalog-tab]').forEach(b => b.addEventListener("click", () => { if (b.dataset.catalogTab === catalogTab) return; catalogGrid.classList.add("is-switching"); $$('[data-catalog-tab]').forEach(x => x.classList.toggle("is-active", x === b)); catalogTab = b.dataset.catalogTab; catalogQuery = ""; catalogLimit = 12; catalogSwitch.classList.toggle("is-preparations", catalogTab === "preparations"); const s = $("#catalog-search"); if (s) s.value = ""; setTimeout(() => { renderCatalog(); catalogGrid.classList.remove("is-switching"); }, 280); }));
  $("#catalog-search")?.addEventListener("input", e => { catalogQuery = e.target.value.trim().toLowerCase(); catalogLimit = 12; renderCatalog(); });
  $("#catalog-more")?.addEventListener("click", () => { catalogLimit += 12; renderCatalog(); });
  catalogGrid?.addEventListener("click", e => { const b = e.target.closest("[data-catalog-item]"); if (!b) return; const source = catalogTab === "products" ? data.products : data.preparations; const item = source.find(x => String(x.id) === b.dataset.catalogItem); if (item) openDetail(item, catalogTab === "products" ? "Профессиональная косметика" : "Препарат"); });

  const reviews = [
    ["«Внимательный коллектив, профессиональный подход и результат, которым я очень довольна».","Ольга · пациент ElitMed"],
    ["«Асмик Манвеловна знает и всей душой любит своё дело. Администраторы всегда внимательны и всё подробно объясняют».","Надежда · пациент ElitMed"],
    ["«Профессиональный подход и минимальный период восстановления. Очень рада, что обратилась именно сюда».","Татьяна · пациент ElitMed"],
    ["«Приветливый персонал, уютная клиника, врач УЗИ всё объяснила и рассказала».","Александра · пациент ElitMed"],
    ["«Спасибо за индивидуальный подход, профессионализм и хороший результат».","Юлия · пациент ElitMed"]
  ];
  let reviewIndex = 0;
  const REVIEW_DELAY = 6000;
  let reviewTimer;
  function startReviewProgress() { const progress = $(".review-progress"); if (!progress) return; progress.classList.remove("is-running"); void progress.offsetWidth; progress.classList.add("is-running"); }
  function scheduleReview() { clearTimeout(reviewTimer); startReviewProgress(); if (!reduceMotion) reviewTimer = setTimeout(nextReview, REVIEW_DELAY); }
  function nextReview() { if (document.body.classList.contains("is-scrolling")) { reviewTimer = setTimeout(nextReview, 500); return; } const box = $(".review-peek"); if (!box) return; box.classList.add("is-switching"); setTimeout(() => { reviewIndex = (reviewIndex + 1) % reviews.length; $("#review-text").textContent = reviews[reviewIndex][0]; $("#review-author").textContent = reviews[reviewIndex][1]; box.classList.remove("is-switching"); scheduleReview(); }, 420); }
  if (!reduceMotion) { scheduleReview(); $(".review-peek")?.addEventListener("mouseenter", () => { clearTimeout(reviewTimer); $(".review-progress")?.classList.remove("is-running"); }); $(".review-peek")?.addEventListener("mouseleave", scheduleReview); }

  const documentsGrid = $("#documents-grid");
  if (documentsGrid) documentsGrid.innerHTML = data.certificates.map((x,i) => `<button class="document-item" type="button" data-document="${i}" aria-label="Открыть документ ${i+1}"><img src="${esc(x.image)}" alt="Документ ElitMed ${i+1}" width="1024" height="745" loading="lazy" decoding="async"></button>`).join("");
  let documentIndex = 0; const viewer = $("#document-viewer");
  function showDocument(index, direction = 1) { if (!viewer || !data.certificates.length) return; viewer.style.setProperty("--viewer-shift", `${direction * 25}px`); viewer.classList.add("is-switching"); setTimeout(() => { documentIndex = (index + data.certificates.length) % data.certificates.length; $("img", viewer).src = data.certificates[documentIndex].image; viewer.classList.add("is-open"); viewer.setAttribute("aria-hidden","false"); viewer.classList.remove("is-switching"); document.body.classList.add("is-locked"); }, viewer.classList.contains("is-open") ? 260 : 0); }
  function closeViewer() { viewer?.classList.remove("is-open"); viewer?.setAttribute("aria-hidden","true"); syncVeil(); }
  documentsGrid?.addEventListener("click", e => { const b = e.target.closest("[data-document]"); if (b) showDocument(Number(b.dataset.document)); });
  $("[data-viewer-close]")?.addEventListener("click", closeViewer); $(".viewer-prev")?.addEventListener("click", () => showDocument(documentIndex-1,-1)); $(".viewer-next")?.addEventListener("click", () => showDocument(documentIndex+1,1));

  const safeJSON = key => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } };
  async function hash(v) { if (crypto?.subtle) { const bytes = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v)); return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join(""); } return btoa(unescape(encodeURIComponent(v))); }
  const loginForm = $("#login-form"), registerForm = $("#register-form"), accountShell = $("#drawer-account .account-shell");
  function switchAuthTab(tab) {
    const isLogin = tab === "login";
    $$('[data-auth-tab]').forEach(x => x.classList.toggle("is-active", x.dataset.authTab === tab));
    $("#account-title").textContent = isLogin ? "Ваш личный кабинет" : "Создать кабинет";
    const incoming = isLogin ? loginForm : registerForm;
    const outgoing = isLogin ? registerForm : loginForm;
    if (!incoming || !outgoing) return;
    if (incoming.classList.contains("is-active")) return;
    accountShell?.classList.add("is-switching");
    outgoing.classList.remove("is-active");
    incoming.hidden = false;
    requestAnimationFrame(() => incoming.classList.add("is-active"));
    setTimeout(() => {
      outgoing.hidden = true;
      accountShell?.classList.remove("is-switching");
    }, reduceMotion ? 0 : 240);
  }
  loginForm && (loginForm.hidden = false, loginForm.classList.add("is-active"));
  registerForm && (registerForm.hidden = true, registerForm.classList.remove("is-active"));
  $$('[data-auth-tab]').forEach(b => b.addEventListener("click", () => switchAuthTab(b.dataset.authTab)));
  $("#register-form")?.addEventListener("submit", async e => { e.preventDefault(); const f = new FormData(e.currentTarget), user = { name:String(f.get("name")).trim(), email:String(f.get("email")).trim().toLowerCase(), password:await hash(String(f.get("password"))) }; localStorage.setItem("elitmedUser",JSON.stringify(user)); localStorage.setItem("elitmedSession",JSON.stringify({name:user.name,email:user.email})); closeDrawers(false); toast("Личный кабинет создан"); e.currentTarget.reset(); });
  $("#login-form")?.addEventListener("submit", async e => { e.preventDefault(); const f = new FormData(e.currentTarget), user = safeJSON("elitmedUser"); if (!user || user.email !== String(f.get("email")).trim().toLowerCase() || user.password !== await hash(String(f.get("password")))) return toast("Проверьте email и пароль"); localStorage.setItem("elitmedSession",JSON.stringify({name:user.name,email:user.email})); closeDrawers(false); toast(`Здравствуйте, ${user.name.split(" ")[0]}!`); e.currentTarget.reset(); });
  $("#callback-form")?.addEventListener("submit", e => { e.preventDefault(); closeDrawers(false); toast("Спасибо! Администратор скоро свяжется с вами"); e.currentTarget.reset(); });
  const cookie = $("#cookie"); if (localStorage.getItem("elitmedCookies")) cookie?.classList.add("is-hidden"); $$('[data-cookie]').forEach(b => b.addEventListener("click", () => { localStorage.setItem("elitmedCookies",b.dataset.cookie); cookie?.classList.add("is-hidden"); }));
  addEventListener("keydown", e => { if (e.key !== "Escape") return; if (viewer?.classList.contains("is-open")) closeViewer(); else if (detail?.classList.contains("is-open")) closeDetail(); else closeDrawers(); });
})();
