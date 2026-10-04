/* Shows the contact email from assets/config.js wherever a page has [data-contact]. Until one is set, the GitHub link stays. */
(() => {
  const mail = window.LW_CONTACT_EMAIL;
  if (!mail) return;
  document.querySelectorAll('[data-contact]').forEach(p => {
    p.textContent = 'Email ';
    const a = document.createElement('a'); a.href = 'mailto:' + mail; a.textContent = mail;
    p.append(a, '. We answer within a few days.');
  });
})();
