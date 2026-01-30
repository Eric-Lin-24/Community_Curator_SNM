// ============================================
// DASHBOARD VIEW
//  - 3 metrics (sent last 30d, pending, next message)
//  - Month calendar view of scheduled messages
// ============================================

function _dashSafe(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _dashPad2(n) {
  return String(n).padStart(2, '0');
}

function _dashStartOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function _dashEndOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function _dashLocalDateKey(dateObj) {
  // YYYY-MM-DD in LOCAL time
  const y = dateObj.getFullYear();
  const m = _dashPad2(dateObj.getMonth() + 1);
  const d = _dashPad2(dateObj.getDate());
  return `${y}-${m}-${d}`;
}

function _dashGetCalendarMonth() {
  // Persist month selection in AppState so navigation doesn't reset it.
  const now = new Date();
  if (!AppState.dashboardCalendar) AppState.dashboardCalendar = { year: null, month: null };
  if (typeof AppState.dashboardCalendar.year !== 'number' || typeof AppState.dashboardCalendar.month !== 'number') {
    AppState.dashboardCalendar.year = now.getFullYear();
    AppState.dashboardCalendar.month = now.getMonth();
  }
  return { year: AppState.dashboardCalendar.year, month: AppState.dashboardCalendar.month };
}

function _dashSetCalendarMonth(year, month /* 0-11 */) {
  const d = new Date(year, month, 1);
  AppState.dashboardCalendar.year = d.getFullYear();
  AppState.dashboardCalendar.month = d.getMonth();
  renderDashboard();
}

function _dashMoveCalendarMonth(delta) {
  const { year, month } = _dashGetCalendarMonth();
  const d = new Date(year, month + delta, 1);
  _dashSetCalendarMonth(d.getFullYear(), d.getMonth());
}

function _dashGetSentLast30Days(messages) {
  const now = Date.now();
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  return (messages || []).filter(m => {
    if (!m) return false;
    if (m.status !== 'sent') return false;
    if (!m.scheduled_time) return false;
    const t = new Date(m.scheduled_time).getTime();
    return Number.isFinite(t) && t >= cutoff && t <= now;
  }).length;
}

function _dashGetPending(messages) {
  return (messages || []).filter(m => m && m.status !== 'sent').length;
}

function _dashGetNextPending(messages) {
  const now = Date.now();
  const pendingFuture = (messages || [])
    .filter(m => m && m.status !== 'sent' && m.scheduled_time)
    .map(m => ({ m, t: new Date(m.scheduled_time).getTime() }))
    .filter(x => Number.isFinite(x.t) && x.t >= now)
    .sort((a, b) => a.t - b.t);
  return pendingFuture[0]?.m || null;
}

function _dashStatCard({ title, value, meta, tone = 'teal', icon }) {
  return `
    <div class="card stat-card">
      <div class="stat-icon ${tone}">
        ${icon}
      </div>
      <div class="stat-value">${_dashSafe(value)}</div>
      <div class="stat-label">${_dashSafe(title)}</div>
      <div class="text-xs text-muted">${_dashSafe(meta || '')}</div>
    </div>
  `;
}

function _dashCalendarStylesOnce() {
  if (document.getElementById('cc-dashboard-calendar-styles')) return;
  const style = document.createElement('style');
  style.id = 'cc-dashboard-calendar-styles';
  style.textContent = `
    .cc-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
    .cc-cal-dow { font-size: 12px; color: var(--text-muted); text-align: center; padding: 6px 0; }
    .cc-cal-cell { min-height: 120px; border: 1px solid var(--border-subtle); background: var(--bg-secondary); border-radius: 14px; padding: 10px; cursor: pointer; transition: transform .08s ease, border-color .08s ease; }
    .cc-cal-cell:hover { transform: translateY(-1px); border-color: var(--accent-primary); }
    .cc-cal-cell.is-other-month { opacity: 0.5; }
    .cc-cal-cell.is-today { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-primary-soft); }
    .cc-cal-daynum { font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: space-between; }
    .cc-cal-count { font-size: 11px; color: var(--text-muted); }
    .cc-cal-items { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
    .cc-cal-item { display: flex; gap: 8px; align-items: flex-start; }
    .cc-cal-time { font-size: 11px; color: var(--text-muted); min-width: 42px; }
    .cc-cal-pill { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border-subtle); background: var(--bg-tertiary); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cc-cal-pill.pending { border-color: var(--warning); }
    .cc-cal-pill.sent { border-color: var(--success); }
    .cc-cal-more { font-size: 11px; color: var(--text-muted); }
  `;
  document.head.appendChild(style);
}

function _dashBuildMonthCells(year, month, messagesByDayKey) {
  // Calendar grid: weeks start Sunday
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startDow);

  const cells = [];
  for (let i = 0; i < 42; i++) { // 6 weeks
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = _dashLocalDateKey(d);
    const items = messagesByDayKey.get(key) || [];
    const isOtherMonth = d.getMonth() !== month;

    const todayKey = _dashLocalDateKey(new Date());
    const isToday = key === todayKey;

    const topItems = items.slice(0, 3);
    const more = items.length - topItems.length;

    const itemsHtml = topItems.map(msg => {
      const dt = new Date(msg.scheduled_time);
      const time = `${_dashPad2(dt.getHours())}:${_dashPad2(dt.getMinutes())}`;
      const statusClass = msg.status === 'sent' ? 'sent' : 'pending';
      const who = msg.recipient || (msg.target_user_id ? (typeof getRecipientName === 'function' ? getRecipientName(msg.target_user_id) : msg.target_user_id) : '');
      const preview = msg.message_content ? String(msg.message_content) : '';
      const label = who ? `${who}: ${preview}` : preview;

      return `
        <div class="cc-cal-item">
          <div class="cc-cal-time">${_dashSafe(time)}</div>
          <div class="cc-cal-pill ${statusClass}" title="${_dashSafe(label)}">${_dashSafe(label)}</div>
        </div>
      `;
    }).join('');

    const countHtml = items.length ? `<span class="cc-cal-count">${items.length} msg</span>` : `<span class="cc-cal-count"></span>`;

    cells.push(`
      <div
        class="cc-cal-cell ${isOtherMonth ? 'is-other-month' : ''} ${isToday ? 'is-today' : ''}"
        onclick="dashboardOpenScheduleForDay('${key}')"
        title="Schedule a message for ${_dashSafe(key)}"
      >
        <div class="cc-cal-daynum">
          <span>${d.getDate()}</span>
          ${countHtml}
        </div>
        <div class="cc-cal-items">
          ${itemsHtml}
          ${more > 0 ? `<div class="cc-cal-more">+${more} more</div>` : ''}
        </div>
      </div>
    `);
  }
  return cells.join('');
}

function dashboardOpenScheduleForDay(localDateKey /* YYYY-MM-DD */) {
  // Prefill schedule message page with this day at 09:00 local time.
  const [y, m, d] = String(localDateKey).split('-').map(x => parseInt(x, 10));
  if (!y || !m || !d) return;

  const local = new Date(y, (m - 1), d, 9, 0, 0, 0);
  AppState.scheduleMessagePrefillISO = local.toISOString();
  navigateTo('scheduleMessage');
}

function renderDashboard() {
  _dashCalendarStylesOnce();
  const content = document.getElementById('content');

  const messages = AppState.scheduledMessages || [];
  const sent30 = _dashGetSentLast30Days(messages);
  const pendingCount = _dashGetPending(messages);
  const nextPending = _dashGetNextPending(messages);

  const nextMeta = nextPending
    ? `${new Date(nextPending.scheduled_time).toLocaleString()}`
    : 'No upcoming scheduled messages';

  // Build calendar data for selected month
  const { year, month } = _dashGetCalendarMonth();
  const monthStart = _dashStartOfDay(new Date(year, month, 1));
  const monthEnd = _dashEndOfDay(new Date(year, month + 1, 0));

  const messagesThisMonth = messages
    .filter(m => m && m.scheduled_time)
    .map(m => ({ m, t: new Date(m.scheduled_time).getTime() }))
    .filter(x => Number.isFinite(x.t))
    .filter(x => x.t >= monthStart.getTime() && x.t <= monthEnd.getTime())
    .map(x => x.m)
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  const byDay = new Map();
  for (const m of messagesThisMonth) {
    const k = _dashLocalDateKey(new Date(m.scheduled_time));
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(m);
  }

  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const calendarCells = _dashBuildMonthCells(year, month, byDay);

  content.innerHTML = `
    <div class="animate-in">
      <div class="grid grid-cols-3 gap-6 mb-6">
        ${_dashStatCard({
          tone: 'teal',
          title: 'Messages Sent (30d)',
          value: String(sent30),
          meta: 'Delivered in the last 30 days',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M20 6L9 17l-5-5"/>
                 </svg>`
        })}
        ${_dashStatCard({
          tone: pendingCount > 0 ? 'blue' : 'teal',
          title: 'Messages Pending',
          value: String(pendingCount),
          meta: pendingCount ? 'Queued to send' : 'No pending messages',
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                 </svg>`
        })}
        ${_dashStatCard({
          tone: nextPending ? 'purple' : 'blue',
          title: 'Next Message',
          value: nextPending ? (nextPending.recipient || (nextPending.target_user_id ? (typeof getRecipientName === 'function' ? getRecipientName(nextPending.target_user_id) : nextPending.target_user_id) : 'Scheduled')) : '—',
          meta: nextMeta,
          icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <circle cx="12" cy="12" r="10"/>
                   <path d="M12 6v6l4 2"/>
                 </svg>`
        })}
      </div>

      <div class="card">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-semibold">Scheduled Messages Calendar</h3>
            <p class="text-xs text-muted">Click a day to open the full editor with that date prefilled</p>
          </div>
          <div class="flex gap-2 items-center">
            <button class="btn btn-secondary btn-sm" onclick="_dashMoveCalendarMonth(-1)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              Prev
            </button>
            <div class="text-sm" style="min-width: 160px; text-align:center;">${_dashSafe(monthLabel)}</div>
            <button class="btn btn-secondary btn-sm" onclick="_dashMoveCalendarMonth(1)">
              Next
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" onclick="_dashSetCalendarMonth(new Date().getFullYear(), new Date().getMonth())">Today</button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="cc-cal-grid" style="margin-bottom: 10px;">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cc-cal-dow">${d}</div>`).join('')}
        </div>
        <div class="cc-cal-grid">
          ${calendarCells}
        </div>
      </div>
    </div>
  `;
}

// Export + global handlers used by inline onclick
if (typeof window !== 'undefined') {
  window.renderDashboard = renderDashboard;
  window.dashboardOpenScheduleForDay = dashboardOpenScheduleForDay;
  window._dashMoveCalendarMonth = _dashMoveCalendarMonth;
  window._dashSetCalendarMonth = _dashSetCalendarMonth;
}
