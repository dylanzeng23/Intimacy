const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}, ${y}`;
}

export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString() { return toDateString(new Date()); }

export function nowTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getMonthName(month) { return MONTH_NAMES[month]; }
export function getDayNames() { return DAY_NAMES; }
export function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
export function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

export function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function getTimeOfDay(timeStr) {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour < 6) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

// Sex types
export const SEX_TYPE_COLORS = {
  partner: '#f08aaa',
  solo: '#b8a0f0',
  other: '#60d0a0',
};

// Drink types
export const DRINK_TYPE_COLORS = {
  beer: '#e0a030',
  wine: '#c05070',
  spirits: '#d08840',
  cocktail: '#60b0d0',
};

// Combined — used for dot colors
export const TYPE_COLORS = { ...SEX_TYPE_COLORS, ...DRINK_TYPE_COLORS };

// Category colors for calendar fills
export const CATEGORY_COLORS = {
  sex: '#b8a0f0',
  drink: '#e0a030',
};

export const MOOD_EMOJIS = ['', '😐', '🙂', '😊', '😄', '🤩'];
