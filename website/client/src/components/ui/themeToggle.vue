<template>
  <button
    v-b-tooltip.hover.bottom="label"
    type="button"
    class="theme-toggle item-with-icon"
    :aria-pressed="darkMode ? 'true' : 'false'"
    :aria-label="label"
    @click="toggleDarkMode"
  >
    <span class="top-menu-icon svg-icon color">
      <svg
        v-if="darkMode"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3
            A.75.75 0 0 1 12 2.25zm0 15a.75.75 0 0 1 .75.75V19.5
            a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75z
            M4.72 4.72a.75.75 0 0 1 1.06 0l1.06 1.06
            a.75.75 0 1 1-1.06 1.06L4.72 5.78a.75.75 0 0 1 0-1.06z
            m12.44 12.44a.75.75 0 0 1 1.06 0l1.06 1.06
            a.75.75 0 1 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06z
            M2.25 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H3
            a.75.75 0 0 1-.75-.75zm15 0a.75.75 0 0 1 .75-.75H19.5
            a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75z
            M4.72 19.28a.75.75 0 0 1 0-1.06l1.06-1.06
            a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0z
            m12.44-12.44a.75.75 0 0 1 0-1.06l1.06-1.06
            a.75.75 0 1 1 1.06 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0z
            M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"
        ></path>
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M9.53 1.72a.75.75 0 0 1 .16.82A8.97 8.97 0 0 0 9 6
            a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.46-.69
            .75.75 0 0 1 .98.98 10.5 10.5 0 0 1-9.69 6.46
            C7.05 21.75 2.25 17.05 2.25 11.25c0-4.37 2.67-8.11
            6.46-9.69a.75.75 0 0 1 .82.16z"
        ></path>
      </svg>
    </span>
  </button>
</template>

<style lang="scss" scoped>
  .theme-toggle {
    background: transparent;
    border: 0;
    padding: 0;
    color: #d5c8ff;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    line-height: 1;

    &:hover,
    &:focus {
      color: #fff;
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: 2px solid #d5c8ff;
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  .svg-icon {
    width: 24px;
    height: 24px;

    svg {
      display: block;
      width: 24px;
      height: 24px;
    }
  }
</style>

<script>
import darkModeMixin from '@/mixins/darkMode';

export default {
  mixins: [darkModeMixin],
  computed: {
    label () {
      return this.darkMode ? this.$t('lightMode') : this.$t('darkMode');
    },
  },
};
</script>
