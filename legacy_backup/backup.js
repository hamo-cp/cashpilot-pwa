/**
 * @module services/backup
 * @description تصدير البيانات JSON واستيرادها — Backup & Restore.
 */

import * as DB    from '../storage/db.js';
import { today }  from '../core/utils.js';
import * as Toast from '../ui/toast.js';

export function exportData() {
  const data = DB.exportAll();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `mizaniyati-backup-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  Toast.show('تم تصدير البيانات', 'success');
}

export function importData(event, onSuccess) {
  const file = event.target.files[0];
  if (!file) return;

  const reader    = new FileReader();
  reader.onload   = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      DB.importAll(data);
      Toast.show('تم استيراد البيانات', 'success');
      onSuccess?.();
    } catch {
      Toast.show('ملف غير صالح', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
