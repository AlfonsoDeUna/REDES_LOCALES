(function () {
  'use strict';

  const practices = window.PORTAL_DATA.practices;
  const $ = function (selector, root) { return (root || document).querySelector(selector); };
  const $$ = function (selector, root) { return Array.from((root || document).querySelectorAll(selector)); };
  const escape = function (value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  const icons = {
    rooms: '<path d="M4 4h26v26H4zM4 16h10m5 0h11M16 4v9m0 7v10"/><path d="M9 8h5v4H9zm12 13h5v4h-5z"/>',
    rack: '<rect x="8" y="3" width="19" height="28" rx="1"/><path d="M11 8h13v5H11zm0 9h13v5H11zM12 27h11"/><path d="M14 10h5m-5 9h5"/>',
    switch: '<rect x="3" y="12" width="28" height="11" rx="1"/><path d="M7 16h3v3H7zm6 0h3v3h-3zm6 0h3v3h-3zM17 5v7M17 23v7M6 6h22M6 29h22"/><circle cx="27" cy="17" r="1"/>'
  };

  function renderCards() {
    $('#practice-cards').innerHTML = practices.map(function (p) {
      return '<article class="practice-card">' +
        '<div class="card-top"><span class="card-number">' + escape(p.number) + '</span><svg class="card-symbol" viewBox="0 0 34 34" aria-hidden="true">' + icons[p.icon] + '</svg></div>' +
        '<p class="card-kicker">PACKET TRACER / VISTA FÍSICA</p>' +
        '<a class="card-open" href="#practica-' + p.id + '"><h3>' + escape(p.cardTitle) + '</h3></a>' +
        '<p>' + escape(p.description) + '</p>' +
        '<div class="card-footer"><a class="card-action-button" href="#practica-' + p.id + '" aria-label="Ver introducción a la práctica ' + escape(p.number) + '">Ver introducción <span aria-hidden="true">↗</span></a>' +
        '<a class="card-download" href="' + p.doc + '" download aria-label="Descargar Word original de la práctica ' + escape(p.number) + '">Word <span aria-hidden="true">↓</span></a></div></article>';
    }).join('');
  }

  function renderResources() {
    $('#resource-list').innerHTML = practices.map(function (p) {
      return '<a class="resource-row" href="' + p.doc + '" download aria-label="Descargar práctica ' + escape(p.number) + ': ' + escape(p.title) + '">' +
        '<span>' + escape(p.number) + '</span><span class="resource-name"><strong>' + escape(p.shortTitle) + '</strong><small>DOCUMENTO ORIGINAL · WORD (.DOCX)</small></span><span class="download-arrow" aria-hidden="true">↓</span></a>';
    }).join('');
  }

  function renderPractice(p) {
    $('#practice-sidebar').innerHTML = '<a class="back-link" href="#mision">← Volver al proyecto</a>' +
      '<p class="eyebrow">MISIÓN 00 / INTRODUCCIÓN</p><h2 class="sidebar-title">La vista física.</h2>' +
      '<p class="sidebar-desc">Conoce el objetivo de cada laboratorio y abre su documento de trabajo.</p>' +
      '<nav class="practice-nav intro-nav" aria-label="Introducciones de los laboratorios">' + practices.map(function (item) {
        return '<a href="#practica-' + item.id + '"' + (item.id === p.id ? ' class="active" aria-current="page"' : '') + '><span class="nav-number">' + escape(item.number) + '</span><span>' + escape(item.shortTitle) + '</span></a>';
      }).join('') + '</nav><div class="sidebar-resource"><a href="#recursos">↓ Todos los documentos</a><a href="#recorrido">↗ El recorrido del proyecto</a><p>El laboratorio se realiza en Packet Tracer. Las instrucciones están en el Word original.</p></div>';

    const index = practices.indexOf(p);
    const next = practices[index + 1];
    $('#practice-main').innerHTML = '<div class="intro-page"><div class="breadcrumb"><a href="#inicio">Proyecto</a><span aria-hidden="true">/</span><a href="#mision">Introducción</a><span aria-hidden="true">/</span><span>Práctica ' + escape(p.number) + '</span></div>' +
      '<div class="practice-heading"><span class="large-number" aria-hidden="true">' + escape(p.number) + '</span><div><h1>' + escape(p.title) + '</h1><p>' + escape(p.description) + '</p><a class="text-link intro-mobile-download" href="' + p.doc + '" download>Descargar práctica original ↓</a></div></div>' +
      '<div class="objective"><strong>EL OBJETIVO</strong>' + escape(p.objective) + '</div>' +
      '<div class="intro-copy-grid"><section><h2>¿DE QUÉ TRATA?</h2><p>' + escape(p.about) + '</p></section><section><h2>SU LUGAR EN EL PROYECTO</h2><p>' + escape(p.connection) + '</p></section></div>' +
      '<div class="intro-main-grid"><figure class="intro-picture"><button class="image-button" type="button" data-open-image="' + p.id + '" aria-label="Ampliar la imagen de referencia de la práctica ' + escape(p.number) + '"><img src="' + p.image + '" alt="' + escape(p.imageAlt) + '"><span class="expand-label" aria-hidden="true">Ampliar ↗</span></button><figcaption>' + escape(p.imageCaption) + '</figcaption></figure></div>' +
      '<p class="intro-starting"><strong>Tu punto de partida.</strong> ' + escape(p.startingPoint) + '</p>' +
      '<section class="original-download"><div><p class="eyebrow">AHORA, ABRE TU LABORATORIO</p><h2>Todo listo para empezar.</h2><p>Descarga el documento de la práctica. Encontrarás las instrucciones, las imágenes de apoyo y lo que debes entregar en el aula virtual.</p><div class="intro-file-info">PRÁCTICA ' + escape(p.number) + ' · WORD ORIGINAL</div></div><a class="button primary" href="' + p.doc + '" download>Descargar práctica <span aria-hidden="true">↓</span></a></section>' +
      '<div class="next-practice"><div><p class="small">' + (next ? 'LA SIGUIENTE PRÁCTICA' : 'EL PROYECTO CONTINÚA') + '</p><p>' + escape(next ? next.shortTitle : 'Ya conoces la introducción al proyecto.') + '</p></div><a class="text-link" href="' + (next ? '#practica-' + next.id : '#recorrido') + '">' + (next ? 'Ver introducción' : 'Ver el recorrido') + ' <span aria-hidden="true">→</span></a></div></div>';
  }

  function updateNavigation(active) {
    $$('[data-nav]').forEach(function (a) {
      const selected = a.dataset.nav === active;
      a.classList.toggle('active', selected);
      if (selected) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    const hash = location.hash.slice(1) || 'inicio';
    const p = practices.find(function (item) { return hash === 'practica-' + item.id; });
    $('#home-view').hidden = !!p;
    $('#practice-view').hidden = !p;
    document.title = p ? 'Práctica ' + p.number + ' · ' + p.shortTitle + ' | Red local' : 'Proyecto de diseño de redes locales';
    updateNavigation(p || hash === 'mision' ? 'mision' : hash === 'recursos' ? 'recursos' : 'inicio');
    if (p) {
      renderPractice(p);
      window.scrollTo({ top: 0, behavior: 'instant' });
      $('#contenido').focus({ preventScroll: true });
    } else {
      const target = { mision: 'mision-section', recorrido: 'recorrido-section', recursos: 'recursos-section' }[hash];
      $('#contenido').focus({ preventScroll: true });
      requestAnimationFrame(function () {
        if (target) document.getElementById(target).scrollIntoView({ behavior: 'instant', block: 'start' });
        else window.scrollTo({ top: 0, behavior: 'instant' });
      });
    }
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const nextLabel = theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    $('#theme-toggle').setAttribute('aria-label', nextLabel);
    $('#theme-toggle').title = nextLabel;
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#171b18' : '#f4f2e8';
    try { localStorage.setItem('red-local-theme-v1', theme); } catch (_) { /* El sitio funciona también sin almacenamiento. */ }
  }

  let initialTheme = 'dark';
  try {
    const savedTheme = localStorage.getItem('red-local-theme-v1');
    if (savedTheme === 'light' || savedTheme === 'dark') initialTheme = savedTheme;
  } catch (_) { /* Mantener el tema predeterminado. */ }
  setTheme(initialTheme);
  $('#theme-toggle').addEventListener('click', function () {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  $$('[data-diagram]').forEach(function (button) {
    button.addEventListener('click', function () {
      const physical = button.dataset.diagram === 'fisica';
      $('#physical-diagram').toggleAttribute('hidden', !physical);
      $('#logical-diagram').toggleAttribute('hidden', physical);
      $$('[data-diagram]').forEach(function (tab) {
        const active = tab === button;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', String(active));
      });
      $('#diagram-explanation').innerHTML = physical ? 'Vista física: <strong>dónde está cada dispositivo.</strong>' : 'Vista lógica: <strong>cómo se conectan los dispositivos.</strong>';
      $('.diagram-caption .tiny').textContent = physical ? '01 / 02' : '02 / 02';
    });
  });

  document.addEventListener('click', function (event) {
    const openImage = event.target.closest('[data-open-image]');
    if (!openImage) return;
    const p = practices.find(function (item) { return item.id === openImage.dataset.openImage; });
    if (!p) return;
    $('#image-dialog-title').textContent = 'Práctica ' + p.number + ' · Imagen del documento original';
    $('#image-dialog-content').innerHTML = '<img src="' + p.image + '" alt="' + escape(p.imageAlt) + '">';
    $('#image-dialog').showModal();
  });
  $('#close-image').addEventListener('click', function () { $('#image-dialog').close(); });
  $('#image-dialog').addEventListener('click', function (event) {
    if (event.target === $('#image-dialog')) {
      const r = $('#image-dialog').getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $('#image-dialog').close();
    }
  });
  $('.skip-link').addEventListener('click', function (event) {
    event.preventDefault();
    $('#contenido').focus({ preventScroll: true });
    $('#contenido').scrollIntoView({ block: 'start' });
  });
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (link && !link.classList.contains('skip-link') && link.hash === location.hash) {
      event.preventDefault();
      route();
    }
  });
  window.addEventListener('hashchange', route);
  renderCards();
  renderResources();
  route();
}());
