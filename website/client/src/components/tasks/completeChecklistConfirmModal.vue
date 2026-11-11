<template>
  <b-modal
    id="complete-checklist-confirm-modal"
    :hide-footer="true"
    :hide-header="true"
    modal-class="complete-checklist-modal"
    centered
    @hidden="onHidden"
  >
    <div class="modal-content-wrapper">
      <div class="top-bar"></div>
      <div class="modal-body-content">
        <h2 class="modal-title">
          {{ $t('completeChecklistTitle') }}
        </h2>
        <p class="modal-description">
          {{ prompt }}
        </p>
        <div class="button-wrapper">
          <button
            class="btn btn-primary"
            type="button"
            @click="choose('complete')"
          >
            {{ $t('completeChecklistToo') }}
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            @click="choose('skip')"
          >
            {{ $t('completeTodoOnly') }}
          </button>
          <button
            class="btn-cancel"
            type="button"
            @click="choose('cancel')"
          >
            {{ $t('cancel') }}
          </button>
        </div>
      </div>
    </div>
  </b-modal>
</template>

<script>
export default {
  data () {
    return {
      count: 0,
      resolveCallback: null,
    };
  },
  computed: {
    prompt () {
      if (this.count === 1) return this.$t('completeChecklistPromptOne');
      return this.$t('completeChecklistPromptMany', { count: this.count });
    },
  },
  mounted () {
    this.$root.$on('habitica:complete-checklist-confirm', config => {
      if (this.resolveCallback) {
        const previous = this.resolveCallback;
        this.resolveCallback = null;
        previous('cancel');
      }
      this.count = config.count || 0;
      this.resolveCallback = config.resolve;
      this.$root.$emit('bv::show::modal', 'complete-checklist-confirm-modal');
    });
  },
  beforeDestroy () {
    this.$root.$off('habitica:complete-checklist-confirm');
  },
  methods: {
    choose (choice) {
      this.finish(choice);
    },
    onHidden () {
      this.finish('cancel', true);
    },
    finish (choice, alreadyHidden = false) {
      const resolve = this.resolveCallback;
      this.resolveCallback = null;
      if (resolve) resolve(choice);
      if (!alreadyHidden) {
        this.$root.$emit('bv::hide::modal', 'complete-checklist-confirm-modal');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/scss/colors.scss';

::v-deep .complete-checklist-modal {
  .modal-dialog {
    max-width: 360px;
    margin: auto;
  }

  .modal-content {
    border-radius: 8px;
    overflow: hidden;
    border: none;
  }

  .modal-body {
    padding: 0;
  }
}

.modal-content-wrapper {
  display: flex;
  flex-direction: column;
}

.top-bar {
  height: 8px;
  background-color: $purple-300;
}

.modal-body-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 24px 20px;
}

.modal-title {
  margin-top: 8px;
  margin-bottom: 0;
  color: $purple-200;
  font-family: 'Roboto Condensed', sans-serif;
  font-weight: 700;
  font-size: 20px;
  text-align: center;
}

.modal-description {
  margin-top: 12px;
  margin-bottom: 0;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  text-align: center;
  color: $gray-50;
}

.button-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 16px;
  gap: 8px;

  .btn {
    width: 100%;
  }
}

.btn-cancel {
  background: none;
  border: none;
  color: $purple-300;
  font-family: Roboto, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  padding: 8px 16px;

  &:hover {
    text-decoration: underline;
  }
}
</style>
