/**
 * @module ui/toast
 * @description نظام الإشعارات العائمة (Toast notifications).
 * مستقل تماماً — لا يعتمد على أي وحدة أخرى.
 */

const ICONS = { success: '✓', error: '✕', info: 'i', warning: '!' };

/**
 * @param {string} message - نص الإشعار
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration - مدة العرض بالمللي ثانية
 */
export function show(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast      = document.createElement('div');
  toast.className  = `toast ${type}`;
  toast.innerHTML  = `<span>${ICONS[type] || ''}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
