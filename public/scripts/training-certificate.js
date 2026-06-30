import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SAIL_CERTIFICATE_CONFIG;
const supabase = createClient(config.supabaseUrl, config.supabasePublishableKey);
const form = document.querySelector('[data-certificate-form]');
const statusBox = document.querySelector('[data-certificate-status]');
const resultBox = document.querySelector('[data-certificate-result]');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function setStatus(message, tone = 'neutral') {
  statusBox.textContent = message;
  statusBox.dataset.tone = tone;
}

function normalizeResult(value) {
  return value === 'excellent' ? 'Excellent' : 'Pass';
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value));
}

async function verify(code) {
  const cleanCode = code.trim();
  if (!cleanCode) {
    setStatus('Enter a certificate code.', 'error');
    return;
  }

  setStatus('Checking certificate...');
  resultBox.innerHTML = '';

  const { data, error } = await supabase.rpc('verify_training_certificate', { lookup_code: cleanCode });
  if (error) {
    setStatus(error.message, 'error');
    return;
  }

  const certificate = Array.isArray(data) ? data[0] : null;
  if (!certificate) {
    setStatus('Certificate not found or revoked.', 'error');
    resultBox.innerHTML = `
      <article class="training-certificate invalid">
        <p class="training-eyebrow">Invalid</p>
        <h2>No valid certificate found</h2>
        <p>Please check the code and try again.</p>
      </article>
    `;
    return;
  }

  setStatus('Certificate verified.', 'success');
  resultBox.innerHTML = `
    <article class="training-certificate">
      <p class="training-eyebrow">Verified</p>
      <h2>${escapeHtml(certificate.display_name)}</h2>
      <dl>
        <div><dt>Program</dt><dd>${escapeHtml(certificate.program_title)}</dd></div>
        <div><dt>Result</dt><dd>${escapeHtml(normalizeResult(certificate.result))}</dd></div>
        <div><dt>Issued</dt><dd>${escapeHtml(formatDate(certificate.issued_at))}</dd></div>
        <div><dt>Code</dt><dd>${escapeHtml(certificate.certificate_code)}</dd></div>
      </dl>
    </article>
  `;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = new FormData(form).get('code');
  verify(typeof value === 'string' ? value : '');
});

const initialCode = new URLSearchParams(window.location.search).get('code') || '';
if (initialCode) {
  form.elements.code.value = initialCode;
  verify(initialCode);
}
