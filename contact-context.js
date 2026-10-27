/** Keep the chosen service in the contact request without overwriting the message. */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');
  const subject = form?.querySelector('#assunto');
  if (!subject) return;
  const announcement = document.querySelector('#contact-context-status');
  const name = form.querySelector('#nome');
  const whatsapp = document.querySelector('#contato .button-gold');
  const originalWhatsApp = whatsapp?.getAttribute('href');
  const allowed = new Set(Array.from(subject.options, option => option.value));

  function syncWhatsApp() {
    if (!whatsapp || !originalWhatsApp) return;
    const url = new URL(originalWhatsApp);
    if (subject.value && allowed.has(subject.value)) {
      url.searchParams.set('text', `Olá, gostaria de informações sobre atendimento em ${subject.value}.`);
    }
    whatsapp.setAttribute('href', url.href);
  }

  document.querySelectorAll('[data-contact-area]').forEach(link => {
    link.addEventListener('click', () => {
      const area = link.dataset.contactArea;
      if (!allowed.has(area)) return;
      subject.value = area;
      syncWhatsApp();
      if (announcement) announcement.textContent = `Área de interesse selecionada: ${area}. Você pode alterá-la no formulário.`;
      // The anchor still scrolls to the contact section, including without JavaScript.
      name?.focus({ preventScroll: true });
    });
  });
  subject.addEventListener('change', () => {
    syncWhatsApp();
    if (announcement) announcement.textContent = '';
  });
  form.addEventListener('reset', () => {
    // Native reset events fire before the fields receive their default values.
    queueMicrotask(() => {
      syncWhatsApp();
      if (announcement) announcement.textContent = '';
    });
  });
  syncWhatsApp();
});
