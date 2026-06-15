# ميزانيتي — مدير الميزانية الشخصية

> تطبيق ويب تقدمي (PWA) لإدارة الشؤون المالية الشخصية — يعمل بالكامل بدون إنترنت.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/Offline-Supported-orange.svg)](#)

---

## المميزات

- **إدارة الدخل** — تتبع جميع مصادر الدخل الشهري
- **تتبع المصروفات** — تصنيف المصروفات وتحليلها
- **إدارة الديون** — متابعة الديون ونسب السداد
- **الاستثمارات** — رصد المحفظة الاستثمارية
- **الميزانية** — تحديد حدود الإنفاق بالفئات
- **التحليلات** — رسوم بيانية تفاعلية لاتجاهات الإنفاق
- **الوضع الداكن / الفاتح** — دعم كامل للثيمين
- **عمل Offline** — يعمل بالكامل بدون اتصال بالإنترنت
- **قابل للتثبيت** — يمكن تثبيته على الهاتف كتطبيق مستقل

---

## التقنيات

| المكوّن | التقنية |
|---------|---------|
| Frontend | Vanilla HTML / CSS / JavaScript |
| الرسوم البيانية | MiniChart (Canvas API — محلي) |
| التخزين | LocalStorage |
| الخط | Cairo (Google Fonts) + System Arabic fallback |
| PWA | Service Worker + Web App Manifest |

---

## بنية الملفات

```
├── index.html          # التطبيق الرئيسي
├── app.js              # منطق التطبيق (Data + Logic + UI layers)
├── style.css           # نظام التصميم الكامل
├── chart.min.js        # مكتبة الرسوم البيانية (محلية — بدون CDN)
├── manifest.json       # إعدادات PWA
├── service-worker.js   # دعم Offline
├── icons/
│   ├── icon-192.svg
│   └── icon-512.svg
├── README.md
├── LICENSE
└── .gitignore
```

---

## الترخيص

[MIT](LICENSE) © 2024 — مشروع مفتوح المصدر للاستخدام الحر.
