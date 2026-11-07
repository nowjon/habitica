import moment from 'moment';
import getUtcOffset from '@/../../common/script/fns/getUtcOffset';
import { shouldDo } from '@/../../common/script/cron';

export const HEADER_STATS_STORAGE_KEY = 'habitica-header-stats';
export const COMPLETED_WINDOW_DAYS = 14;
export const HABIT_BALANCE_DAYS = 7;
export const TOP_HABIT_LIMIT = 5;
export const TOP_STREAK_LIMIT = 4;

// Main cards are on by default. Suggested cards start hidden and can be
// turned on from the edit menu or the suggestions card.
export const STAT_WIDGETS = [
  { id: 'tags', group: 'main', labelKey: 'headerStatsTags' },
  { id: 'topHabits', group: 'main', labelKey: 'headerStatsTopHabits' },
  { id: 'completed', group: 'main', labelKey: 'headerStatsCompleted' },
  {
    id: 'suggestions',
    group: 'main',
    labelKey: 'headerStatsSuggestions',
  },
  {
    id: 'taskMix',
    group: 'suggested',
    labelKey: 'headerStatsTaskMix',
    hintKey: 'headerStatsSuggestTaskMix',
  },
  {
    id: 'streaks',
    group: 'suggested',
    labelKey: 'headerStatsStreaks',
    hintKey: 'headerStatsSuggestStreaks',
  },
  {
    id: 'dueToday',
    group: 'suggested',
    labelKey: 'headerStatsDueToday',
    hintKey: 'headerStatsSuggestDueToday',
  },
  {
    id: 'habitBalance',
    group: 'suggested',
    labelKey: 'headerStatsHabitBalance',
    hintKey: 'headerStatsSuggestHabitBalance',
  },
];

export function defaultVisibility () {
  return STAT_WIDGETS.reduce((visibility, widget) => {
    visibility[widget.id] = widget.group === 'main';
    return visibility;
  }, {});
}

export function loadVisibility () {
  const visibility = defaultVisibility();
  if (typeof localStorage === 'undefined') return visibility;

  try {
    const saved = JSON.parse(localStorage.getItem(HEADER_STATS_STORAGE_KEY) || '{}');
    STAT_WIDGETS.forEach(widget => {
      if (typeof saved[widget.id] === 'boolean') {
        visibility[widget.id] = saved[widget.id];
      }
    });
  } catch (err) {
    return defaultVisibility();
  }

  return visibility;
}

export function saveVisibility (visibility) {
  if (typeof localStorage === 'undefined') return;
  const stored = {};
  STAT_WIDGETS.forEach(widget => {
    stored[widget.id] = Boolean(visibility[widget.id]);
  });
  localStorage.setItem(HEADER_STATS_STORAGE_KEY, JSON.stringify(stored));
}

function safeUser (user) {
  if (user && user.preferences) return user;
  return { preferences: {} };
}

// Bucket a timestamp into the player's Habitica day, honoring custom day start.
export function dayKey (date, user) {
  const current = safeUser(user);
  const dayStart = Number(current.preferences.dayStart) || 0;
  const stamp = moment(date).utcOffset(getUtcOffset(current));
  if (!stamp.isValid()) return null;
  if (stamp.hour() < dayStart) stamp.subtract(1, 'day');
  return stamp.format('YYYY-MM-DD');
}

export function recentDayKeys (user, count, now = new Date()) {
  const end = moment(dayKey(now, user), 'YYYY-MM-DD');
  const keys = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(end.clone().subtract(index, 'days').format('YYYY-MM-DD'));
  }
  return keys;
}

export function sharePercent (count, total) {
  if (!total || !count) return 0;
  return Math.round((count / total) * 100);
}

function listTasks (tasks, completedTodos) {
  const list = [];
  ['habits', 'dailys', 'todos'].forEach(type => {
    (tasks && tasks[type] ? tasks[type] : []).forEach(task => {
      if (task) list.push(task);
    });
  });

  const seen = new Set(list.map(task => task._id));
  (completedTodos || []).forEach(task => {
    if (task && !seen.has(task._id)) {
      seen.add(task._id);
      list.push(task);
    }
  });
  return list;
}

export function tagBreakdown (tasks, tags, completedTodos) {
  const list = listTasks(tasks, completedTodos);
  const total = list.length;
  const known = new Map((tags || []).filter(tag => tag && tag.id).map(tag => [tag.id, tag.name]));
  const counts = new Map();
  let untagged = 0;

  list.forEach(task => {
    const ids = (Array.isArray(task.tags) ? task.tags : []).filter(id => known.has(id));
    if (!ids.length) {
      untagged += 1;
      return;
    }
    ids.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
  });

  const rows = [];
  counts.forEach((count, id) => {
    rows.push({
      id,
      name: known.get(id) || '',
      untagged: false,
      count,
      percent: sharePercent(count, total),
    });
  });
  if (untagged) {
    rows.push({
      id: 'untagged',
      name: '',
      untagged: true,
      count: untagged,
      percent: sharePercent(untagged, total),
    });
  }

  rows.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.untagged !== b.untagged) return a.untagged ? 1 : -1;
    return String(a.name).localeCompare(String(b.name));
  });
  return { total, rows };
}

export function topHabits (tasks, limit = TOP_HABIT_LIMIT) {
  return (tasks && tasks.habits ? tasks.habits : [])
    .filter(habit => habit)
    .map(habit => ({
      id: habit._id,
      text: habit.text || '',
      score: habit.counterUp || 0,
    }))
    .sort((a, b) => b.score - a.score || a.text.localeCompare(b.text))
    .slice(0, limit);
}

export function completedSeries (
  tasks,
  completedTodos,
  user,
  days = COMPLETED_WINDOW_DAYS,
  now = new Date(),
) {
  const keys = recentDayKeys(user, days, now);
  const counts = {};
  keys.forEach(key => { counts[key] = 0; });
  const keySet = new Set(keys);

  function add (date, amount) {
    if (!date || !amount) return;
    const key = dayKey(date, user);
    if (key && keySet.has(key)) counts[key] += amount;
  }

  (tasks && tasks.dailys ? tasks.dailys : []).forEach(task => {
    (task.history || []).forEach(entry => {
      if (entry && entry.completed) add(entry.date, 1);
    });
  });

  (tasks && tasks.habits ? tasks.habits : []).forEach(task => {
    (task.history || []).forEach(entry => {
      if (entry && entry.scoredUp) add(entry.date, entry.scoredUp);
    });
  });

  const seen = new Set();
  const todos = []
    .concat(tasks && tasks.todos ? tasks.todos : [])
    .concat(completedTodos || []);
  todos.forEach(task => {
    if (!task || (task.type && task.type !== 'todo')) return;
    if (!task.completed || !task.dateCompleted || seen.has(task._id)) return;
    seen.add(task._id);
    add(task.dateCompleted, 1);
  });

  const series = keys.map(key => ({ key, count: counts[key] }));
  const total = series.reduce((sum, point) => sum + point.count, 0);
  return { series, total, days };
}

export function taskMix (tasks) {
  const habits = tasks && tasks.habits ? tasks.habits.length : 0;
  const dailys = tasks && tasks.dailys ? tasks.dailys.length : 0;
  const openTodos = (tasks && tasks.todos ? tasks.todos : [])
    .filter(task => task && !task.completed);
  const todos = openTodos.length;
  const total = habits + dailys + todos;
  return {
    total,
    rows: [
      {
        id: 'habits', labelKey: 'habits', count: habits, percent: sharePercent(habits, total),
      },
      {
        id: 'dailies', labelKey: 'dailies', count: dailys, percent: sharePercent(dailys, total),
      },
      {
        id: 'todos', labelKey: 'todos', count: todos, percent: sharePercent(todos, total),
      },
    ],
  };
}

export function topStreaks (tasks, limit = TOP_STREAK_LIMIT) {
  return (tasks && tasks.dailys ? tasks.dailys : [])
    .filter(daily => daily && (daily.streak || 0) > 0)
    .map(daily => ({
      id: daily._id,
      text: daily.text || '',
      streak: daily.streak,
    }))
    .sort((a, b) => b.streak - a.streak || a.text.localeCompare(b.text))
    .slice(0, limit);
}

export function dueToday (tasks, user, now = new Date()) {
  const current = safeUser(user);
  const options = {
    dayStart: current.preferences.dayStart || 0,
    timezoneUtcOffset: getUtcOffset(current),
  };
  const due = (tasks && tasks.dailys ? tasks.dailys : []).filter(daily => {
    if (!daily) return false;
    if (typeof daily.isDue === 'boolean') return daily.isDue;
    return shouldDo(now, daily, options);
  });
  const done = due.filter(daily => daily.completed).length;
  return {
    due: due.length,
    done,
    left: due.length - done,
    percent: sharePercent(done, due.length),
  };
}

export function habitBalance (tasks, user, now = new Date(), days = HABIT_BALANCE_DAYS) {
  const keys = new Set(recentDayKeys(user, days, now));
  let up = 0;
  let down = 0;

  (tasks && tasks.habits ? tasks.habits : []).forEach(habit => {
    (habit.history || []).forEach(entry => {
      if (!entry) return;
      const key = dayKey(entry.date, user);
      if (!key || !keys.has(key)) return;
      up += entry.scoredUp || 0;
      down += entry.scoredDown || 0;
    });
  });

  const total = up + down;
  return {
    up,
    down,
    days,
    upPercent: sharePercent(up, total),
    downPercent: sharePercent(down, total),
  };
}
