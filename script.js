const state = {
  user: null,
  transactions: [],
  settings: { name: 'کاربر', currency: 'تومان', theme: 'light' }
};

const USERS = [
  { name: 'مدیر مالی‌یار', email: 'admin@malyar.ir', password: '123456' },
  { name: 'کاربر مهمان', email: 'guest@malyar.ir', password: 'guest123' }
];

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function toPersian(num) { return num.toLocaleString('fa-IR'); }
function formatMoney(amount) { return toPersian(amount) + ' ' + state.settings.currency; }

function showToast(msg, type = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast ' + type, 2500);
}

$$('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.auth-form').forEach(f => f.classList.remove('active'));
    $(tab.dataset.tab === 'login' ? '#loginForm' : '#signupForm').classList.add('active');
  });
});

$$('[data-switch]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = a.dataset.switch;
    $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    $$('.auth-form').forEach(f => f.classList.remove('active'));
    $(target === 'login' ? '#loginForm' : '#signupForm').classList.add('active');
  });
});

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const pass = $('#loginPass').value;
  if (pass.length < 6) return showToast('رمز عبور حداقل ۶ کاراکتر باشد', 'error');
  const foundUser = USERS.find(u => u.email.toLowerCase() === email && u.password === pass);
  if (!foundUser) return showToast('❌ ایمیل یا رمز عبور اشتباه است', 'error');
  state.user = { name: foundUser.name, email: foundUser.email };
  state.settings.name = foundUser.name;
  showToast(`خوش آمدید ${foundUser.name}! 🎉`, 'success');
  enterApp();
});

$('#signupForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#signupName').value.trim();
  const email = $('#signupEmail').value.trim().toLowerCase();
  const pass = $('#signupPass').value;
  if (pass.length < 6) return showToast('رمز عبور حداقل ۶ کاراکتر باشد', 'error');
  if (USERS.some(u => u.email.toLowerCase() === email)) return showToast('❌ این ایمیل قبلاً ثبت شده است', 'error');
  USERS.push({ name, email, password: pass });
  state.user = { name, email };
  state.settings.name = name;
  showToast('حساب شما ساخته شد ✅', 'success');
  enterApp();
});

function enterApp() {
  $('#authPage').classList.remove('active');
  $('#appPage').classList.add('active');
  $('#userGreet').textContent = `سلام، ${state.user.name}`;
  $('#settingName').value = state.settings.name;
  updateAll();
  renderFullTxList();
}

$('#logoutBtn').addEventListener('click', () => {
  state.user = null;
  $('#appPage').classList.remove('active');
  $('#authPage').classList.add('active');
  $('#loginForm').reset();
  $('#signupForm').reset();
  showToast('از حساب خارج شدید');
});

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pageId = btn.dataset.page;
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.sub-page').forEach(p => p.classList.remove('active'));
    $('#' + pageId).classList.add('active');
    if (pageId === 'dashboard') updateAll();
    if (pageId === 'transactions') renderFullTxList();
  });
});

const today = new Date().toISOString().split('T')[0];
$('#txDate').value = today;

$('#txForm').addEventListener('submit', e => {
  e.preventDefault();
  const type = $('#txType').value;
  const amount = Number($('#txAmount').value);
  const category = $('#txCategory').value;
  const date = $('#txDate').value;
  const note = $('#txNote').value.trim();
  if (amount <= 0) return showToast('مبلغ نامعتبر است', 'error');
  state.transactions.unshift({ id: Date.now(), type, amount, category, date, note });
  e.target.reset();
  $('#txDate').value = today;
  showToast('تراکنش ثبت شد ✅', 'success');
  updateAll();
  renderFullTxList();
});

function renderFullTxList() {
  const search = ($('#txSearch').value || '').toLowerCase();
  const filter = $('#txFilter').value;
  let list = state.transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search) {
      const hay = (tx.category + ' ' + tx.note).toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
  const container = $('#txListFull');
  if (!list.length) {
    container.innerHTML = '<p class="empty-msg">هیچ تراکنشی یافت نشد</p>';
    return;
  }
  container.innerHTML = list.map(tx => txHTML(tx, true)).join('');
  container.querySelectorAll('.tx-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      state.transactions = state.transactions.filter(t => t.id !== id);
      showToast('تراکنش حذف شد', 'error');
      updateAll();
      renderFullTxList();
    });
  });
}

function txHTML(tx, withDelete = false) {
  const sign = tx.type === 'income' ? '+' : '−';
  const cls = tx.type === 'income' ? 'income' : 'expense';
  const icon = tx.category.split(' ')[0] || '📦';
  const catName = tx.category.replace(/^\S+\s/, '');
  const dateFmt = new Date(tx.date).toLocaleDateString('fa-IR');
  return `
    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-icon">${icon}</div>
        <div class="tx-details">
          <span class="tx-cat">${catName}</span>
          <span class="tx-note">${tx.note || dateFmt}</span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${cls}">${sign} ${formatMoney(tx.amount)}</span>
        ${withDelete ? `<button class="tx-del" data-id="${tx.id}" title="حذف">🗑</button>` : ''}
      </div>
    </div>
  `;
}

$('#txSearch').addEventListener('input', renderFullTxList);
$('#txFilter').addEventListener('change', renderFullTxList);

function updateAll() {
  const income = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  $('#statBalance').textContent = formatMoney(balance);
  $('#statIncome').textContent = formatMoney(income);
  $('#statExpense').textContent = formatMoney(expense);
  $('#statSavings').textContent = formatMoney(Math.max(balance, 0));

  const recent = state.transactions.slice(0, 5);
  const recentBox = $('#recentList');
  recentBox.innerHTML = recent.length
    ? recent.map(tx => txHTML(tx)).join('')
    : '<p class="empty-msg">هنوز تراکنشی ثبت نشده است</p>';

  const expenses = state.transactions.filter(t => t.type === 'expense');
  const byCat = {};
  expenses.forEach(t => {
    const name = t.category.replace(/^\S+\s/, '');
    const icon = t.category.split(' ')[0];
    byCat[name] = byCat[name] || { total: 0, icon };
    byCat[name].total += t.amount;
  });
  const chartBox = $('#categoryChart');
  const entries = Object.entries(byCat).sort((a, b) => b[1].total - a[1].total);
  if (!entries.length) {
    chartBox.innerHTML = '<p class="empty-msg">هنوز هزینه‌ای ثبت نشده است</p>';
  } else {
    const max = entries[0][1].total;
    chartBox.innerHTML = entries.map(([name, data]) => `
      <div class="cat-row">
        <div class="cat-info">
          <span class="cat-name">${data.icon} ${name}</span>
          <span class="cat-amount">${formatMoney(data.total)}</span>
        </div>
        <div class="cat-bar-bg">
          <div class="cat-bar-fill" style="width:${(data.total / max) * 100}%"></div>
        </div>
      </div>
    `).join('');
  }
}

$$('.faq-q').forEach(q => {
  q.addEventListener('click', () => q.parentElement.classList.toggle('open'));
});

$('#supportForm').addEventListener('submit', e => {
  e.preventDefault();
  showToast('پیام شما ارسال شد. به‌زودی پاسخ می‌دهیم 🙏', 'success');
  e.target.reset();
});

$('#saveSettings').addEventListener('click', () => {
  const name = $('#settingName').value.trim() || 'کاربر';
  const currency = $('#settingCurrency').value;
  const theme = $('#settingTheme').value;
  state.settings = { name, currency, theme };
  if (state.user) state.user.name = name;
  $('#userGreet').textContent = `سلام، ${name}`;
  document.body.classList.toggle('dark', theme === 'dark');
  updateAll();
  renderFullTxList();
  showToast('تنظیمات ذخیره شد ✅', 'success');
});