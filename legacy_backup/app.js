/* ============================================================
   ميزانيتي — Personal Finance Tracker
   Clean Architecture: Data Layer → Logic Layer → UI Layer
   ============================================================ */

'use strict';

/* ════════════════════════════════════════
   طبقة البيانات — Data Layer
   ════════════════════════════════════════ */

const DB = {
  KEYS: {
    INCOME: 'mz_income',
    EXPENSES: 'mz_expenses',
    DEBTS: 'mz_debts',
    INVESTMENTS: 'mz_investments',
    BUDGET: 'mz_budget',
    SETTINGS: 'mz_settings',
  },

  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },

  /** تحميل مصفوفة أو إرجاع مصفوفة فارغة */
  getArray(key) {
    return this.get(key) || [];
  },

  /** حفظ مصفوفة */
  setArray(key, arr) {
    return this.set(key, arr);
  },

  /** تصدير جميع البيانات */
  exportAll() {
    const data = {};
    Object.values(this.KEYS).forEach(k => {
      data[k] = this.get(k);
    });
    return data;
  },

  /** استيراد البيانات */
  importAll(data) {
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) this.set(k, v);
    });
  }
};

/* ════════════════════════════════════════
   طبقة المنطق — Business Logic Layer
   ════════════════════════════════════════ */

const Finance = {

  /* ── توليد معرف فريد ── */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  /* ── تنسيق العملة ── */
  formatCurrency(amount, decimals = 0) {
    const num = parseFloat(amount) || 0;
    return num.toLocaleString('ar-EG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + ' ج.م';
  },

  /* ── تنسيق النسبة المئوية ── */
  formatPercent(value) {
    const num = parseFloat(value) || 0;
    return num.toFixed(1) + '%';
  },

  /* ── تنسيق التاريخ ── */
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  /* ── الحصول على التاريخ الحالي (YYYY-MM-DD) ── */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /* ── حساب أيام متبقية ── */
  daysUntil(dateStr) {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  /* ════ إدارة الدخل ════ */

  getIncome() {
    return DB.getArray(DB.KEYS.INCOME);
  },

  addIncome(item) {
    const list = this.getIncome();
    const newItem = { id: this.uid(), createdAt: this.today(), ...item };
    list.push(newItem);
    DB.setArray(DB.KEYS.INCOME, list);
    return newItem;
  },

  updateIncome(id, updates) {
    const list = this.getIncome();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    DB.setArray(DB.KEYS.INCOME, list);
    return true;
  },

  deleteIncome(id) {
    const list = this.getIncome().filter(i => i.id !== id);
    DB.setArray(DB.KEYS.INCOME, list);
  },

  totalIncome(month, year) {
    return this.getIncome()
      .filter(i => this._matchPeriod(i.date, month, year))
      .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  },

  /* ════ إدارة المصروفات ════ */

  getExpenses() {
    return DB.getArray(DB.KEYS.EXPENSES);
  },

  addExpense(item) {
    const list = this.getExpenses();
    const newItem = { id: this.uid(), createdAt: this.today(), ...item };
    list.push(newItem);
    DB.setArray(DB.KEYS.EXPENSES, list);
    return newItem;
  },

  updateExpense(id, updates) {
    const list = this.getExpenses();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    DB.setArray(DB.KEYS.EXPENSES, list);
    return true;
  },

  deleteExpense(id) {
    const list = this.getExpenses().filter(i => i.id !== id);
    DB.setArray(DB.KEYS.EXPENSES, list);
  },

  totalExpenses(month, year) {
    return this.getExpenses()
      .filter(i => this._matchPeriod(i.date, month, year))
      .reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
  },

  expensesByCategory(month, year) {
    const result = {};
    this.getExpenses()
      .filter(i => this._matchPeriod(i.date, month, year))
      .forEach(i => {
        result[i.category] = (result[i.category] || 0) + (parseFloat(i.amount) || 0);
      });
    return result;
  },

  dailyExpenses(month, year) {
    const result = {};
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) result[d] = 0;

    this.getExpenses()
      .filter(i => this._matchPeriod(i.date, month, year))
      .forEach(i => {
        const day = new Date(i.date).getDate();
        result[day] = (result[day] || 0) + (parseFloat(i.amount) || 0);
      });
    return result;
  },

  /* ════ إدارة الديون ════ */

  getDebts() {
    return DB.getArray(DB.KEYS.DEBTS);
  },

  addDebt(item) {
    const list = this.getDebts();
    const newItem = { id: this.uid(), paid: 0, ...item };
    list.push(newItem);
    DB.setArray(DB.KEYS.DEBTS, list);
    return newItem;
  },

  updateDebt(id, updates) {
    const list = this.getDebts();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    DB.setArray(DB.KEYS.DEBTS, list);
    return true;
  },

  deleteDebt(id) {
    const list = this.getDebts().filter(i => i.id !== id);
    DB.setArray(DB.KEYS.DEBTS, list);
  },

  totalDebts() {
    return this.getDebts().reduce((sum, d) => {
      const remaining = (parseFloat(d.amount) || 0) - (parseFloat(d.paid) || 0);
      return sum + Math.max(0, remaining);
    }, 0);
  },

  /* ════ إدارة الاستثمارات ════ */

  getInvestments() {
    return DB.getArray(DB.KEYS.INVESTMENTS);
  },

  addInvestment(item) {
    const list = this.getInvestments();
    const newItem = { id: this.uid(), ...item };
    list.push(newItem);
    DB.setArray(DB.KEYS.INVESTMENTS, list);
    return newItem;
  },

  updateInvestment(id, updates) {
    const list = this.getInvestments();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    DB.setArray(DB.KEYS.INVESTMENTS, list);
    return true;
  },

  deleteInvestment(id) {
    const list = this.getInvestments().filter(i => i.id !== id);
    DB.setArray(DB.KEYS.INVESTMENTS, list);
  },

  calcROI(inv) {
    const capital = parseFloat(inv.capital) || 0;
    const profit  = parseFloat(inv.profit)  || 0;
    if (capital === 0) return 0;
    return ((profit / capital) * 100);
  },

  totalInvestments() {
    return this.getInvestments().reduce((sum, i) => sum + (parseFloat(i.capital) || 0), 0);
  },

  totalInvestmentProfit() {
    return this.getInvestments().reduce((sum, i) => sum + (parseFloat(i.profit) || 0), 0);
  },

  /* ════ الميزانية ════ */

  getBudget() {
    return DB.get(DB.KEYS.BUDGET) || {
      food: 0, transport: 0, education: 0, health: 0,
      entertainment: 0, shopping: 0, bills: 0, internet: 0
    };
  },

  setBudget(budget) {
    DB.set(DB.KEYS.BUDGET, budget);
  },

  /* ════ الإعدادات ════ */

  getSettings() {
    return DB.get(DB.KEYS.SETTINGS) || { theme: 'dark', currency: 'EGP' };
  },

  saveSettings(s) {
    DB.set(DB.KEYS.SETTINGS, { ...this.getSettings(), ...s });
  },

  /* ════ تحليلات شاملة ════ */

  getMonthSummary(month, year) {
    const income   = this.totalIncome(month, year);
    const expenses = this.totalExpenses(month, year);
    const debts    = this.totalDebts();
    const investments = this.totalInvestments();
    const net      = income - expenses;
    const savingRate   = income > 0 ? ((net / income) * 100) : 0;
    const spendRate    = income > 0 ? ((expenses / income) * 100) : 0;

    const budget = this.getBudget();
    const budgetTotal = Object.values(budget).reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const budgetRate = budgetTotal > 0 ? Math.min(100, (expenses / budgetTotal) * 100) : 0;

    return { income, expenses, net, debts, investments, savingRate, spendRate, budgetRate, budgetTotal };
  },

  /* ════ بناء بيانات الرسوم البيانية ════ */

  getBalanceTrend(month, year) {
    /* تطور الرصيد يومياً خلال الشهر */
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyExp = this.dailyExpenses(month, year);

    // توزيع الدخل على اليوم الأول
    const totalInc = this.totalIncome(month, year);
    const labels = [];
    const data = [];
    let balance = totalInc;

    for (let d = 1; d <= daysInMonth; d++) {
      labels.push(d);
      if (d > 1) balance -= (dailyExp[d] || 0);
      data.push(parseFloat(balance.toFixed(2)));
    }
    return { labels, data };
  },

  /* ════ مرشّح الفترة الزمنية ════ */

  _matchPeriod(dateStr, month, year) {
    if (!month && !year) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const matchMonth = month ? (d.getMonth() + 1) === parseInt(month) : true;
    const matchYear  = year  ? d.getFullYear() === parseInt(year) : true;
    return matchMonth && matchYear;
  },

  /* ════ بحث في المعاملات ════ */

  searchTransactions(query, month, year) {
    const q = query.toLowerCase().trim();
    const income = this.getIncome()
      .filter(i => this._matchPeriod(i.date, month, year))
      .filter(i => !q || i.name.toLowerCase().includes(q) || (i.notes || '').toLowerCase().includes(q))
      .map(i => ({ ...i, type: 'income' }));

    const expenses = this.getExpenses()
      .filter(i => this._matchPeriod(i.date, month, year))
      .filter(i => !q || i.name.toLowerCase().includes(q) || (i.category || '').toLowerCase().includes(q))
      .map(i => ({ ...i, type: 'expense' }));

    return [...income, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

/* ════════════════════════════════════════
   طبقة واجهة المستخدم — UI Layer
   ════════════════════════════════════════ */

const UI = {

  /* ── ثوابت الفئات — Lucide SVG IDs ── */
  EXPENSE_CATEGORIES: {
    food:          { label: 'الطعام',          iconId: 'ic-food',     color: 'orange' },
    transport:     { label: 'المواصلات',       iconId: 'ic-car',      color: 'cyan'   },
    education:     { label: 'الدراسة',         iconId: 'ic-book',     color: 'purple' },
    internet:      { label: 'إنترنت واتصالات', iconId: 'ic-wifi',     color: 'cyan'   },
    health:        { label: 'الصحة',           iconId: 'ic-health',   color: 'red'    },
    entertainment: { label: 'الترفيه',         iconId: 'ic-game',     color: 'purple' },
    shopping:      { label: 'التسوق',          iconId: 'ic-shopping', color: 'gold'   },
    bills:         { label: 'فواتير',          iconId: 'ic-bills',    color: 'orange' },
    other:         { label: 'أخرى',            iconId: 'ic-other',    color: 'cyan'   },
  },

  INCOME_SOURCES: {
    salary:    { label: 'الراتب',        iconId: 'ic-briefcase', color: 'green' },
    freelance: { label: 'عمل حر',        iconId: 'ic-cpu',       color: 'cyan'  },
    business:  { label: 'أرباح مشاريع', iconId: 'ic-layers',    color: 'gold'  },
    other:     { label: 'أخرى',          iconId: 'ic-dollar',    color: 'green' },
  },

  INVESTMENT_TYPES: {
    stocks:     { label: 'أسهم',         iconId: 'ic-bar-chart' },
    gold:       { label: 'ذهب',          iconId: 'ic-coins'     },
    realEstate: { label: 'عقارات',       iconId: 'ic-building'  },
    crypto:     { label: 'عملات رقمية', iconId: 'ic-activity'  },
    savings:    { label: 'توفير',        iconId: 'ic-piggy'     },
    other:      { label: 'أخرى',         iconId: 'ic-briefcase' },
  },

  /* ── SVG icon helper ── */
  svgIcon(id, cls) {
    return `<svg class="icon ${cls||'icon-sm'}" viewBox="0 0 24 24"><use href="#${id}"/></svg>`;
  },

  /* ── حالة التطبيق ── */
  state: {
    currentPage: 'dashboard',
    filterMonth: new Date().getMonth() + 1,
    filterYear: new Date().getFullYear(),
    editingId: null,
    editingType: null,
    searchQuery: '',
    charts: {},
  },

  /* ════════════════════════════════════════
     تهيئة التطبيق
     ════════════════════════════════════════ */

  init() {
    this.applyTheme();
    this.registerServiceWorker();
    this.bindNavigation();
    this.bindGlobalEvents();
    this.setupFilters();
    this.navigateTo('dashboard');
    this.hideWelcome();
  },

  applyTheme() {
    const settings = Finance.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = settings.theme === 'dark' ? '☀️' : '🌙';
  },

  toggleTheme() {
    const settings = Finance.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    Finance.saveSettings({ theme: newTheme });
    this.applyTheme();
    Toast.show('تم تغيير المظهر', 'info');
  },

  hideWelcome() {
    const ws = document.getElementById('welcomeScreen');
    if (ws) {
      setTimeout(() => {
        ws.style.opacity = '0';
        ws.style.transition = 'opacity 0.5s';
        setTimeout(() => ws.remove(), 500);
      }, 1200);
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('[App] Service Worker registered'))
        .catch(err => console.warn('[App] SW registration failed:', err));
    }
  },

  /* ════════════════════════════════════════
     التنقل بين الصفحات
     ════════════════════════════════════════ */

  bindNavigation() {
    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.navigateTo(page);
      });
    });
  },

  navigateTo(page) {
    this.state.currentPage = page;

    // تحديث الصفحة النشطة
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // تحديث شريط التنقل — الـ 5 عناصر الرئيسية
    const mainPages = ['dashboard','transactions','expenses','analytics','more'];
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      const btnPage = btn.dataset.page;
      // إذا كانت الصفحة من صفحات "المزيد" تُضيء زر More
      const isMoreChild = ['debts','investments','income'].includes(page);
      const isActive = btnPage === page || (isMoreChild && btnPage === 'more');
      btn.classList.toggle('active', isActive);
    });

    // تحديث المحتوى
    this.renderPage(page);
  },

  renderPage(page) {
    switch (page) {
      case 'dashboard':    this.renderDashboard();   break;
      case 'income':       this.renderIncome();       break;
      case 'expenses':     this.renderExpenses();     break;
      case 'debts':        this.renderDebts();        break;
      case 'investments':  this.renderInvestments();  break;
      case 'budget':       this.renderBudget();       break;
      case 'analytics':    this.renderAnalytics();    break;
      case 'transactions': this.renderTransactions(); break;
      case 'more':         /* static page — no render needed */ break;
    }
  },

  /* ════════════════════════════════════════
     الأحداث العامة
     ════════════════════════════════════════ */

  bindGlobalEvents() {
    // زر الثيم
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => this.toggleTheme());

    // زر التصدير
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());

    // زر الاستيراد
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('importFile').click());

    const importFile = document.getElementById('importFile');
    if (importFile) importFile.addEventListener('change', (e) => this.importData(e));

    // FAB
    const fab = document.getElementById('fabBtn');
    if (fab) fab.addEventListener('click', () => this.fabAction());

    // إغلاق النوافذ
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    });

    // زر الإغلاق
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
  },

  setupFilters() {
    const now = new Date();
    const monthSel = document.getElementById('filterMonth');
    const yearSel  = document.getElementById('filterYear');

    if (monthSel) {
      const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                      'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      months.forEach((m, i) => {
        const opt = new Option(m, i + 1);
        if (i + 1 === now.getMonth() + 1) opt.selected = true;
        monthSel.add(opt);
      });
      monthSel.addEventListener('change', () => {
        this.state.filterMonth = parseInt(monthSel.value);
        this.renderPage(this.state.currentPage);
      });
    }

    if (yearSel) {
      for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) {
        const opt = new Option(y, y);
        if (y === now.getFullYear()) opt.selected = true;
        yearSel.add(opt);
      }
      yearSel.addEventListener('change', () => {
        this.state.filterYear = parseInt(yearSel.value);
        this.renderPage(this.state.currentPage);
      });
    }
  },

  fabAction() {
    switch (this.state.currentPage) {
      case 'income':      this.openIncomeModal();      break;
      case 'expenses':    this.openExpenseModal();     break;
      case 'debts':       this.openDebtModal();        break;
      case 'investments': this.openInvestmentModal();  break;
      default:            this.openExpenseModal();     break;
    }
  },

  /* ════════════════════════════════════════
     لوحة التحكم الرئيسية
     ════════════════════════════════════════ */

  renderDashboard() {
    const { filterMonth: m, filterYear: y } = this.state;
    const summary = Finance.getMonthSummary(m, y);

    // بطاقة الترحيب
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'صباح الخير' : now.getHours() < 18 ? 'مساء الخير' : 'مساء النور';
    const dateStr = now.toLocaleDateString('ar-EG', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    this.set('dash-greeting', greeting);
    this.set('dash-date', dateStr);
    this.set('dash-net-balance', Finance.formatCurrency(summary.net));

    // بطاقات الإحصاء
    this.set('dash-income',      Finance.formatCurrency(summary.income));
    this.set('dash-expenses',    Finance.formatCurrency(summary.expenses));
    this.set('dash-net',         Finance.formatCurrency(summary.net));
    this.set('dash-debts',       Finance.formatCurrency(summary.debts));
    this.set('dash-investments', Finance.formatCurrency(summary.investments));
    this.set('dash-saving-rate', Finance.formatPercent(summary.savingRate));
    this.set('dash-spend-rate',  Finance.formatPercent(summary.spendRate) + ' من الدخل');

    // Net Worth row
    const assets = summary.income + summary.investments;
    const liabilities = summary.expenses + summary.debts;
    this.set('dash-assets',      Finance.formatCurrency(assets));
    this.set('dash-liabilities', Finance.formatCurrency(liabilities));

    // Cash Flow progress bar
    const spendBar = document.getElementById('dash-spend-bar');
    if (spendBar) {
      const pct = Math.min(100, summary.spendRate);
      const color = pct >= 90 ? 'var(--color-negative)' : pct >= 70 ? 'var(--color-warning)' : 'var(--color-positive)';
      spendBar.style.width = pct + '%';
      spendBar.style.background = color;
    }

    // تلوين الرصيد الصافي
    const netEl = document.getElementById('dash-net');
    if (netEl) {
      netEl.style.color = summary.net >= 0 ? 'var(--color-positive)' : 'var(--color-negative)';
    }
    const balEl = document.getElementById('dash-net-balance');
    if (balEl) {
      balEl.className = 'hero-balance ' + (summary.net >= 0 ? '' : 'amount-negative');
    }

    // آخر المعاملات
    this.renderRecentTransactions();

    // الرسم الدائري
    this.renderDonutChart(summary);
  },

  renderRecentTransactions() {
    const { filterMonth: m, filterYear: y } = this.state;
    const all = Finance.searchTransactions('', m, y).slice(0, 6);
    const container = document.getElementById('recent-transactions');
    if (!container) return;

    if (!all.length) {
      container.innerHTML = this.emptyState('ic-list', 'لا توجد معاملات', 'أضف دخلاً أو مصروفاً للبدء');
      return;
    }

    container.innerHTML = all.map(tx => this.txItemHTML(tx)).join('');
  },

  txItemHTML(tx) {
    const isIncome = tx.type === 'income';
    const cat = isIncome
      ? (UI.INCOME_SOURCES[tx.source] || UI.INCOME_SOURCES.other)
      : (UI.EXPENSE_CATEGORIES[tx.category] || UI.EXPENSE_CATEGORIES.other);

    const colorVar = `var(--color-${cat.color === 'cyan' ? 'brand' : cat.color === 'gold' ? 'warning' : cat.color}-dim, var(--color-brand-dim))`;
    const iconSvg  = this.svgIcon(cat.iconId);

    return `
      <div class="transaction-item">
        <div class="transaction-icon" style="background:${colorVar};color:var(--color-text-secondary)">${iconSvg}</div>
        <div class="transaction-info">
          <div class="transaction-name">${this.esc(tx.name)}</div>
          <div class="transaction-meta">${cat.label} · ${Finance.formatDate(tx.date)}</div>
        </div>
        <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
          ${isIncome ? '+' : '−'}${Finance.formatCurrency(tx.amount)}
        </div>
      </div>`;
  },

  renderDonutChart(summary) {
    const ctx = document.getElementById('donutChart');
    if (!ctx) return;

    if (this.state.charts.donut) {
      this.state.charts.donut.destroy();
    }

    const isDark = Finance.getSettings().theme !== 'light';
    const total = summary.expenses + summary.net + summary.debts + summary.investments;

    if (total <= 0) return;

    this.state.charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['المصروفات', 'الادخار', 'الديون', 'الاستثمارات'],
        datasets: [{
          data: [
            Math.max(0, summary.expenses),
            Math.max(0, summary.net),
            Math.max(0, summary.debts),
            Math.max(0, summary.investments)
          ],
          backgroundColor: ['#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
          borderColor: isDark ? '#0b0f17' : '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#8492a6' : '#6b7280',
              font: { family: 'Cairo', size: 11 },
              padding: 12,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${Finance.formatCurrency(ctx.parsed)}`
            }
          }
        }
      }
    });
  },

  /* ════════════════════════════════════════
     صفحة الدخل
     ════════════════════════════════════════ */

  renderIncome() {
    const { filterMonth: m, filterYear: y } = this.state;
    const list = Finance.getIncome().filter(i => Finance._matchPeriod(i.date, m, y));
    const total = list.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

    this.set('income-total', Finance.formatCurrency(total));
    this.set('income-count', list.length + ' مصدر');

    const container = document.getElementById('income-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = this.emptyState('ic-dollar', 'لا يوجد دخل مسجل', 'اضغط + لإضافة مصدر دخل جديد');
      return;
    }

    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = sorted.map(item => {
      const src = UI.INCOME_SOURCES[item.source] || UI.INCOME_SOURCES.other;
      const colorKey = src.color === 'cyan' ? 'brand' : src.color === 'gold' ? 'warning' : src.color;
      return `
        <div class="transaction-item fade-in">
          <div class="transaction-icon" style="background:var(--color-${colorKey}-dim);color:var(--color-${colorKey})">
            ${UI.svgIcon(src.iconId)}
          </div>
          <div class="transaction-info">
            <div class="transaction-name">${this.esc(item.name)}</div>
            <div class="transaction-meta">${src.label} · ${Finance.formatDate(item.date)}</div>
            ${item.notes ? `<div class="transaction-meta">${this.esc(item.notes)}</div>` : ''}
          </div>
          <div class="transaction-amount income">${Finance.formatCurrency(item.amount)}</div>
          <div class="transaction-actions">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="UI.openIncomeModal('${item.id}')" title="تعديل">
              ${UI.svgIcon('ic-edit')}
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="UI.confirmDelete('income','${item.id}')" title="حذف">
              ${UI.svgIcon('ic-trash')}
            </button>
          </div>
        </div>`;
    }).join('');
  },

  openIncomeModal(editId = null) {
    this.state.editingId = editId;
    this.state.editingType = 'income';

    const item = editId ? Finance.getIncome().find(i => i.id === editId) : null;
    const modal = document.getElementById('incomeModal');
    if (!modal) return;

    modal.querySelector('.modal-title').dataset.editMode = editId ? '1' : '0';
    document.getElementById('inc-name').value   = item?.name   || '';
    document.getElementById('inc-amount').value = item?.amount || '';
    document.getElementById('inc-source').value = item?.source || 'salary';
    document.getElementById('inc-date').value   = item?.date   || Finance.today();
    document.getElementById('inc-notes').value  = item?.notes  || '';

    this.openModal('incomeModal');
  },

  saveIncome() {
    const name   = document.getElementById('inc-name').value.trim();
    const amount = parseFloat(document.getElementById('inc-amount').value);
    const source = document.getElementById('inc-source').value;
    const date   = document.getElementById('inc-date').value;
    const notes  = document.getElementById('inc-notes').value.trim();

    if (!name) return Toast.show('أدخل اسم مصدر الدخل', 'error');
    if (!amount || amount <= 0) return Toast.show('أدخل مبلغاً صحيحاً', 'error');
    if (!date) return Toast.show('أدخل التاريخ', 'error');

    const data = { name, amount, source, date, notes };

    if (this.state.editingId) {
      Finance.updateIncome(this.state.editingId, data);
      Toast.show('تم تعديل الدخل', 'success');
    } else {
      Finance.addIncome(data);
      Toast.show('تم إضافة الدخل', 'success');
    }

    this.closeModal();
    this.renderPage('income');
  },

  /* ════════════════════════════════════════
     صفحة المصروفات
     ════════════════════════════════════════ */

  renderExpenses() {
    const { filterMonth: m, filterYear: y } = this.state;
    const list = Finance.getExpenses().filter(i => Finance._matchPeriod(i.date, m, y));
    const total = list.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

    this.set('exp-total', Finance.formatCurrency(total));
    this.set('exp-count', list.length + ' عملية');

    // ملخص بالفئات
    const catSummary = document.getElementById('exp-categories-summary');
    if (catSummary) {
      const byCat = Finance.expensesByCategory(m, y);
      const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 4);
      catSummary.innerHTML = sorted.map(([cat, amt]) => {
        const info = UI.EXPENSE_CATEGORIES[cat] || UI.EXPENSE_CATEGORIES.other;
        const pct = total > 0 ? (amt / total * 100) : 0;
        const colorKey = info.color === 'cyan' ? 'brand' : info.color === 'gold' ? 'warning' : info.color;
        return `
          <div class="budget-category" style="padding:10px 0">
            <div class="budget-category-header">
              <div class="budget-category-name">
                <span class="budget-category-icon" style="color:var(--color-${colorKey})">${UI.svgIcon(info.iconId)}</span>
                ${info.label}
              </div>
              <div style="font-family:var(--font-display);font-size:13px;font-weight:700;color:var(--color-${colorKey})">${Finance.formatCurrency(amt)}</div>
            </div>
            <div class="progress-wrap">
              <div class="progress-bar progress-${info.color}" style="width:${pct.toFixed(0)}%"></div>
            </div>
            <div class="budget-status">
              <span>${pct.toFixed(1)}% من المصروفات</span>
            </div>
          </div>`;
      }).join('') || '<p class="text-muted" style="padding:12px 0;text-align:center">لا توجد بيانات</p>';
    }

    const container = document.getElementById('expenses-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = this.emptyState('ic-shopping', 'لا توجد مصروفات', 'اضغط + لتسجيل مصروف جديد');
      return;
    }

    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    container.innerHTML = sorted.map(item => {
      const cat = UI.EXPENSE_CATEGORIES[item.category] || UI.EXPENSE_CATEGORIES.other;
      const colorKey = cat.color === 'cyan' ? 'brand' : cat.color === 'gold' ? 'warning' : cat.color;
      return `
        <div class="transaction-item fade-in">
          <div class="transaction-icon" style="background:var(--color-${colorKey}-dim);color:var(--color-${colorKey})">
            ${UI.svgIcon(cat.iconId)}
          </div>
          <div class="transaction-info">
            <div class="transaction-name">${this.esc(item.name)}</div>
            <div class="transaction-meta">${cat.label} · ${Finance.formatDate(item.date)}</div>
          </div>
          <div class="transaction-amount expense">−${Finance.formatCurrency(item.amount)}</div>
          <div class="transaction-actions">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="UI.openExpenseModal('${item.id}')" title="تعديل">
              ${UI.svgIcon('ic-edit')}
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="UI.confirmDelete('expense','${item.id}')" title="حذف">
              ${UI.svgIcon('ic-trash')}
            </button>
          </div>
        </div>`;
    }).join('');

    // رسم الأعمدة اليومي
    this.renderBarChart(m, y);
  },

  openExpenseModal(editId = null) {
    this.state.editingId = editId;
    this.state.editingType = 'expense';

    const item = editId ? Finance.getExpenses().find(i => i.id === editId) : null;
    const modal = document.getElementById('expenseModal');
    if (!modal) return;

    modal.querySelector('.modal-title').dataset.editMode = editId ? '1' : '0';
    document.getElementById('exp-name').value     = item?.name     || '';
    document.getElementById('exp-amount').value   = item?.amount   || '';
    document.getElementById('exp-category').value = item?.category || 'food';
    document.getElementById('exp-date').value     = item?.date     || Finance.today();
    document.getElementById('exp-notes').value    = item?.notes    || '';

    this.openModal('expenseModal');
  },

  saveExpense() {
    const name     = document.getElementById('exp-name').value.trim();
    const amount   = parseFloat(document.getElementById('exp-amount').value);
    const category = document.getElementById('exp-category').value;
    const date     = document.getElementById('exp-date').value;
    const notes    = document.getElementById('exp-notes').value.trim();

    if (!name) return Toast.show('أدخل اسم المصروف', 'error');
    if (!amount || amount <= 0) return Toast.show('أدخل مبلغاً صحيحاً', 'error');
    if (!date) return Toast.show('أدخل التاريخ', 'error');

    const data = { name, amount, category, date, notes };

    if (this.state.editingId) {
      Finance.updateExpense(this.state.editingId, data);
      Toast.show('تم تعديل المصروف', 'success');
    } else {
      Finance.addExpense(data);
      Toast.show('تم تسجيل المصروف', 'success');
    }

    this.closeModal();
    this.renderPage('expenses');
  },

  renderBarChart(month, year) {
    const ctx = document.getElementById('barChart');
    if (!ctx) return;
    if (this.state.charts.bar) this.state.charts.bar.destroy();

    const daily = Finance.dailyExpenses(month, year);
    const labels = Object.keys(daily).map(d => d.toString());
    const data = Object.values(daily);
    const isDark = Finance.getSettings().theme !== 'light';

    this.state.charts.bar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'الإنفاق اليومي',
          data,
          backgroundColor: 'hsla(0,84%,60%,0.5)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => Finance.formatCurrency(ctx.parsed.y) }
          }
        },
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#4a5568' : '#94a3b8', font: { size: 9 }, maxRotation: 0 }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#4a5568' : '#94a3b8',
              font: { size: 10 },
              callback: v => (v >= 1000 ? (v/1000).toFixed(0) + 'ك' : v)
            }
          }
        }
      }
    });
  },

  /* ════════════════════════════════════════
     صفحة الديون
     ════════════════════════════════════════ */

  renderDebts() {
    const list = Finance.getDebts();
    const total = Finance.totalDebts();

    this.set('debts-total', Finance.formatCurrency(total));
    this.set('debts-count', list.length + ' دين');

    const container = document.getElementById('debts-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = this.emptyState('ic-target', 'لا توجد ديون مسجلة', 'ممتاز! يمكنك إضافة أي ديون لمتابعتها');
      return;
    }

    container.innerHTML = list.map(debt => {
      const amount    = parseFloat(debt.amount) || 0;
      const paid      = parseFloat(debt.paid)   || 0;
      const remaining = Math.max(0, amount - paid);
      const paidPct   = amount > 0 ? (paid / amount * 100) : 0;
      const days      = Finance.daysUntil(debt.dueDate);

      let statusClass = '';
      let statusBadge = '';
      if (days !== null) {
        if (days < 0) {
          statusClass = 'overdue';
          statusBadge = `<span class="badge badge-red">${UI.svgIcon('ic-alert')} متأخر ${Math.abs(days)} يوم</span>`;
        } else if (days <= 7) {
          statusClass = 'warning';
          statusBadge = `<span class="badge badge-orange">${UI.svgIcon('ic-alert')} متبقي ${days} أيام</span>`;
        } else {
          statusBadge = `<span class="badge badge-cyan">متبقي ${days} يوم</span>`;
        }
      }

      return `
        <div class="debt-card ${statusClass} fade-in">
          <div class="debt-header">
            <div>
              <div class="debt-name" style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--color-text-muted)">${UI.svgIcon('ic-landmark')}</span>
                ${this.esc(debt.creditor)}
              </div>
              <div class="debt-due">${debt.dueDate ? 'الاستحقاق: ' + Finance.formatDate(debt.dueDate) : 'بدون استحقاق'}</div>
            </div>
            <div style="text-align:left">
              ${statusBadge}
              <div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end">
                <button class="btn btn-ghost btn-icon btn-sm" onclick="UI.openDebtModal('${debt.id}')" title="تعديل">
                  ${UI.svgIcon('ic-edit')}
                </button>
                <button class="btn btn-danger btn-icon btn-sm" onclick="UI.confirmDelete('debt','${debt.id}')" title="حذف">
                  ${UI.svgIcon('ic-trash')}
                </button>
              </div>
            </div>
          </div>
          <div class="debt-amounts">
            <div class="debt-amount-item">
              <div class="debt-amount-label">إجمالي الدين</div>
              <div class="debt-amount-value" style="color:var(--color-negative)">${Finance.formatCurrency(amount)}</div>
            </div>
            <div class="debt-amount-item">
              <div class="debt-amount-label">المبلغ المتبقي</div>
              <div class="debt-amount-value" style="color:var(--color-warning)">${Finance.formatCurrency(remaining)}</div>
            </div>
            <div class="debt-amount-item">
              <div class="debt-amount-label">المدفوع</div>
              <div class="debt-amount-value" style="color:var(--color-positive)">${Finance.formatCurrency(paid)}</div>
            </div>
            <div class="debt-amount-item">
              <div class="debt-amount-label">نسبة السداد</div>
              <div class="debt-amount-value" style="color:var(--color-brand)">${Finance.formatPercent(paidPct)}</div>
            </div>
          </div>
          <div class="progress-wrap" style="height:6px;margin-top:4px">
            <div class="progress-bar progress-green" style="width:${paidPct.toFixed(0)}%"></div>
          </div>
        </div>`;
    }).join('');
  },

  openDebtModal(editId = null) {
    this.state.editingId = editId;
    const item = editId ? Finance.getDebts().find(i => i.id === editId) : null;
    const modal = document.getElementById('debtModal');
    if (!modal) return;

    modal.querySelector('.modal-title').dataset.editMode = editId ? '1' : '0';
    document.getElementById('debt-creditor').value = item?.creditor || '';
    document.getElementById('debt-amount').value   = item?.amount   || '';
    document.getElementById('debt-paid').value     = item?.paid     || '0';
    document.getElementById('debt-due').value      = item?.dueDate  || '';
    document.getElementById('debt-notes').value    = item?.notes    || '';

    this.openModal('debtModal');
  },

  saveDebt() {
    const creditor = document.getElementById('debt-creditor').value.trim();
    const amount   = parseFloat(document.getElementById('debt-amount').value);
    const paid     = parseFloat(document.getElementById('debt-paid').value) || 0;
    const dueDate  = document.getElementById('debt-due').value;
    const notes    = document.getElementById('debt-notes').value.trim();

    if (!creditor) return Toast.show('أدخل اسم الدائن', 'error');
    if (!amount || amount <= 0) return Toast.show('أدخل مبلغاً صحيحاً', 'error');

    const data = { creditor, amount, paid, dueDate, notes };

    if (this.state.editingId) {
      Finance.updateDebt(this.state.editingId, data);
      Toast.show('تم تعديل الدين', 'success');
    } else {
      Finance.addDebt(data);
      Toast.show('تم إضافة الدين', 'success');
    }

    this.closeModal();
    this.renderPage('debts');
  },

  /* ════════════════════════════════════════
     صفحة الاستثمارات
     ════════════════════════════════════════ */

  renderInvestments() {
    const list = Finance.getInvestments();
    const totalCapital = Finance.totalInvestments();
    const totalProfit  = Finance.totalInvestmentProfit();

    this.set('inv-total-capital', Finance.formatCurrency(totalCapital));
    this.set('inv-total-profit',  Finance.formatCurrency(totalProfit));
    this.set('inv-count', list.length + ' استثمار');

    const container = document.getElementById('investments-list');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = this.emptyState('ic-trending-up', 'لا توجد استثمارات', 'أضف استثماراتك لمتابعة عوائدها');
      return;
    }

    container.innerHTML = list.map(inv => {
      const roi = Finance.calcROI(inv);
      const profit = parseFloat(inv.profit) || 0;
      const type = UI.INVESTMENT_TYPES[inv.type] || UI.INVESTMENT_TYPES.other;

      return `
        <div class="investment-card fade-in">
          <div class="investment-header">
            <div>
              <div class="investment-name" style="display:flex;align-items:center;gap:6px">
                <span style="color:var(--color-text-muted)">${UI.svgIcon(type.iconId)}</span>
                ${this.esc(inv.name)}
              </div>
              <div style="font-size:11px;color:var(--color-text-muted);margin-top:3px">${type.label} · ${Finance.formatDate(inv.startDate)}</div>
            </div>
            <div style="text-align:left">
              <div class="investment-roi ${roi >= 0 ? 'positive' : 'negative'}">${roi >= 0 ? '+' : ''}${Finance.formatPercent(roi)}</div>
              <div style="font-size:11px;color:var(--color-text-muted)">العائد</div>
            </div>
          </div>
          <div class="investment-details">
            <div class="investment-detail">
              <div class="investment-detail-label">رأس المال</div>
              <div class="investment-detail-value" style="color:var(--color-brand)">${Finance.formatCurrency(inv.capital)}</div>
            </div>
            <div class="investment-detail">
              <div class="investment-detail-label">الأرباح</div>
              <div class="investment-detail-value" style="color:${profit >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'}">${Finance.formatCurrency(profit)}</div>
            </div>
            <div class="investment-detail">
              <div class="investment-detail-label">الإجمالي</div>
              <div class="investment-detail-value" style="color:var(--color-warning)">${Finance.formatCurrency((parseFloat(inv.capital)||0) + profit)}</div>
            </div>
          </div>
          <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" onclick="UI.openInvestmentModal('${inv.id}')">
              ${UI.svgIcon('ic-edit')} تعديل
            </button>
            <button class="btn btn-danger btn-sm" onclick="UI.confirmDelete('investment','${inv.id}')">
              ${UI.svgIcon('ic-trash')} حذف
            </button>
          </div>
        </div>`;
    }).join('');
  },

  openInvestmentModal(editId = null) {
    this.state.editingId = editId;
    const item = editId ? Finance.getInvestments().find(i => i.id === editId) : null;
    const modal = document.getElementById('investmentModal');
    if (!modal) return;

    modal.querySelector('.modal-title').dataset.editMode = editId ? '1' : '0';
    document.getElementById('inv-name').value      = item?.name      || '';
    document.getElementById('inv-type').value      = item?.type      || 'stocks';
    document.getElementById('inv-capital').value   = item?.capital   || '';
    document.getElementById('inv-profit').value    = item?.profit    || '0';
    document.getElementById('inv-start').value     = item?.startDate || Finance.today();

    this.openModal('investmentModal');
  },

  saveInvestment() {
    const name      = document.getElementById('inv-name').value.trim();
    const type      = document.getElementById('inv-type').value;
    const capital   = parseFloat(document.getElementById('inv-capital').value);
    const profit    = parseFloat(document.getElementById('inv-profit').value) || 0;
    const startDate = document.getElementById('inv-start').value;

    if (!name) return Toast.show('أدخل اسم الاستثمار', 'error');
    if (!capital || capital <= 0) return Toast.show('أدخل رأس المال', 'error');

    const data = { name, type, capital, profit, startDate };

    if (this.state.editingId) {
      Finance.updateInvestment(this.state.editingId, data);
      Toast.show('تم تعديل الاستثمار', 'success');
    } else {
      Finance.addInvestment(data);
      Toast.show('تم إضافة الاستثمار', 'success');
    }

    this.closeModal();
    this.renderPage('investments');
  },

  /* ════════════════════════════════════════
     صفحة الميزانية
     ════════════════════════════════════════ */

  renderBudget() {
    const { filterMonth: m, filterYear: y } = this.state;
    const budget = Finance.getBudget();
    const byCat  = Finance.expensesByCategory(m, y);

    const categories = [
      { key: 'food',          iconId: 'ic-food',     label: 'الطعام',         color: 'orange' },
      { key: 'transport',     iconId: 'ic-car',      label: 'المواصلات',      color: 'cyan'   },
      { key: 'education',     iconId: 'ic-book',     label: 'الدراسة',        color: 'purple' },
      { key: 'entertainment', iconId: 'ic-game',     label: 'الترفيه',        color: 'purple' },
      { key: 'shopping',      iconId: 'ic-shopping', label: 'التسوق',         color: 'gold'   },
      { key: 'health',        iconId: 'ic-health',   label: 'الصحة',          color: 'red'    },
      { key: 'bills',         iconId: 'ic-bills',    label: 'الفواتير',       color: 'orange' },
      { key: 'internet',      iconId: 'ic-wifi',     label: 'الإنترنت',       color: 'cyan'   },
    ];

    // حقول الإدخال
    const inputsContainer = document.getElementById('budget-inputs');
    if (inputsContainer) {
      inputsContainer.innerHTML = categories.map(cat => `
        <div class="budget-input-row">
          <span class="budget-input-icon">${UI.svgIcon(cat.iconId)}</span>
          <span class="budget-input-label">${cat.label}</span>
          <input type="number" class="budget-input-field" id="budget-${cat.key}"
            value="${budget[cat.key] || ''}" placeholder="0"
            onchange="UI.saveBudgetField('${cat.key}', this.value)" min="0" step="50">
        </div>`).join('');
    }

    // تقرير التقدم
    const reportContainer = document.getElementById('budget-report');
    if (reportContainer) {
      reportContainer.innerHTML = categories.map(cat => {
        const budgeted = parseFloat(budget[cat.key]) || 0;
        const spent    = byCat[cat.key] || 0;
        const remaining = budgeted - spent;
        const pct = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;

        const barColor = pct >= 100 ? 'red' : pct >= 80 ? 'orange' : cat.color;
        const remainColor = remaining < 0 ? 'var(--accent-red)' : remaining === 0 && budgeted === 0 ? 'var(--color-text-muted)' : 'var(--accent-green)';

        return `
          <div class="budget-category">
            <div class="budget-category-header">
              <div class="budget-category-name">
                <span class="budget-category-icon">${UI.svgIcon(cat.iconId)}</span>
                ${cat.label}
              </div>
              <div class="budget-category-amounts">
                ${budgeted > 0
                  ? `<strong style="color:var(--color-brand)">${Finance.formatCurrency(spent)}</strong> / ${Finance.formatCurrency(budgeted)}`
                  : `<span style="color:var(--color-text-muted)">لم تُحدد ميزانية</span>`}
              </div>
            </div>
            ${budgeted > 0 ? `
            <div class="progress-wrap">
              <div class="progress-bar progress-${barColor}" style="width:${pct.toFixed(0)}%"></div>
            </div>
            <div class="budget-status">
              <span>${pct.toFixed(0)}% مستخدم</span>
              <span style="color:${remainColor}">
                ${remaining >= 0 ? 'متبقي ' + Finance.formatCurrency(remaining) : 'تجاوزت بـ ' + Finance.formatCurrency(Math.abs(remaining))}
              </span>
            </div>` : ''}
          </div>`;
      }).join('');
    }
  },

  saveBudgetField(key, value) {
    const budget = Finance.getBudget();
    budget[key] = parseFloat(value) || 0;
    Finance.setBudget(budget);
    // إعادة الرسم
    setTimeout(() => this.renderPage('budget'), 50);
  },

  /* ════════════════════════════════════════
     صفحة التحليلات
     ════════════════════════════════════════ */

  renderAnalytics() {
    const { filterMonth: m, filterYear: y } = this.state;
    const summary = Finance.getMonthSummary(m, y);

    // جدول المؤشرات
    const rows = [
      { label: 'إجمالي الدخل',           value: Finance.formatCurrency(summary.income),      pct: 100,                 color: 'green'  },
      { label: 'إجمالي المصروفات',       value: Finance.formatCurrency(summary.expenses),    pct: summary.spendRate,   color: 'red'    },
      { label: 'صافي الرصيد',            value: Finance.formatCurrency(summary.net),         pct: Math.max(0, summary.savingRate), color: summary.net >= 0 ? 'green' : 'red' },
      { label: 'إجمالي الديون',          value: Finance.formatCurrency(summary.debts),       pct: summary.income > 0 ? Math.min(100, summary.debts / summary.income * 100) : 0, color: 'red' },
      { label: 'إجمالي الاستثمارات',    value: Finance.formatCurrency(summary.investments), pct: summary.income > 0 ? Math.min(100, summary.investments / summary.income * 100) : 0, color: 'purple' },
      { label: 'نسبة الادخار',          value: Finance.formatPercent(summary.savingRate),   pct: Math.max(0, summary.savingRate), color: 'cyan'   },
      { label: 'الالتزام بالميزانية',   value: Finance.formatPercent(100 - summary.budgetRate), pct: Math.max(0, 100 - summary.budgetRate), color: 'gold' },
    ];

    const container = document.getElementById('analytics-table');
    if (container) {
      container.innerHTML = rows.map(row => `
        <div class="analytics-row fade-in">
          <div class="analytics-label">${row.label}</div>
          <div class="analytics-value" style="color:var(--accent-${row.color})">${row.value}</div>
          <div class="analytics-progress">
            <div class="progress-wrap" style="margin:0">
              <div class="progress-bar progress-${row.color}" style="width:${Math.min(100, row.pct).toFixed(0)}%"></div>
            </div>
            <div style="font-size:10px;color:var(--color-text-muted);text-align:center;margin-top:3px">${row.pct.toFixed(0)}%</div>
          </div>
        </div>`).join('');
    }

    // رسم الاتجاه الخطي
    this.renderLineChart(m, y);

    // توزيع المصروفات بالفئات
    this.renderCategoryChart(m, y);
  },

  renderLineChart(month, year) {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;
    if (this.state.charts.line) this.state.charts.line.destroy();

    const trend = Finance.getBalanceTrend(month, year);
    const isDark = Finance.getSettings().theme !== 'light';

    this.state.charts.line = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [{
          label: 'الرصيد',
          data: trend.data,
          borderColor: '#4f7cff',
          backgroundColor: 'hsla(224,100%,65%,0.06)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#4f7cff',
          fill: true,
          tension: 0.4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => Finance.formatCurrency(ctx.parsed.y) }
          }
        },
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
            ticks: { color: isDark ? '#4a5568' : '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
            ticks: {
              color: isDark ? '#4a5568' : '#94a3b8',
              font: { size: 10 },
              callback: v => (v >= 1000 ? (v/1000).toFixed(1) + 'ك' : v)
            }
          }
        }
      }
    });
  },

  renderCategoryChart(month, year) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    if (this.state.charts.category) this.state.charts.category.destroy();

    const byCat = Finance.expensesByCategory(month, year);
    const entries = Object.entries(byCat).filter(([, v]) => v > 0);
    if (!entries.length) return;

    const isDark = Finance.getSettings().theme !== 'light';
    const colors = ['#ff4757','#00d4ff','#00ff88','#ffa502','#a855f7','#f59e0b','#06b6d4','#ec4899'];

    this.state.charts.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: entries.map(([k]) => (UI.EXPENSE_CATEGORIES[k] || UI.EXPENSE_CATEGORIES.other).label),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: colors.slice(0, entries.length),
          borderColor: isDark ? '#0b0f17' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: isDark ? '#8492a6' : '#6b7280',
              font: { family: 'Cairo', size: 10 },
              padding: 10,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: { label: ctx => ` ${Finance.formatCurrency(ctx.parsed)}` }
          }
        }
      }
    });
  },

  /* ════════════════════════════════════════
     صفحة المعاملات
     ════════════════════════════════════════ */

  renderTransactions() {
    const { filterMonth: m, filterYear: y, searchQuery } = this.state;
    const all = Finance.searchTransactions(searchQuery, m, y);

    this.set('tx-count', all.length + ' معاملة');

    const container = document.getElementById('transactions-list');
    if (!container) return;

    if (!all.length) {
      container.innerHTML = this.emptyState('ic-search', 'لا توجد نتائج', 'جرب تغيير الفلتر أو مصطلح البحث');
      return;
    }

    // تجميع حسب التاريخ
    const grouped = {};
    all.forEach(tx => {
      const key = tx.date || 'غير محدد';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tx);
    });

    container.innerHTML = Object.entries(grouped)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([date, txs]) => `
        <div class="tx-date-header">${Finance.formatDate(date)}</div>
        ${txs.map(tx => this.txItemHTML(tx)).join('')}
      `).join('');
  },

  setupSearch() {
    const input = document.getElementById('tx-search');
    if (input) {
      input.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value;
        this.renderTransactions();
      });
    }
  },

  /* ════════════════════════════════════════
     إدارة النوافذ المنبثقة
     ════════════════════════════════════════ */

  openModal(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) overlay.classList.add('active');
  },

  closeModal() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    this.state.editingId = null;
    this.state.editingType = null;
  },

  /* ════════════════════════════════════════
     تأكيد الحذف
     ════════════════════════════════════════ */

  confirmDelete(type, id) {
    const dialog = document.getElementById('confirmDialog');
    if (!dialog) return;

    dialog.classList.add('active');
    dialog.dataset.deleteType = type;
    dialog.dataset.deleteId   = id;
  },

  executeDelete() {
    const dialog = document.getElementById('confirmDialog');
    if (!dialog) return;

    const type = dialog.dataset.deleteType;
    const id   = dialog.dataset.deleteId;

    switch (type) {
      case 'income':     Finance.deleteIncome(id);     break;
      case 'expense':    Finance.deleteExpense(id);    break;
      case 'debt':       Finance.deleteDebt(id);       break;
      case 'investment': Finance.deleteInvestment(id); break;
    }

    dialog.classList.remove('active');
    Toast.show('تم الحذف', 'success');
    this.renderPage(this.state.currentPage);
  },

  cancelDelete() {
    const dialog = document.getElementById('confirmDialog');
    if (dialog) dialog.classList.remove('active');
  },

  /* ════════════════════════════════════════
     تصدير/استيراد البيانات
     ════════════════════════════════════════ */

  exportData() {
    const data = DB.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mizaniyati-backup-${Finance.today()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Toast.show('تم تصدير البيانات', 'success');
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        DB.importAll(data);
        Toast.show('تم استيراد البيانات', 'success');
        this.renderPage(this.state.currentPage);
      } catch {
        Toast.show('ملف غير صالح', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  /* ════════════════════════════════════════
     أدوات مساعدة
     ════════════════════════════════════════ */

  set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  emptyState(iconId, title, text) {
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg class="icon icon-lg" viewBox="0 0 24 24"><use href="#${iconId}"/></svg>
        </div>
        <div class="empty-title">${title}</div>
        <div class="empty-text">${text}</div>
      </div>`;
  },
};

/* ════════════════════════════════════════
   نظام الإشعارات — Toast System
   ════════════════════════════════════════ */

const Toast = {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

/* ════════════════════════════════════════
   تهيئة التطبيق عند تحميل الصفحة
   ════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // إدراج بيانات تجريبية إذا كانت القاعدة فارغة
  Demo.seedIfEmpty();

  UI.init();
  UI.setupSearch();

  // PWA: زر التثبيت
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
      installBtn.style.display = 'flex';
      installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          installBtn.style.display = 'none';
        });
      });
    }
  });

  console.log('%cميزانيتي 💰 v1.0', 'color:#4f7cff;font-family:Cairo;font-size:18px;font-weight:bold');
  console.log('%cPersonal Finance Tracker — Offline First PWA', 'color:#94a3b8');
});

/* ════════════════════════════════════════
   بيانات تجريبية — Demo Seed
   تُضاف تلقائياً عند أول تشغيل فقط
   ════════════════════════════════════════ */

const Demo = {
  seedIfEmpty() {
    const hasData = Finance.getIncome().length > 0 || Finance.getExpenses().length > 0;
    if (hasData) return; // لا تُعيد الإضافة إذا كانت هناك بيانات

    const now   = new Date();
    const y     = now.getFullYear();
    const m     = String(now.getMonth() + 1).padStart(2, '0');
    const day   = (d) => `${y}-${m}-${String(d).padStart(2,'0')}`;

    // ── دخل ──
    Finance.addIncome({ name: 'الراتب الشهري',           amount: 12000, source: 'salary',    date: day(1),  notes: 'راتب يونيو' });
    Finance.addIncome({ name: 'مشروع فري لانس',          amount: 2500,  source: 'freelance',  date: day(8),  notes: 'تصميم موقع' });
    Finance.addIncome({ name: 'أرباح مشروع صغير',       amount: 800,   source: 'business',   date: day(15), notes: '' });

    // ── مصروفات ──
    Finance.addExpense({ name: 'سوبر ماركت كارفور',      amount: 850,   category: 'food',          date: day(2)  });
    Finance.addExpense({ name: 'مطعم الغداء',            amount: 120,   category: 'food',          date: day(4)  });
    Finance.addExpense({ name: 'وقود السيارة',           amount: 400,   category: 'transport',     date: day(3)  });
    Finance.addExpense({ name: 'اشتراك المترو',          amount: 150,   category: 'transport',     date: day(1)  });
    Finance.addExpense({ name: 'رسوم دراسية',            amount: 1200,  category: 'education',     date: day(5)  });
    Finance.addExpense({ name: 'اشتراك فودافون',         amount: 200,   category: 'internet',      date: day(6)  });
    Finance.addExpense({ name: 'صيدلية',                 amount: 180,   category: 'health',        date: day(9)  });
    Finance.addExpense({ name: 'سينما واتصالات',         amount: 300,   category: 'entertainment', date: day(11) });
    Finance.addExpense({ name: 'ملابس',                  amount: 650,   category: 'shopping',      date: day(13) });
    Finance.addExpense({ name: 'فاتورة كهرباء',         amount: 320,   category: 'bills',         date: day(7)  });
    Finance.addExpense({ name: 'فاتورة غاز',            amount: 90,    category: 'bills',         date: day(7)  });
    Finance.addExpense({ name: 'نت بيتي - WE',          amount: 150,   category: 'internet',      date: day(10) });
    Finance.addExpense({ name: 'أكل بره',               amount: 220,   category: 'food',          date: day(16) });
    Finance.addExpense({ name: 'جراج',                  amount: 100,   category: 'transport',     date: day(18) });

    // ── ديون ──
    Finance.addDebt({
      creditor: 'بنك QNB — قرض شخصي',
      amount: 25000, paid: 8000,
      dueDate: `${y}-${m}-28`,
      notes: 'قسط شهري 2000 ج.م'
    });
    Finance.addDebt({
      creditor: 'أحمد — دين شخصي',
      amount: 3000, paid: 1000,
      dueDate: `${y}-${String(now.getMonth() + 2).padStart(2,'0')}-15`,
      notes: ''
    });

    // ── استثمارات ──
    Finance.addInvestment({ name: 'أسهم CIB',        type: 'stocks',     capital: 15000, profit: 2200,  startDate: `${y-1}-01-15` });
    Finance.addInvestment({ name: 'ذهب 21 عيار',    type: 'gold',       capital: 10000, profit: 3500,  startDate: `${y-1}-06-01` });
    Finance.addInvestment({ name: 'شهادة CIB 3 سنوات', type: 'savings', capital: 20000, profit: 4600,  startDate: `${y-1}-09-01` });

    // ── ميزانية ──
    Finance.setBudget({
      food: 2000, transport: 800, education: 1500,
      entertainment: 500, shopping: 1000,
      health: 400, bills: 600, internet: 400
    });

    console.log('[Demo] بيانات تجريبية أُضيفت بنجاح ✅');
  }
};

/* ════════════════════════════════════════
   إضافات تكميلية — Enhancements
   ════════════════════════════════════════ */

/* ── تحديث FAB ديناميكياً حسب الصفحة ── */
/* ── Center Nav Button — يفتح quick-add modal ── */
(function centerNavBtn() {
  document.addEventListener('DOMContentLoaded', () => {
    // زر المركز في الـ bottom-nav يفتح إضافة مصروف دائماً
    const centerBtn = document.querySelector('.fab-nav-center');
    if (!centerBtn) return;
    centerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.openExpenseModal();
    });
  });
})();

/* ── مراقب حالة الشبكة ── */
(function networkWatcher() {
  function showOffline() {
    if (document.getElementById('offlineBanner')) return;
    const b = document.createElement('div');
    b.id        = 'offlineBanner';
    b.className = 'offline-banner';
    b.textContent = '📴 لا يوجد اتصال بالإنترنت — التطبيق يعمل بشكل كامل';
    document.body.appendChild(b);
  }
  function hideOffline() {
    const b = document.getElementById('offlineBanner');
    if (b) b.remove();
  }
  window.addEventListener('offline', showOffline);
  window.addEventListener('online',  hideOffline);
  if (!navigator.onLine) showOffline();
})();

/* ── أنيميشن أشرطة التقدم عند الظهور ── */
(function animateProgress() {
  const _renderBudget = UI.renderBudget.bind(UI);
  UI.renderBudget = function() {
    _renderBudget();
    setTimeout(() => {
      document.querySelectorAll('.progress-bar').forEach(bar => {
        bar.classList.add('animated');
      });
    }, 100);
  };

  const _renderAnalytics = UI.renderAnalytics.bind(UI);
  UI.renderAnalytics = function() {
    _renderAnalytics();
    setTimeout(() => {
      document.querySelectorAll('.progress-bar').forEach(bar => {
        bar.classList.add('animated');
      });
    }, 100);
  };
})();

/* ── تعريف نظام الـ Swipe للتنقل على الموبايل ── */
(function swipeNav() {
  const pages = ['dashboard','transactions','expenses','analytics','more','income','debts','investments','budget'];
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    // لا تنفذ السحب إذا كانت النافذة المنبثقة مفتوحة
    if (document.querySelector('.modal-overlay.active')) return;

    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    // تأكد أن الحركة أفقية وليست عمودية
    if (Math.abs(dx) < 60 || Math.abs(dy) > 80) return;

    const cur = UI.state.currentPage;
    const idx = pages.indexOf(cur);
    if (idx === -1) return;

    if (dx > 0 && idx > 0) {
      // سحب يميناً = الصفحة السابقة
      UI.navigateTo(pages[idx - 1]);
    } else if (dx < 0 && idx < pages.length - 1) {
      // سحب يساراً = الصفحة التالية
      UI.navigateTo(pages[idx + 1]);
    }
  }, { passive: true });
})();

/* ── دالة مساعدة لتصدير ملخص PDF نصي ── */
UI.printSummary = function() {
  const { filterMonth: m, filterYear: y } = UI.state;
  const s = Finance.getMonthSummary(m, y);
  const now = new Date();
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthName = months[m - 1];

  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير ميزانيتي — ${monthName} ${y}</title>
      <style>
        body { font-family: Cairo, sans-serif; padding: 30px; color: #111; direction: rtl; }
        h1 { color: #0284c7; font-size: 24px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 14px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        th { background: #f0f4f8; font-size: 12px; text-transform: uppercase; }
        .pos { color: #059669; font-weight: 700; }
        .neg { color: #dc2626; font-weight: 700; }
        .num { font-family: monospace; font-size: 15px; font-weight: 700; }
        @media print { button { display: none; } }
      </style>
    </head>
    <body>
      <h1>ملخص ميزانيتي</h1>
      <div class="sub">تقرير شهر ${monthName} ${y} · تاريخ الطباعة: ${now.toLocaleDateString('ar-EG')}</div>
      <table>
        <thead><tr><th>المؤشر</th><th>القيمة</th></tr></thead>
        <tbody>
          <tr><td>إجمالي الدخل</td><td class="num pos">${Finance.formatCurrency(s.income)}</td></tr>
          <tr><td>إجمالي المصروفات</td><td class="num neg">${Finance.formatCurrency(s.expenses)}</td></tr>
          <tr><td>صافي الرصيد</td><td class="num ${s.net >= 0 ? 'pos' : 'neg'}">${Finance.formatCurrency(s.net)}</td></tr>
          <tr><td>إجمالي الديون</td><td class="num neg">${Finance.formatCurrency(s.debts)}</td></tr>
          <tr><td>إجمالي الاستثمارات</td><td class="num pos">${Finance.formatCurrency(s.investments)}</td></tr>
          <tr><td>نسبة الادخار</td><td class="num">${Finance.formatPercent(s.savingRate)}</td></tr>
          <tr><td>نسبة الإنفاق</td><td class="num">${Finance.formatPercent(s.spendRate)}</td></tr>
        </tbody>
      </table>
      <br>
      <button onclick="window.print()" style="padding:10px 20px;background:#0284c7;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-family:Cairo">طباعة</button>
    </body></html>
  `);
  w.document.close();
};

/* ── إضافة زر الطباعة للشريط العلوي ── */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav-actions');
  if (nav) {
    const printBtn = document.createElement('button');
    printBtn.className  = 'nav-btn';
    printBtn.title      = 'طباعة الملخص';
    printBtn.innerHTML = '<svg style="width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24"><use href="#ic-printer"/></svg>';
    printBtn.addEventListener('click', () => UI.printSummary());
    nav.insertBefore(printBtn, nav.firstChild);
  }
});
