<template>
  <div
    class="task-statistics"
    role="region"
    :aria-label="$t('headerStatsRegion')"
  >
    <div class="task-statistics-inner">
      <div
        class="stats-scroll"
        tabindex="0"
      >
        <p
          v-if="tasksFailed && !tasks"
          class="stats-note"
        >
          {{ $t('headerStatsLoadError') }}
        </p>
        <p
          v-else-if="!tasks"
          class="stats-note"
        >
          {{ $t('loading') }}
        </p>
        <template v-else>
          <p
            v-if="!visibleWidgets.length"
            class="stats-note"
          >
            {{ $t('headerStatsAllHidden') }}
          </p>
          <article
            v-for="widget in visibleWidgets"
            :key="widget.id"
            class="stat-card"
            :class="'is-' + widget.id"
          >
            <h3 class="stat-title">
              {{ $t(widget.labelKey) }}
            </h3>
            <p
              v-if="cardMeta(widget.id)"
              class="stat-meta"
            >
              {{ cardMeta(widget.id) }}
            </p>
            <div class="stat-body">
              <template v-if="widget.id === 'tags'">
                <p
                  v-if="!tagStats.total"
                  class="empty-copy"
                >
                  {{ $t('headerStatsEmptyTags') }}
                </p>
                <div
                  v-for="row in tagStats.rows"
                  :key="row.id"
                  class="metric-row"
                  :title="rowLabel(row)"
                >
                  <div
                    class="metric-bar"
                    :style="{ width: barWidth(row.count, tagStats.rows) }"
                  ></div>
                  <span class="metric-name">{{ rowLabel(row) }}</span>
                  <span class="metric-count">{{ row.count }}</span>
                  <span class="metric-percent">{{ row.percent }}%</span>
                </div>
              </template>

              <template v-else-if="widget.id === 'topHabits'">
                <p
                  v-if="!habitStats.length"
                  class="empty-copy"
                >
                  {{ $t('headerStatsEmptyHabits') }}
                </p>
                <div
                  v-for="(habit, index) in habitStats"
                  :key="habit.id"
                  class="rank-row"
                  :title="habit.text"
                >
                  <span class="rank">{{ index + 1 }}</span>
                  <span class="metric-name">{{ habit.text }}</span>
                  <span class="metric-count">{{ habit.score }}</span>
                </div>
              </template>

              <template v-else-if="widget.id === 'completed'">
                <div class="hero-number">
                  {{ completedStats.total }}
                </div>
                <div class="hero-caption">
                  {{ $t('headerStatsLastDays', { count: completedStats.days }) }}
                </div>
                <div class="hero-caption">
                  {{ $t('headerStatsCompletedCaption') }}
                </div>
                <div
                  class="chart"
                  role="img"
                  :aria-label="completedSummary"
                >
                  <div
                    v-for="point in completedStats.series"
                    :key="point.key"
                    class="chart-col"
                    :title="pointTitle(point)"
                  >
                    <div
                      class="chart-bar"
                      :class="{
                        today: point.key === todayKey,
                        empty: !point.count,
                      }"
                      :style="{ height: barHeight(point.count) }"
                    ></div>
                  </div>
                </div>
                <div
                  v-if="completedStats.series.length"
                  class="chart-labels"
                >
                  <span>{{ formatDay(completedStats.series[0].key) }}</span>
                  <span>{{ $t('today') }}</span>
                </div>
              </template>

              <template v-else-if="widget.id === 'suggestions'">
                <p
                  v-if="!hiddenSuggestions.length"
                  class="empty-copy"
                >
                  {{ $t('headerStatsAllSuggestionsOn') }}
                </p>
                <div
                  v-for="suggestion in hiddenSuggestions"
                  :key="suggestion.id"
                  class="suggest-row"
                >
                  <div class="suggest-head">
                    <div class="suggest-title">
                      {{ $t(suggestion.labelKey) }}
                    </div>
                    <button
                      type="button"
                      class="show-button"
                      @click="showWidget(suggestion.id)"
                    >
                      {{ $t('headerStatsShow') }}
                    </button>
                  </div>
                  <div class="suggest-hint">
                    {{ $t(suggestion.hintKey) }}
                  </div>
                </div>
              </template>

              <template v-else-if="widget.id === 'taskMix'">
                <div
                  v-for="row in mixStats.rows"
                  :key="row.id"
                  class="metric-row"
                  :class="'tone-' + row.id"
                >
                  <div
                    class="metric-bar"
                    :style="{ width: barWidth(row.count, mixStats.rows) }"
                  ></div>
                  <span class="metric-name">{{ $t(row.labelKey) }}</span>
                  <span class="metric-count">{{ row.count }}</span>
                  <span class="metric-percent">{{ row.percent }}%</span>
                </div>
              </template>

              <template v-else-if="widget.id === 'streaks'">
                <p
                  v-if="!streakStats.length"
                  class="empty-copy"
                >
                  {{ $t('headerStatsEmptyStreaks') }}
                </p>
                <div
                  v-for="streak in streakStats"
                  :key="streak.id"
                  class="rank-row"
                  :title="streak.text"
                >
                  <span class="metric-name">{{ streak.text }}</span>
                  <span class="metric-count">{{ streakLabel(streak.streak) }}</span>
                </div>
              </template>

              <template v-else-if="widget.id === 'dueToday'">
                <p
                  v-if="!dueStats.due"
                  class="empty-copy"
                >
                  {{ $t('headerStatsEmptyDue') }}
                </p>
                <template v-else>
                  <div class="hero-number">
                    {{ dueStats.percent }}%
                  </div>
                  <div class="hero-caption">
                    {{ dueSummary }}
                  </div>
                  <div
                    class="due-track"
                    role="img"
                    :aria-label="dueSummary"
                  >
                    <div
                      class="due-fill"
                      :style="{ width: dueStats.percent + '%' }"
                    ></div>
                  </div>
                </template>
              </template>

              <template v-else-if="widget.id === 'habitBalance'">
                <div class="balance-row">
                  <span class="metric-name">{{ $t('positive') }}</span>
                  <span class="metric-count">{{ balanceStats.up }}</span>
                  <span class="metric-percent">{{ balanceStats.upPercent }}%</span>
                </div>
                <div class="balance-track tone-up">
                  <div
                    class="balance-fill"
                    :style="{ width: balanceWidth(balanceStats.up) }"
                  ></div>
                </div>
                <div class="balance-row">
                  <span class="metric-name">{{ $t('negative') }}</span>
                  <span class="metric-count">{{ balanceStats.down }}</span>
                  <span class="metric-percent">{{ balanceStats.downPercent }}%</span>
                </div>
                <div class="balance-track tone-down">
                  <div
                    class="balance-fill"
                    :style="{ width: balanceWidth(balanceStats.down) }"
                  ></div>
                </div>
              </template>
            </div>
          </article>
        </template>
      </div>

      <div
        ref="editRoot"
        class="edit-wrap"
      >
        <button
          type="button"
          class="edit-button"
          :aria-expanded="menuOpen ? 'true' : 'false'"
          aria-haspopup="true"
          aria-controls="header-stats-edit-menu"
          :aria-label="$t('headerStatsEditLabel')"
          @click="menuOpen = !menuOpen"
        >
          <span
            class="svg-icon color icon-16 edit-icon"
            v-html="icons.edit"
          ></span>
          <span>{{ $t('edit') }}</span>
        </button>
        <div
          v-if="menuOpen"
          id="header-stats-edit-menu"
          class="edit-menu"
          role="menu"
        >
          <div class="edit-menu-heading">
            <span>{{ $t('headerStatsRegion') }}</span>
            <span class="edit-count">
              {{ shownCount }}
            </span>
          </div>
          <button
            v-for="widget in mainWidgets"
            :key="widget.id"
            type="button"
            class="edit-row"
            role="menuitemcheckbox"
            :aria-checked="visibility[widget.id] ? 'true' : 'false'"
            @click="toggleWidget(widget.id)"
          >
            <span
              class="check"
              :class="{ on: visibility[widget.id] }"
              aria-hidden="true"
            ></span>
            <span>{{ $t(widget.labelKey) }}</span>
          </button>
          <div class="edit-group">
            {{ $t('headerStatsSuggested') }}
          </div>
          <button
            v-for="widget in suggestedWidgets"
            :key="widget.id"
            type="button"
            class="edit-row"
            role="menuitemcheckbox"
            :aria-checked="visibility[widget.id] ? 'true' : 'false'"
            @click="toggleWidget(widget.id)"
          >
            <span
              class="check"
              :class="{ on: visibility[widget.id] }"
              aria-hidden="true"
            ></span>
            <span>{{ $t(widget.labelKey) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';

  .task-statistics {
    flex: 1 1 auto;
    min-width: 0;
    align-items: center;
    margin-right: 16px;
  }

  .task-statistics-inner {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .stats-scroll {
    display: flex;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    padding: 2px 2px 4px 0;
    scrollbar-width: thin;
    scrollbar-color: rgba($header-color, 0.45) transparent;
  }

  .stats-note,
  .empty-copy {
    margin: 0;
    color: $header-color;
    font-size: 13px;
    line-height: 1.35;
  }

  .stats-note {
    align-self: center;
  }

  .stat-card {
    flex: 0 0 232px;
    width: 232px;
    height: 204px;
    display: flex;
    flex-direction: column;
    padding: 10px 12px 8px;
    border-radius: 8px;
    border: 1px solid rgba($header-color, 0.28);
    border-left-width: 3px;
    background: rgba($header-dark-background, 0.72);
    color: $white;
    text-align: left;
  }

  .is-tags { border-left-color: $purple-400; }
  .is-topHabits { border-left-color: $yellow-50; }
  .is-completed { border-left-color: $green-100; }
  .is-suggestions { border-left-color: $blue-100; }
  .is-taskMix { border-left-color: $teal-100; }
  .is-streaks { border-left-color: $orange-100; }
  .is-dueToday { border-left-color: $green-50; }
  .is-habitBalance { border-left-color: $maroon-100; }

  .stat-title {
    margin: 0;
    color: $white;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.2;
  }

  .stat-meta,
  .hero-caption,
  .suggest-hint,
  .chart-labels {
    margin: 2px 0 0;
    color: $header-color;
    font-size: 11px;
    line-height: 1.3;
  }

  .stat-body {
    margin-top: 6px;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    scrollbar-width: thin;
  }

  .metric-row,
  .rank-row,
  .balance-row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 22px;
    margin-top: 3px;
    padding: 1px 4px;
    border-radius: 4px;
    overflow: hidden;
  }

  .metric-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: rgba($purple-500, 0.38);
    border-radius: 4px;
  }

  .tone-habits .metric-bar { background: rgba($yellow-50, 0.45); }
  .tone-dailies .metric-bar { background: rgba($green-100, 0.4); }
  .tone-todos .metric-bar { background: rgba($blue-100, 0.45); }

  .metric-name,
  .metric-count,
  .metric-percent,
  .rank {
    position: relative;
    z-index: 1;
  }

  .metric-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }

  .metric-count,
  .metric-percent,
  .rank,
  .hero-number {
    font-variant-numeric: tabular-nums;
  }

  .metric-count,
  .metric-percent {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
  }

  .metric-percent {
    width: 36px;
    text-align: right;
    color: $header-color;
  }

  .rank {
    flex: 0 0 auto;
    width: 14px;
    color: $purple-500;
    font-size: 12px;
    font-weight: 700;
  }

  .hero-number {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .chart {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 48px;
    margin-top: 8px;
  }

  .chart-col {
    flex: 1 1 0;
    height: 100%;
    display: flex;
    align-items: flex-end;
  }

  .chart-bar {
    width: 100%;
    border-radius: 2px 2px 0 0;
    background: $purple-500;
  }

  .chart-bar.today {
    background: $green-100;
  }

  .chart-bar.empty {
    background: rgba($header-color, 0.28);
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 2px;
  }

  .suggest-row {
    margin-top: 7px;
  }

  .suggest-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .suggest-title {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.2;
  }

  .suggest-hint {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .show-button,
  .edit-button,
  .edit-row {
    border: 0;
    cursor: pointer;
  }

  .show-button {
    flex: 0 0 auto;
    padding: 0;
    background: transparent;
    color: $header-color;
    font-size: 12px;
    font-weight: 700;
  }

  .show-button:hover,
  .show-button:focus {
    color: $white;
  }

  .due-track,
  .balance-track {
    height: 8px;
    margin-top: 6px;
    border-radius: 99px;
    background: rgba($header-color, 0.2);
    overflow: hidden;
  }

  .due-fill,
  .balance-fill {
    height: 100%;
    border-radius: 99px;
    background: $green-100;
  }

  .balance-track {
    margin-top: 2px;
    margin-bottom: 6px;
  }

  .tone-down .balance-fill {
    background: $red-100;
  }

  .tone-up .balance-fill {
    background: $green-100;
  }

  .edit-wrap {
    position: relative;
    flex: 0 0 auto;
  }

  .edit-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid rgba($header-color, 0.45);
    border-radius: 6px;
    background: rgba($header-dark-background, 0.45);
    color: $white;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
  }

  .edit-button:hover,
  .edit-button:focus,
  .edit-button[aria-expanded='true'] {
    background: rgba($white, 0.12);
    outline: none;
  }

  .edit-icon {
    color: $white;
  }

  .edit-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 40;
    width: 260px;
    padding: 8px;
    border: 1px solid rgba($header-color, 0.35);
    border-radius: 8px;
    background: $header-dark-background;
    box-shadow: 0 8px 24px rgba($black, 0.35);
    text-align: left;
  }

  .edit-menu-heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px 8px;
    color: $white;
    font-size: 13px;
    font-weight: 700;
  }

  .edit-count,
  .edit-group {
    color: $header-color;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .edit-group {
    margin: 6px 8px 2px;
  }

  .edit-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
    background: transparent;
    color: $white;
    font-size: 13px;
    text-align: left;
  }

  .edit-row:hover,
  .edit-row:focus {
    background: rgba($white, 0.08);
    outline: none;
  }

  .check {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    border: 1.5px solid $header-color;
    border-radius: 3px;
    background: transparent;
  }

  .check.on {
    border-color: $purple-400;
    background: $purple-400;
  }

  .check.on::after {
    content: '';
    display: block;
    width: 4px;
    height: 8px;
    margin: 1px auto 0;
    border: solid $white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
</style>

<script>
import moment from 'moment';
import axios from 'axios';
import { mapState } from '@/libs/store';
import editIcon from '@/assets/svg/edit.svg?raw';
import {
  STAT_WIDGETS,
  completedSeries,
  dueToday,
  habitBalance,
  loadVisibility,
  saveVisibility,
  tagBreakdown,
  taskMix,
  topHabits,
  topStreaks,
} from '@/libs/headerStats';

export default {
  data () {
    return {
      icons: { edit: editIcon },
      widgets: STAT_WIDGETS,
      visibility: loadVisibility(),
      menuOpen: false,
      completedTodos: [],
      tasksFailed: false,
    };
  },
  computed: {
    ...mapState({
      user: 'user.data',
      tasks: 'tasks.data',
      tasksStatus: 'tasks.loadingStatus',
    }),
    visibleWidgets () {
      return this.widgets.filter(widget => this.visibility[widget.id]);
    },
    mainWidgets () {
      return this.widgets.filter(widget => widget.group === 'main');
    },
    suggestedWidgets () {
      return this.widgets.filter(widget => widget.group === 'suggested');
    },
    hiddenSuggestions () {
      return this.widgets.filter(widget => widget.group === 'suggested' && !this.visibility[widget.id]);
    },
    tagStats () {
      const tags = this.user && this.user.tags ? this.user.tags : [];
      return tagBreakdown(this.tasks, tags, this.completedTodos);
    },
    habitStats () {
      return topHabits(this.tasks);
    },
    completedStats () {
      return completedSeries(this.tasks, this.completedTodos, this.user);
    },
    mixStats () {
      return taskMix(this.tasks);
    },
    streakStats () {
      return topStreaks(this.tasks);
    },
    dueStats () {
      return dueToday(this.tasks, this.user);
    },
    balanceStats () {
      return habitBalance(this.tasks, this.user);
    },
    todayKey () {
      const { series } = this.completedStats;
      if (!series.length) return '';
      return series[series.length - 1].key;
    },
    completedSummary () {
      return this.$t('headerStatsCompletedSummary', {
        total: this.completedStats.total,
        count: this.completedStats.days,
      });
    },
    dueSummary () {
      return this.$t('headerStatsDueSummary', {
        done: this.dueStats.done,
        due: this.dueStats.due,
      });
    },
    shownCount () {
      return this.$t('headerStatsShownCount', {
        shown: this.visibleWidgets.length,
        total: this.widgets.length,
      });
    },
  },
  created () {
    this.ensureTasks();
    this.loadCompletedTodos();
  },
  mounted () {
    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('keydown', this.onKeydown);
  },
  beforeDestroy () {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    async ensureTasks () {
      if (this.tasksStatus === 'LOADED') return;
      try {
        await this.$store.dispatch('tasks:fetchUserTasks');
      } catch (err) {
        this.tasksFailed = true;
      }
    },
    async loadCompletedTodos () {
      try {
        const response = await axios.get('/api/v4/tasks/user?type=completedTodos');
        this.completedTodos = response.data && response.data.data ? response.data.data : [];
      } catch (err) {
        this.completedTodos = [];
      }
    },
    cardMeta (id) {
      if (id === 'tags') return this.$t('headerStatsTagsMeta', { count: this.tagStats.total });
      if (id === 'topHabits') return this.$t('headerStatsTopHabitsMeta');
      if (id === 'taskMix') return this.$t('headerStatsTagsMeta', { count: this.mixStats.total });
      if (id === 'habitBalance') return this.$t('headerStatsLastDays', { count: this.balanceStats.days });
      return '';
    },
    rowLabel (row) {
      return row.untagged ? this.$t('headerStatsUntagged') : row.name;
    },
    barWidth (count, rows) {
      const max = Math.max(...rows.map(row => row.count), 1);
      if (!count) return '0%';
      return `${Math.max(8, Math.round((count / max) * 100))}%`;
    },
    barHeight (count) {
      if (!count) return '2px';
      const max = Math.max(...this.completedStats.series.map(point => point.count), 1);
      return `${Math.round((count / max) * 100)}%`;
    },
    balanceWidth (count) {
      const max = Math.max(this.balanceStats.up, this.balanceStats.down, 1);
      if (!count) return '0%';
      return `${Math.round((count / max) * 100)}%`;
    },
    formatDay (key) {
      return moment(key, 'YYYY-MM-DD').format('MMM D');
    },
    pointTitle (point) {
      const day = point.key === this.todayKey ? this.$t('today') : this.formatDay(point.key);
      return this.$t('headerStatsCompletedPoint', { day, count: point.count });
    },
    streakLabel (count) {
      if (count === 1) return this.$t('headerStatsStreakCountOne');
      return this.$t('headerStatsStreakCount', { count });
    },
    toggleWidget (id) {
      this.visibility = {
        ...this.visibility,
        [id]: !this.visibility[id],
      };
      saveVisibility(this.visibility);
    },
    showWidget (id) {
      if (this.visibility[id]) return;
      this.toggleWidget(id);
    },
    onDocumentClick (event) {
      if (!this.menuOpen) return;
      if (this.$refs.editRoot && this.$refs.editRoot.contains(event.target)) return;
      this.menuOpen = false;
    },
    onKeydown (event) {
      if (this.menuOpen && event.key === 'Escape') this.menuOpen = false;
    },
  },
};
</script>
