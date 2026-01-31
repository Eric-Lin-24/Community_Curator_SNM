// ============================================
// CALENDAR VIEW
// Month grid showing scheduled messages
// ============================================

function ensureCalendarStyles() {
  if (document.getElementById('calendar-view-styles')) return;

  const style = document.createElement('style');
  style.id = 'calendar-view-styles';
  style.textContent = `
    .cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .cal-title {
      font-weight: 600;
      font-size: 16px;
    }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 10px;
    }

    .cal-dow {
      font-size: 12px;
      color: var(--text-muted);
      padding: 0 6px;
      font-weight: 600;
    }

    .cal-cell {
      border: 1px solid var(--border-subtle);
      background: var(--bg-tertiary);
      border-radius: 12px;
      padding: 10px;
      min-height: 96px;
      cursor: pointer;
      transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cal-cell:hover {
      transform: translateY(-1px);
      border-color: var(--border-default);
      background: var(--bg-secondary);
    }

    .cal-cell.is-outside {
      opacity: 0.55;
    }

    .cal-cell.is-today {
      border-color: var(--accent-primary);
      background: var(--accent-primary-soft);
    }

    .cal-daynum {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .cal-badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(0,0,0,0.06);
      color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    .cal-chip {
      display: block;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid var(--border-subtle);
      background: rgba(0,0,0,0.03);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--text-primary);
    }

    .cal-chip.sent {
      opacity: 0.8;
    }

    .cal-chip.pending {
      border-color: rgba(245, 158, 11, 0.35);
      background: rgba(245, 158, 11, 0.10);
    }

    .cal-footer-note {
      margin-top: 14px;
      font-size: 12px;
      color: var(--text-muted);
    }
  `;
  document.head.appendChild(style);
}

function _calStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function _calEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function _calISODateOnly(d) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function _calSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}
function _calAddDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function _calendarGetCurrentMonth() {
  // Store current month as YYYY-MM-01 in AppState
  if (!AppState.calendarMonthISO) {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    AppState.calendarMonthISO = _calISODateOnly(first);
  }
  const [y, m] = AppState.calendarMonthISO.split('-').map(Number);
  return new Date(y, (m - 1), 1);
}

function _calendarSetMonth(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  AppState.calendarMonthISO = _calISODateOnly(first);
}

function _calendarGetMessagesByDay() {
  const map = new Map();
  const msgs = AppState.scheduledMessages || [];

  msgs.forEach(m => {
    const ts = m.scheduled_time || m.scheduled_timestamp;
    if (!ts) return;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return;

    const key = _calISODateOnly(d);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  });

  // Sort each day by time
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => {
      const ta = Date.parse(a.scheduled_time || a.scheduled_timestamp || 0) || 0;
      const tb = Date.parse(b.scheduled_time || b.scheduled_timestamp || 0) || 0;
      return ta - tb;
    });
    map.set(k, arr);
  }

  return map;
}

function calendarGoPrevMonth() {
  const cur = _calendarGetCurrentMonth();
  _calendarSetMonth(new Date(cur.getFullYear(), cur.getMonth() - 1, 1));
  renderCalendar();
}

function calendarGoNextMonth() {
  const cur = _calendarGetCurrentMonth();
  _calendarSetMonth(new Date(cur.getFullYear(), cur.getMonth() + 1, 1));
  renderCalendar();
}

function calendarGoToday() {
  const now = new Date();
  _calendarSetMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  renderCalendar();
}

function openScheduleMessageForDate(dateISO /* YYYY-MM-DD */) {
  // Prefill scheduleMessage datetime-local as YYYY-MM-DDTHH:MM
  // Choose 09:00 by default
  AppState.composePrefillDateTimeLocal = `${dateISO}T09:00`;
  navigateTo('scheduleMessage');
}

function renderCalendar() {
  ensureCalendarStyles();

  const content = document.getElementById('content');
  if (!content) return;

  const month = _calendarGetCurrentMonth();
  const monthStart = _calStartOfMonth(month);
  const monthEnd = _calEndOfMonth(month);

  const now = new Date();

  // Monday-start calendar
  // JS getDay(): Sun=0..Sat=6  -> Monday index: (day+6)%7  where Monday=0
  const startDow = (monthStart.getDay() + 6) % 7;
  const gridStart = _calAddDays(monthStart, -startDow);

  // 6-week grid (42 cells)
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(_calAddDays(gridStart, i));
  }

  const byDay = _calendarGetMessagesByDay();

  const monthLabel = month.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const dow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  content.innerHTML = `
    <div class="animate-slide-up">
      <div class="card">
        <div class="cal-header">
          <div class="flex items-center gap-2">
            <button class="btn btn-ghost btn-sm" onclick="calendarGoPrevMonth()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Prev
            </button>

            <button class="btn btn-ghost btn-sm" onclick="calendarGoToday()">Today</button>

            <button class="btn btn-ghost btn-sm" onclick="calendarGoNextMonth()">
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>

          <div class="cal-title">${monthLabel}</div>

          <div class="flex items-center gap-2">
            <button class="btn btn-primary btn-sm" onclick="navigateTo('scheduleMessage')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Message
            </button>
          </div>
        </div>

        <div class="cal-grid" style="margin-bottom: 10px;">
          ${dow.map(d => `<div class="cal-dow">${d}</div>`).join('')}
        </div>

        <div class="cal-grid">
          ${days.map(d => {
            const dateISO = _calISODateOnly(d);
            const isOutside = d.getMonth() !== month.getMonth();
            const isToday = _calSameDay(d, now);

            const msgs = byDay.get(dateISO) || [];
            const count = msgs.length;

            const preview = msgs.slice(0, 2).map(m => {
              const status = (m.status === 'sent') ? 'sent' : 'pending';
              const txt = (m.message_content || m.message || '').trim();
              return `<span class="cal-chip ${status}" title="${txt.replace(/"/g, '&quot;')}">${txt || '(no text)'}</span>`;
            }).join('');

            const more = (count > 2) ? `<span class="cal-chip" style="opacity:0.75;">+${count - 2} more</span>` : '';

            return `
              <div
                class="cal-cell ${isOutside ? 'is-outside' : ''} ${isToday ? 'is-today' : ''}"
                onclick="openScheduleMessageForDate('${dateISO}')"
                title="Click to compose a message for ${dateISO}"
              >
                <div class="cal-daynum">
                  <span>${d.getDate()}</span>
                  ${count > 0 ? `<span class="cal-badge">${count}</span>` : ``}
                </div>

                ${count > 0 ? `<div class="flex flex-col gap-2">${preview}${more}</div>` : `
                  <div class="text-xs text-muted" style="margin-top: 6px;">No messages</div>
                `}
              </div>
            `;
          }).join('')}
        </div>

        <div class="cal-footer-note">
          Click any day to open the full composer with that date pre-filled.
        </div>
      </div>
    </div>
  `;
}

// Export to global scope
if (typeof window !== 'undefined') {
  window.renderCalendar = renderCalendar;
  window.calendarGoPrevMonth = calendarGoPrevMonth;
  window.calendarGoNextMonth = calendarGoNextMonth;
  window.calendarGoToday = calendarGoToday;
  window.openScheduleMessageForDate = openScheduleMessageForDate;
}
