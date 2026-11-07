import { mapState } from '@/libs/store';
import {
  isDarkTheme,
  persistTheme,
  THEME_CHANGE_EVENT,
} from '@/libs/theme';

export default {
  data () {
    return {
      darkMode: false,
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
  },
  created () {
    this.darkMode = isDarkTheme();
    this.onThemeChange = event => {
      this.darkMode = event.detail === 'dark';
    };
    window.addEventListener(THEME_CHANGE_EVENT, this.onThemeChange);
  },
  beforeDestroy () {
    window.removeEventListener(THEME_CHANGE_EVENT, this.onThemeChange);
  },
  methods: {
    async setDarkMode (enabled) {
      const next = enabled ? 'dark' : 'light';
      const previous = this.darkMode ? 'dark' : 'light';
      persistTheme(next);

      if (!this.user || !this.user.preferences) return;

      try {
        await this.$store.dispatch('user:set', { 'preferences.darkMode': next });
      } catch (_error) {
        if (this.user && this.user.preferences) {
          this.user.preferences.darkMode = previous;
        }
        persistTheme(previous);
      }
    },
    toggleDarkMode () {
      return this.setDarkMode(!this.darkMode);
    },
  },
};
