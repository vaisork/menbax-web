(() => {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#nav');
  const triggers = [...document.querySelectorAll('.nav-trigger')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const descriptions = {
    'Personal mecánico y eléctrico': ['tools', 'Cuadrillas técnicas para ensamble, instalación y mantenimiento.'],
    'Instalación eléctrica': ['zap', 'Canalización, cableado y dispositivos de campo.'],
    'Controles y puesta en marcha': ['sliders', 'Verificación de señales y apoyo al arranque.'],
    'Soporte en control y automatización': ['sliders', 'Instalación, diagnóstico y ajuste de PLC, HMI y sensores.'],
    'Ingeniería y diseño': ['drafting', 'Coordinación técnica y documentación de instalación.'],
    'Gestión de proyectos y supervisión técnica': ['clipboard', 'Coordinación técnica, planeación y seguimiento en sitio.'],
    'Armado de tableros e integración eléctrica': ['zap', 'Tableros para transportadores y automatización, con pruebas de integración.'],
    'Compras y gestión de materiales': ['package', 'Componentes, logística de entregas y gestión de proveedores.'],
    'Seguridad': ['shield-check', 'Evaluación de riesgos, permisos y supervisión de seguridad laboral.'],
    'AutoStore': ['layers', 'Instalación coordinada para sistemas cúbicos.'],
    'Sortation': ['circle-check', 'Montaje y verificación de sistemas de clasificación.'],
    'Transportadores': ['arrow-right', 'Líneas, curvas, elevación y espirales.']
  };
  const iconRoot = document.querySelector('.brand img').getAttribute('src').replace('logo-menbax-original.jpg', 'icons.svg');

  document.querySelectorAll('.dropdown').forEach(menu => {
    menu.setAttribute('aria-label', menu.id.startsWith('servicios') ? 'Especialidades de servicio' : 'Sistemas intralogísticos');
    menu.querySelectorAll('a').forEach(link => {
      const [icon, description] = descriptions[link.textContent.trim()] || ['crosshair', 'Conoce esta capacidad de Menbax.'];
      link.innerHTML = `<svg aria-hidden="true"><use href="${iconRoot}#${icon}"></use></svg><strong>${link.textContent.trim()}</strong><small>${description}</small>`;
    });
  });

  function closeSubmenus(except) {
    triggers.forEach(trigger => {
      if (trigger === except) return;
      trigger.setAttribute('aria-expanded', 'false');
      document.getElementById(trigger.getAttribute('aria-controls')).hidden = true;
    });
  }
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    closeSubmenus(trigger);
    trigger.setAttribute('aria-expanded', String(!open));
    document.getElementById(trigger.getAttribute('aria-controls')).hidden = open;
  }));
  function closeMenu(restoreFocus = false) {
    if (!menuButton || !nav) return;
    nav.classList.remove('open');
    header.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-active');
    closeSubmenus();
    if (restoreFocus) menuButton.focus();
  }
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('open', !open);
      header.classList.toggle('menu-open', !open);
      document.body.classList.toggle('menu-active', !open);
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
      if (!open) nav.querySelector('.nav-trigger')?.focus();
      else closeSubmenus();
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeSubmenus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const expanded = triggers.find(trigger => trigger.getAttribute('aria-expanded') === 'true');
        if (expanded) {
          closeSubmenus();
          expanded.focus();
        } else if (menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
      }
      if (event.key === 'Tab' && menuButton.getAttribute('aria-expanded') === 'true') {
        const focusable = [...nav.querySelectorAll('a,button:not([disabled])')].filter(el => el.offsetParent !== null);
        const first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 20);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .14 });
    document.querySelectorAll('.section-heading,.intro-layout,.capability-card,.tech-card,.method-steps,.pillar-grid,.service-detail,.tech-facts,.stages,.system-diagram,.install-band,.tech-gallery,.page-cta,.contact-layout,[data-draw]').forEach((el, i) => {
      el.setAttribute('data-reveal', el.matches('.capability-card,.tech-card,.pillar-grid,.stage-grid') ? 'stagger' : '');
      if (el.matches('.capability-card,.tech-card')) el.style.transitionDelay = `${(i % 3) * 65}ms`;
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
  }

  const diagramMarkup = {
    almacen: `<svg class="diagram" viewBox="0 0 1000 300" role="img" aria-label="Diagrama de rejilla cúbica: robot se desplaza y eleva un contenedor al puerto"><defs><pattern id="cgrid" width="46" height="30" patternUnits="userSpaceOnUse"><path d="M46 0H0V30" class="diagram-grid" fill="none"/></pattern></defs><rect x="35" y="30" width="670" height="210" fill="url(#cgrid)" stroke="#ffffff33"/><path d="M55 215H690M55 170H690M55 125H690M55 80H690" stroke="#8c9fb0" stroke-width="4"/><path d="M90 225V48M170 225V48M250 225V48M330 225V48M410 225V48M490 225V48M570 225V48M650 225V48" stroke="#8c9fb0" stroke-width="4"/><g class="diagram-lift"><rect x="292" y="78" width="72" height="46" rx="3" class="diagram-blue"/><path d="M328 30v48" stroke="#f47623" stroke-width="3"/></g><g class="diagram-motion"><rect x="190" y="34" width="88" height="22" rx="5" class="diagram-orange"/><circle cx="210" cy="46" r="4" class="diagram-dot"/><circle cx="260" cy="46" r="4" class="diagram-dot"/></g><path d="M725 142h68v65h-68z" class="diagram-metal"/><path d="M705 220h105" stroke="#fff" stroke-width="8"/><path d="M700 153h30" class="diagram-route"/><text x="52" y="274" class="diagram-label">REJILLA DE ALMACENAMIENTO</text><text x="728" y="126" class="diagram-label">PUERTO</text><text x="825" y="185" class="diagram-label">CONTENEDOR</text></svg>`,
    sortation: `<svg class="diagram" viewBox="0 0 1000 300" role="img" aria-label="Diagrama de bandejas que avanzan y se desvían a rampas de clasificación"><path d="M55 150H920" class="diagram-rail"/><path d="M55 150H920" class="diagram-rail-inner"/><path d="M320 150 460 62h210M560 150l135 88h220" class="diagram-rail"/><path d="M320 150 460 62h210M560 150l135 88h220" class="diagram-rail-inner"/><path d="M230 150h130l85-55" class="diagram-route"/><g class="diagram-motion"><rect x="80" y="127" width="56" height="42" rx="8" class="diagram-blue"/><path d="M80 140h56" stroke="#b8d3f3"/><circle cx="93" cy="174" r="4" class="diagram-dot"/><circle cx="123" cy="174" r="4" class="diagram-dot"/></g><g transform="translate(500 41)"><rect width="56" height="42" rx="8" class="diagram-orange"/><path d="M0 14h56" stroke="#ffb677"/></g><g transform="translate(720 217)"><rect width="56" height="42" rx="8" class="diagram-blue"/><path d="M0 14h56" stroke="#b8d3f3"/></g><text x="63" y="215" class="diagram-label">ENTRADA</text><text x="720" y="47" class="diagram-label">RAMPA A</text><text x="814" y="286" class="diagram-label">RAMPA B</text><circle cx="320" cy="150" r="13" fill="#f47623"/><circle cx="560" cy="150" r="13" fill="#f47623"/><g class="sort-branch"><rect width="44" height="31" rx="5" class="diagram-orange"/><path d="M0 11h44" stroke="#ffb677"/></g></svg>`,
    transportadores: `<svg class="diagram" viewBox="0 0 1000 300" role="img" aria-label="Diagrama de paquetes en transportadores rectos, curvas, espiral y unión"><path d="M35 210h260a78 78 0 0 0 78-78V80h155a80 80 0 0 1 80 80v60h347" class="diagram-rail"/><path d="M35 210h260a78 78 0 0 0 78-78V80h155a80 80 0 0 1 80 80v60h347" class="diagram-rail-inner"/><path d="M500 80c40-55 106-55 130 0 22 50-37 78-61 38-21-35 17-56 36-31" fill="none" stroke="#45a4c8" stroke-width="9"/><path d="M40 210h250c62 0 100-40 100-102h170c76 0 116 42 116 104v8h278" class="diagram-route"/><g class="diagram-motion"><rect x="75" y="185" width="51" height="36" rx="4" class="diagram-orange"/><path d="m75 185 25 14 26-14M100 199v22" stroke="#ffb677"/></g><g transform="translate(420 55)"><rect width="48" height="35" rx="4" class="diagram-blue"/></g><g transform="translate(790 204)"><rect width="58" height="39" rx="4" class="diagram-orange"/></g><text x="60" y="260" class="diagram-label">RECTA</text><text x="305" y="54" class="diagram-label">CURVA</text><text x="507" y="45" class="diagram-label">ESPIRAL</text><text x="807" y="190" class="diagram-label">MERGE</text><g class="curve-package"><rect width="46" height="34" rx="4" class="diagram-orange"/><path d="m0 0 23 13 23-13M23 13v21" stroke="#ffb677"/></g><g class="spiral-package"><rect width="38" height="28" rx="4" class="diagram-blue"/><path d="m0 0 19 11 19-11M19 11v17" stroke="#b8d3f3"/></g></svg>`
  };
  const system = document.querySelector('.tech-page-hero');
  if (system && !document.querySelector('.an3d') && !system.querySelector('img').getAttribute('src').includes('autostore')) {
    const source = system.querySelector('img').getAttribute('src');
    const key = source.includes('cube') ? 'almacen' : source.includes('sorter') ? 'sortation' : 'transportadores';
    const title = key === 'almacen' ? 'Flujo de almacenamiento cúbico' : key === 'sortation' ? 'Flujo de clasificación' : 'Flujo de transporte y convergencia';
    const diagram = document.createElement('figure');
    diagram.className = 'system-diagram';
    diagram.tabIndex = 0;
    diagram.setAttribute('role', 'region');
    diagram.setAttribute('aria-label', `${title}; desplazable horizontalmente en móvil`);
    diagram.innerHTML = `<figcaption>${title}<span>DIAGRAMA DE PRINCIPIO · ILUSTRATIVO</span></figcaption>${diagramMarkup[key]}`;
    const techDetail = document.querySelector('.tech-detail');
    techDetail.prepend(diagram);
    const gallery = document.createElement('section');
    gallery.className = 'tech-gallery';
    const images = key === 'almacen' ? [['cube.webp', 'Almacenamiento automatizado'], ['mezzanine.webp', 'Integración de estructuras'], ['electrical.webp', 'Instalación eléctrica']] : key === 'sortation' ? [['sorter.webp', 'Sistema de clasificación'], ['conveyors.webp', 'Transporte de materiales'], ['supervision.webp', 'Coordinación en campo']] : [['conveyors.webp', 'Transportadores y curvas'], ['mezzanine.webp', 'Integración en mezzanine'], ['sorter.webp', 'Manejo y clasificación']];
    const prefix = iconRoot.replace('assets/icons.svg', 'assets/img/');
    gallery.innerHTML = `<h2>Integración en cada tramo</h2><div class="gallery-grid">${images.map(([src, alt]) => `<figure><img src="${prefix}${src}" alt="${alt}." loading="lazy" width="1200" height="675"><figcaption>${alt.toUpperCase()}</figcaption></figure>`).join('')}</div>`;
    techDetail.insertBefore(gallery, techDetail.querySelector('.page-cta'));
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
