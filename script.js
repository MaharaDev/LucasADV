document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 60rem)');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');

  if (menuButton && nav) {
    const closeMenu = (restoreFocus = false) => {
      menuButton.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      if (restoreFocus) menuButton.focus();
    };
    document.documentElement.classList.add('menu-ready');
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link || !mobile.matches) return;
      closeMenu();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.nav-row')) {
        closeMenu(nav.contains(document.activeElement));
      }
    });
    document.addEventListener('focusin', event => {
      if (!event.target.closest('.nav-row')) closeMenu();
    });
    mobile.addEventListener('change', () => {
      const focusWasInNav = nav.contains(document.activeElement);
      const focusWasOnToggle = document.activeElement === menuButton;
      closeMenu(mobile.matches && focusWasInNav);
      if (!mobile.matches && focusWasOnToggle) nav.querySelector('a').focus();
    });
  }

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const elements = document.querySelectorAll('.section-heading, .area-card, .about-grid, .steps li, .faq-grid > div, .contact-grid > div, .contact-form');
    const reveal = element => {
      element.classList.add('is-visible');
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements.forEach(element => {
      element.classList.add('reveal');
      observer.observe(element);
    });
    // Stop decorative effects immediately if motion preferences change.
    const showAll = () => { elements.forEach(reveal); observer.disconnect(); };
    reducedMotion.addEventListener('change', showAll, { once: true });
  }

  const floatingContact = document.querySelector('.floating-contact');
  if (floatingContact && 'IntersectionObserver' in window) {
    const visible = new Set();
    const shortcutObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      floatingContact.hidden = visible.size > 0 && document.activeElement !== floatingContact;
    });
    document.querySelectorAll('#contato, footer').forEach(element => shortcutObserver.observe(element));
  }

  const form = document.querySelector('.contact-form');
  if (!form) return;
  const phone = form.querySelector('#telefone');
  const phoneError = form.querySelector('#telefone-error');
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('.form-status');

  const validatePhone = () => {
    const digits = phone.value.replace(/\D/g, '');
    const international = phone.value.trim().startsWith('+');
    const valid = international ? digits.length >= 8 && digits.length <= 15 : digits.length === 10 || digits.length === 11;
    const message = valid ? '' : 'Informe DDD e telefone com 10 ou 11 dígitos, ou use + e o código do país.';
    phone.setCustomValidity(message);
    phone.setAttribute('aria-invalid', String(!valid));
    phoneError.textContent = message;
    return valid;
  };
  phone.addEventListener('input', () => {
    if (!phone.value.trim().startsWith('+')) {
      const digits = phone.value.replace(/\D/g, '').slice(0, 11);
      let formatted = digits;
      if (digits.length > 2) {
        const split = digits.length > 10 ? 7 : 6;
        formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, split)}`;
        if (digits.length > split) formatted += `-${digits.slice(split)}`;
      }
      // Avoid moving the caret when editing in the middle of the number.
      const atEnd = phone.selectionStart === phone.value.length;
      if (atEnd) phone.value = formatted;
    }
    phone.setCustomValidity('');
    phone.removeAttribute('aria-invalid');
    phoneError.textContent = '';
  });
  phone.addEventListener('blur', () => { if (phone.value) validatePhone(); });
  phone.addEventListener('invalid', validatePhone);

  if (!window.fetch) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    if (!validatePhone()) { phone.reportValidity(); return; }
    if (!form.reportValidity()) return;
    button.disabled = true;
    button.textContent = 'Enviando…';
    button.setAttribute('aria-busy', 'true');
    status.textContent = 'Enviando sua solicitação…';
    status.dataset.state = 'pending';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' }, signal: controller.signal
      });
      if (!response.ok) throw new Error('Falha no envio');
      form.reset();
      phone.removeAttribute('aria-invalid');
      status.dataset.state = 'success';
      status.textContent = 'Solicitação enviada. Obrigado pelo contato!';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = 'Não foi possível confirmar o envio. Tente novamente ou entre em contato pelo WhatsApp.';
    } finally {
      window.clearTimeout(timeout);
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.replaceChildren(document.createTextNode('Enviar solicitação '));
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      button.append(arrow);
    }
  });
});
