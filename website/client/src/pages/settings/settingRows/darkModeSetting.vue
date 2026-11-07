<template>
  <div class="d-content">
    <tr>
      <td class="settings-label">
        {{ $t('darkMode') }}
      </td>
      <td class="settings-value">
      </td>
      <td class="settings-button">
        <toggle-switch
          :checked="darkMode"
          @change="setDarkMode"
        />
      </td>
    </tr>
  </div>
</template>

<style lang="scss" scoped>
  ::v-deep .toggle-switch-outer {
    display: inline-block;
  }
</style>

<script>
import ToggleSwitch from '@/components/ui/toggleSwitch.vue';
import darkModeMixin from '@/mixins/darkMode';

export default {
  components: { ToggleSwitch },
  mixins: [darkModeMixin],
};
</script>
