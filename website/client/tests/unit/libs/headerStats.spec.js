import {
  describe, test, expect, beforeEach,
} from 'vitest';
import {
  HEADER_STATS_STORAGE_KEY,
  completedSeries,
  dayKey,
  defaultVisibility,
  dueToday,
  habitBalance,
  loadVisibility,
  recentDayKeys,
  saveVisibility,
  tagBreakdown,
  taskMix,
  topHabits,
  topStreaks,
} from '@/libs/headerStats';

const NOON_UTC6 = new Date('2026-11-07T18:00:00.000Z');

function userAt (timezoneOffset = 360, dayStart = 0) {
  return { preferences: { timezoneOffset, dayStart } };
}

describe('header statistics', () => {
  beforeEach(() => {
    localStorage.removeItem(HEADER_STATS_STORAGE_KEY);
  });

  test('buckets timestamps into the player day, including custom day start', () => {
    const user = userAt(360, 4);

    expect(dayKey('2026-11-07T18:00:00.000Z', user)).to.equal('2026-11-07');
    expect(dayKey('2026-11-07T08:30:00.000Z', user)).to.equal('2026-11-06');
    expect(recentDayKeys(user, 3, NOON_UTC6)).to.deep.equal([
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
    ]);
  });

  test('counts tasks by tag with a percentage of all tasks', () => {
    const tasks = {
      habits: [{ _id: 'h1', tags: ['a', 'b'] }],
      dailys: [{ _id: 'd1', tags: ['a'] }],
      todos: [{ _id: 't1', tags: [] }],
      rewards: [{ _id: 'r1', tags: ['a'] }],
    };
    const tags = [
      { id: 'a', name: 'Work' },
      { id: 'b', name: 'Health' },
      { id: 'c', name: 'Unused' },
    ];

    const breakdown = tagBreakdown(tasks, tags, [
      { _id: 't1', tags: [], completed: true },
      { _id: 't2', tags: ['missing'], completed: true },
    ]);

    expect(breakdown.total).to.equal(4);
    expect(breakdown.rows.map(row => [row.id, row.count, row.percent])).to.deep.equal([
      ['a', 2, 50],
      ['untagged', 2, 50],
      ['b', 1, 25],
    ]);
  });

  test('ranks habits by positive scores', () => {
    const tasks = {
      habits: [
        { _id: 'h1', text: 'Stretch', counterUp: 3 },
        { _id: 'h2', text: 'Water', counterUp: 10 },
        { _id: 'h3', text: 'Read', counterUp: 10 },
      ],
    };

    expect(topHabits(tasks, 2).map(habit => habit.text)).to.deep.equal(['Read', 'Water']);
  });

  test('counts completed dailies, habit scores, and to-dos over recent days', () => {
    const user = userAt(360, 4);
    const tasks = {
      habits: [{
        _id: 'h1',
        history: [
          { date: new Date('2026-11-07T18:00:00.000Z').valueOf(), scoredUp: 2, scoredDown: 4 },
          { date: new Date('2026-11-01T18:00:00.000Z').valueOf(), scoredUp: 9 },
        ],
      }],
      dailys: [{
        _id: 'd1',
        history: [
          { date: new Date('2026-11-07T08:30:00.000Z').valueOf(), completed: true },
          { date: new Date('2026-11-07T18:00:00.000Z').valueOf(), completed: false },
        ],
      }],
      todos: [{
        _id: 't1',
        type: 'todo',
        completed: true,
        dateCompleted: '2026-11-07T18:00:00.000Z',
      }],
    };

    const series = completedSeries(tasks, [
      tasks.todos[0],
      {
        _id: 't2',
        type: 'todo',
        completed: true,
        dateCompleted: '2026-11-06T18:00:00.000Z',
      },
    ], user, 3, NOON_UTC6);

    expect(series.series.map(point => point.count)).to.deep.equal([0, 2, 3]);
    expect(series.total).to.equal(5);
  });

  test('splits open tasks by type and ignores completed to-dos', () => {
    const mix = taskMix({
      habits: [{ _id: 'h1' }, { _id: 'h2' }],
      dailys: [{ _id: 'd1' }],
      todos: [{ _id: 't1', completed: false }, { _id: 't2', completed: true }],
    });

    expect(mix.total).to.equal(4);
    expect(mix.rows.map(row => [row.id, row.count, row.percent])).to.deep.equal([
      ['habits', 2, 50],
      ['dailies', 1, 25],
      ['todos', 1, 25],
    ]);
  });

  test('keeps the longest current streaks', () => {
    const streaks = topStreaks({
      dailys: [
        { _id: 'd1', text: 'Short', streak: 2 },
        { _id: 'd2', text: 'Long', streak: 9 },
        { _id: 'd3', text: 'None', streak: 0 },
      ],
    }, 1);

    expect(streaks).to.deep.equal([{ id: 'd2', text: 'Long', streak: 9 }]);
  });

  test('uses isDue when it is set and the schedule otherwise', () => {
    const user = userAt(0, 0);
    const fromFlag = dueToday({
      dailys: [
        { _id: 'd1', isDue: true, completed: true },
        { _id: 'd2', isDue: false, completed: false },
        { _id: 'd3', isDue: true, completed: false },
      ],
    }, user, NOON_UTC6);

    expect(fromFlag).to.deep.equal({
      due: 2, done: 1, left: 1, percent: 50,
    });

    const fromSchedule = dueToday({
      dailys: [{
        _id: 'd4',
        type: 'daily',
        frequency: 'daily',
        everyX: 1,
        startDate: new Date('2020-01-01T00:00:00.000Z'),
        completed: false,
      }],
    }, user, NOON_UTC6);

    expect(fromSchedule.due).to.equal(1);
    expect(fromSchedule.done).to.equal(0);
  });

  test('sums habit directions inside the recent window', () => {
    const user = userAt(360, 0);
    const balance = habitBalance({
      habits: [{
        history: [
          { date: new Date('2026-11-07T18:00:00.000Z').valueOf(), scoredUp: 3, scoredDown: 1 },
          { date: new Date('2026-10-01T18:00:00.000Z').valueOf(), scoredUp: 8, scoredDown: 8 },
        ],
      }],
    }, user, NOON_UTC6, 7);

    expect(balance.up).to.equal(3);
    expect(balance.down).to.equal(1);
    expect(balance.upPercent).to.equal(75);
    expect(balance.downPercent).to.equal(25);
  });

  test('remembers which cards are shown', () => {
    expect(defaultVisibility().tags).to.equal(true);
    expect(defaultVisibility().streaks).to.equal(false);

    saveVisibility({
      ...defaultVisibility(), tags: false, streaks: true, ignored: true,
    });
    const visibility = loadVisibility();

    expect(visibility.tags).to.equal(false);
    expect(visibility.streaks).to.equal(true);
    expect(visibility.topHabits).to.equal(true);
    expect(visibility.ignored).to.equal(undefined);

    localStorage.setItem(HEADER_STATS_STORAGE_KEY, '{');
    expect(loadVisibility().tags).to.equal(true);
  });
});
