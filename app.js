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
    document.querySelectorAll('.section-heading,.intro-layout,.capability-card,.tech-card,.method-steps,.pillar-grid,.service-detail,.tech-facts,.elementos,.secuencia,.as-como,.as-galeria,.page-cta,.contact-layout,[data-draw]').forEach((el, i) => {
      el.setAttribute('data-reveal', el.matches('.capability-card,.tech-card,.pillar-grid,.stage-grid') ? 'stagger' : '');
      if (el.matches('.capability-card,.tech-card')) el.style.transitionDelay = `${(i % 3) * 65}ms`;
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));
  }

  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
