/* Brew Haven Coffee Co. — site interactions */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // prices are kept in cents so totals never pick up floating-point errors
  const money = cents => '$' + (cents / 100).toFixed(2);

  /* ---------- Header state ---------- */
  const header = $('#siteHeader');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.main-nav a');
  if ('IntersectionObserver' in window) {
    const onSection = entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === id));
    });
    const opts = { rootMargin: '-45% 0px -50% 0px' };
    let navObserver;
    // root: document keeps rootMargin working when the page is shown inside an iframe
    try { navObserver = new IntersectionObserver(onSection, { ...opts, root: document }); }
    catch { navObserver = new IntersectionObserver(onSection, opts); }
    navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean).forEach(s => navObserver.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#mobileMenu');
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960 && !menu.hidden) setMenu(false); });

  /* ---------- Image fade-in over the blurred placeholder ---------- */
  $$('.fade-img').forEach(img => {
    const done = () => img.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
  });

  /* ---------- About: Learn More ---------- */
  const aboutBtn = $('#aboutToggle');
  const aboutMore = $('#aboutMore');
  aboutBtn.addEventListener('click', () => {
    const open = aboutMore.hidden;
    aboutMore.hidden = !open;
    aboutBtn.setAttribute('aria-expanded', String(open));
    $('span', aboutBtn).textContent = open ? 'Show Less' : 'Learn More';
    $('.arrow', aboutBtn).style.transform = open ? 'rotate(-90deg)' : '';
  });

  /* ---------- Popular picks carousel ---------- */
  const track = $('#picksTrack');
  const prev = $('.carousel .prev');
  const next = $('.carousel .next');
  const stepSize = () => $('.card', track).getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 20);
  const updateArrows = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  prev.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  /* ---------- Glass cards: 3D tilt + glare ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    $$('.card').forEach(card => {
      let frame = 0;
      card.addEventListener('pointermove', e => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const g = $('.card-glass', card).getBoundingClientRect();
          card.classList.add('is-tilting');
          card.style.setProperty('--ry', ((px - 0.5) * 12).toFixed(2) + 'deg');
          card.style.setProperty('--rx', ((0.5 - py) * 10).toFixed(2) + 'deg');
          card.style.setProperty('--mx', ((e.clientX - g.left) / g.width * 100).toFixed(1) + '%');
          card.style.setProperty('--my', ((e.clientY - g.top) / g.height * 100).toFixed(1) + '%');
        });
      });
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Menu tabs ---------- */
  const tabs = $$('[role="tab"]');
  const menuImgs = $$('.menu-media img');
  const selectTab = (tab, focus = false) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    menuImgs.forEach(img => img.classList.toggle('is-active', img.dataset.tab === tab.dataset.tab));
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', e => {
      const keys = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (e.key in keys) { e.preventDefault(); selectTab(tabs[keys[e.key]], true); }
    });
  });

  /* ---------- FAQ links in the footer open the right answer ---------- */
  $$('[data-faq]').forEach(link => link.addEventListener('click', () => {
    const item = document.getElementById(link.dataset.faq);
    if (!item) return;
    item.open = true;
    item.classList.remove('flash'); void item.offsetWidth; item.classList.add('flash');
    setTimeout(() => item.classList.remove('flash'), 1600);
  }));

  /* =========================================================
     Cart
     ========================================================= */
  // prices in US cents; keep in sync with the prices shown in index.html
  const CATALOG = {
    'espresso':           { name: 'Espresso', price: 325, img: 'images/p-espresso-480.webp' },
    'americano':          { name: 'Americano', price: 375 },
    'cappuccino':         { name: 'Cappuccino', price: 450, img: 'images/p-cappuccino-480.webp' },
    'latte':              { name: 'Café Latte', price: 475 },
    'mocha':              { name: 'Mocha', price: 525, img: 'images/p-mocha-480.webp' },
    'hazelnut-latte':     { name: 'Hazelnut Latte', price: 550 },
    'iced-caramel-latte': { name: 'Iced Caramel Latte', price: 575, img: 'images/p-iced-caramel-480.webp' },
    'cold-brew':          { name: 'Cold Brew', price: 495, img: 'images/p-cold-brew-480.webp' },
    'iced-americano':     { name: 'Iced Americano', price: 425 },
    'vanilla-frappe':     { name: 'Vanilla Frappé', price: 625 },
    'espresso-tonic':     { name: 'Espresso Tonic', price: 550 },
    'chai-latte':         { name: 'Chai Latte', price: 475 },
    'matcha-latte':       { name: 'Matcha Latte', price: 575, img: 'images/p-matcha-480.webp' },
    'hot-chocolate':      { name: 'Hot Chocolate', price: 450 },
    'earl-grey':          { name: 'Earl Grey', price: 350 },
    'butter-croissant':   { name: 'Butter Croissant', price: 395, bake: true },
    'almond-croissant':   { name: 'Almond Croissant', price: 475, bake: true },
    'banana-bread':       { name: 'Banana Walnut Bread', price: 395, bake: true },
    'cookie':             { name: 'Chocolate Chip Cookie', price: 295, bake: true }
  };
  const FREE_DELIVERY_AT = 2500;   // $25.00
  const DELIVERY_FEE = 399;        // $3.99
  const STORE_KEY = 'brewhaven-cart-v2';

  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { cart = {}; }
  Object.keys(cart).forEach(id => { if (!CATALOG[id] || !(cart[id] > 0)) delete cart[id]; });
  const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch { /* storage unavailable */ } };

  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + CATALOG[id].price * q, 0);
  const deliveryFee = sub => (sub >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE);

  const cartBtn = $('#cartBtn');
  const badge = $('#cartCount');
  const drawer = $('#cartDrawer');
  const list = $('#cartList');
  const views = { cart: $('#viewCart'), checkout: $('#viewCheckout'), done: $('#viewDone') };

  const cupIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h12v4a6 6 0 0 1-6 6 6 6 0 0 1-6-6z"/><path d="M17 11.5h1.5a2.2 2.2 0 0 1 0 4.5H16.5M9 3.5c-.7 1 .7 1.8 0 3M12.5 3.5c-.7 1 .7 1.8 0 3"/></svg>';
  const bakeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c0-4 4-8 9-8s9 4 9 8c-2 1.5-5 2-9 2s-7-.5-9-2z"/><path d="M8 8.5l1.5 8M16 8.5l-1.5 8M12 7v10"/></svg>';

  const render = () => {
    const n = count();
    const sub = subtotal();
    badge.textContent = n;
    badge.classList.toggle('has-items', n > 0);
    cartBtn.setAttribute('aria-label', `Open cart, ${n} ${n === 1 ? 'item' : 'items'}`);

    list.innerHTML = Object.entries(cart).map(([id, q]) => {
      const item = CATALOG[id];
      const thumb = item.img ? `<img src="${item.img}" alt="" loading="lazy">` : (item.bake ? bakeIcon : cupIcon);
      return `<li data-id="${id}">
        <span class="thumb">${thumb}</span>
        <div><p class="ci-name">${item.name}</p><p class="ci-price">${money(item.price)} each</p>
          <button class="ci-remove" type="button" data-act="remove">Remove</button></div>
        <div class="qty"><button type="button" data-act="dec" aria-label="One less ${item.name}">&minus;</button><span>${q}</span><button type="button" data-act="inc" aria-label="One more ${item.name}">+</button></div>
      </li>`;
    }).join('');

    $('#cartEmpty').hidden = n > 0;
    $('#cartFoot').hidden = n === 0;
    $('#shipMeter').hidden = n === 0;

    const left = Math.max(0, FREE_DELIVERY_AT - sub);
    $('#shipText').innerHTML = left > 0
      ? `Add <strong>${money(left)}</strong> more for free delivery`
      : 'You&rsquo;ve unlocked <strong>free delivery</strong>';
    $('#shipMeter').classList.toggle('unlocked', left === 0);
    $('#shipBar').style.width = Math.min(100, (sub / FREE_DELIVERY_AT) * 100) + '%';

    const fee = deliveryFee(sub);
    $('#subTotal').textContent = money(sub);
    $('#delivery').textContent = fee ? `${money(fee)} (free for pickup)` : 'Free';
    $('#grandTotal').textContent = money(sub + fee);
    updateCheckoutTotal();
  };

  const setView = name => Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });

  const openCart = () => {
    if (!menu.hidden) setMenu(false);
    $('#toast').hidden = true;
    if (!views.done.hidden) setView('cart');
    if (typeof drawer.showModal === 'function') drawer.showModal(); else drawer.setAttribute('open', '');
    document.body.classList.add('no-scroll');
  };
  const closeCart = () => drawer.close();
  cartBtn.addEventListener('click', openCart);
  drawer.addEventListener('close', () => document.body.classList.remove('no-scroll'));
  drawer.addEventListener('click', e => { if (e.target === drawer) closeCart(); });
  $$('[data-close]', drawer).forEach(b => b.addEventListener('click', closeCart));

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.closest('li').dataset.id;
    if (btn.dataset.act === 'inc') cart[id] += 1;
    if (btn.dataset.act === 'dec') cart[id] -= 1;
    if (btn.dataset.act === 'remove' || cart[id] <= 0) delete cart[id];
    save(); render();
  });

  /* toast */
  const toast = $('#toast');
  let toastTimer;
  const showToast = text => {
    $('#toastText').textContent = text;
    toast.hidden = false;
    toast.style.animation = 'none'; void toast.offsetWidth; toast.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  };
  $('#toastView').addEventListener('click', () => { toast.hidden = true; openCart(); });

  /* little "fly to the cart" animation from the product photo */
  const flyToCart = source => {
    if (reduceMotion || !source) return;
    const from = source.getBoundingClientRect();
    const to = cartBtn.getBoundingClientRect();
    const size = Math.min(90, from.width);
    const ghost = document.createElement(source.tagName === 'IMG' ? 'img' : 'div');
    if (source.tagName === 'IMG') ghost.src = source.currentSrc || source.src;
    else { ghost.style.background = 'var(--caramel)'; ghost.style.borderRadius = '50%'; }
    ghost.className = 'fly';
    Object.assign(ghost.style, { left: from.left + from.width / 2 - size / 2 + 'px', top: from.top + from.height / 2 - size / 2 + 'px', width: size + 'px', height: size + 'px' });
    document.body.appendChild(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 60}px) scale(.6)`, opacity: .95, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: .3 }
    ], { duration: 750, easing: 'cubic-bezier(.45,.05,.55,.95)' }).onfinish = () => {
      ghost.remove();
      cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
    };
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    const id = btn.dataset.add;
    if (!CATALOG[id]) return;
    cart[id] = (cart[id] || 0) + 1;
    save(); render();
    const card = btn.closest('.card');
    flyToCart(card ? $('.card-img', card) : btn);
    if (reduceMotion) { cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump'); }
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 900);
    const left = Math.max(0, FREE_DELIVERY_AT - subtotal());
    showToast(`${CATALOG[id].name} added${left ? ` · ${money(left)} to free delivery` : ' · free delivery unlocked'}`);
  });

  /* checkout */
  const coForm = views.checkout;
  const addressField = $('#addressField');
  const mode = () => coForm.elements.mode.value;
  function updateCheckoutTotal() {
    const sub = subtotal();
    const fee = mode() === 'delivery' ? deliveryFee(sub) : 0;
    $('#coItems').textContent = count();
    $('#coTotal').textContent = money(sub + fee) + (mode() === 'delivery' ? (fee ? ` incl. ${money(fee)} delivery` : ' · free delivery') : '');
  }
  coForm.addEventListener('change', e => {
    if (e.target.name === 'mode') {
      addressField.hidden = mode() !== 'delivery';
      updateCheckoutTotal();
    }
  });
  coForm.addEventListener('input', e => { const f = e.target.closest('.field.has-error'); if (f) f.classList.remove('has-error'); });
  $('#toCheckout').addEventListener('click', () => { setView('checkout'); $('#c-name').focus(); });
  $('#backToCart').addEventListener('click', () => setView('cart'));

  coForm.addEventListener('submit', e => {
    e.preventDefault();
    const { name, phone, address } = coForm.elements;
    const checks = [
      [name, name.value.trim() === ''],
      [phone, phone.value.replace(/\D/g, '').length < 7],
      [address, mode() === 'delivery' && address.value.trim().length < 6]
    ];
    checks.forEach(([el, bad]) => el.closest('.field').classList.toggle('has-error', bad));
    const firstBad = checks.find(([, bad]) => bad);
    if (firstBad) { firstBad[0].focus(); return; }

    const orderNo = 'BH-' + Math.floor(1000 + Math.random() * 9000);
    const first = name.value.trim().split(/\s+/)[0];
    $('#doneTitle').textContent = `${first}, your order is in.`;
    $('#doneText').textContent = mode() === 'delivery'
      ? `Order ${orderNo} is being prepared and should reach you in 25 to 35 minutes.`
      : `Order ${orderNo} will be waiting at the counter in about 15 minutes.`;
    cart = {};
    save(); render();
    coForm.reset();
    addressField.hidden = true;
    setView('done');
  });

  /* ---------- Newsletter ---------- */
  const newsForm = $('#newsForm');
  const newsMsg = $('#newsMsg');
  newsForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#newsEmail').value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    newsForm.classList.toggle('invalid', !ok);
    newsMsg.classList.toggle('error', !ok);
    newsMsg.textContent = ok ? 'Thanks for subscribing! Look out for our next brew news.' : 'Please enter a valid email address.';
    if (ok) newsForm.reset();
  });

  /* ---------- Footer year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  render();
})();
