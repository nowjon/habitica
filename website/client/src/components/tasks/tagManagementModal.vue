<template>
  <b-modal
    id="tag-management-modal"
    size="md"
    :title="$t('tagManagement')"
    :ok-title="$t('saveTagStyles')"
    :cancel-title="$t('cancel')"
    @ok="save"
    @show="syncTags"
    @hidden="reset"
  >
    <p class="help-text">
      {{ $t('tagManagementHelp') }}
    </p>
    <div
      v-if="editableTags.length === 0"
      class="empty-state"
    >
      {{ $t('noTags') }}
    </div>
    <div
      v-for="tag in editableTags"
      :key="tag.id"
      class="tag-row d-flex align-items-center"
    >
      <div
        class="tag-preview mr-3"
        :style="previewStyle(tag)"
      ></div>
      <div class="tag-name mr-auto">
        {{ tag.name }}
      </div>
      <label class="sr-only" :for="`tag-color-${tag.id}`">
        {{ $t('tagOutlineColor') }}
      </label>
      <input
        :id="`tag-color-${tag.id}`"
        v-model="tag.outlineColor"
        class="color-input mr-2"
        type="color"
        :title="$t('tagOutlineColor')"
      >
      <label class="sr-only" :for="`tag-width-${tag.id}`">
        {{ $t('tagOutlineWidth') }}
      </label>
      <input
        :id="`tag-width-${tag.id}`"
        v-model.number="tag.outlineWidth"
        class="form-control width-input mr-1"
        type="number"
        min="0"
        max="8"
        step="1"
        :title="$t('tagOutlineWidth')"
      >
      <span class="width-unit">{{ $t('tagOutlineWidthUnit') }}</span>
      <button
        class="btn btn-link clear-btn ml-2"
        type="button"
        @click="clearOutline(tag)"
      >
        {{ $t('tagOutlineNone') }}
      </button>
    </div>
  </b-modal>
</template>

<style lang="scss" scoped>
  @import '@/assets/scss/colors.scss';

  .help-text {
    color: $gray-100;
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 16px;
  }

  .empty-state {
    color: $gray-200;
    font-size: 14px;
    padding: 12px 0;
  }

  .tag-row {
    padding: 10px 0;
    border-bottom: 1px solid $gray-600;

    &:last-child {
      border-bottom: none;
    }
  }

  .tag-preview {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    background: $white;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .tag-name {
    font-size: 14px;
    font-weight: 600;
    color: $gray-50;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }

  .color-input {
    width: 36px;
    height: 32px;
    padding: 2px;
    border: 1px solid $gray-500;
    border-radius: 4px;
    background: $white;
    cursor: pointer;
  }

  .width-input {
    width: 64px;
    height: 32px;
    padding: 4px 8px;
  }

  .width-unit {
    color: $gray-200;
    font-size: 12px;
  }

  .clear-btn {
    padding: 0;
    font-size: 12px;
    color: $gray-200;
  }
</style>

<script>
import cloneDeep from 'lodash/cloneDeep';
import { mapState, mapActions } from '@/libs/store';

const DEFAULT_COLOR = '#925CF3';

export default {
  data () {
    return {
      editableTags: [],
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
  },
  methods: {
    ...mapActions({ setUser: 'user:set' }),
    syncTags () {
      this.editableTags = (this.user.tags || [])
        .filter(tag => !tag.group)
        .map(tag => ({
          id: tag.id,
          name: tag.name,
          challenge: tag.challenge,
          outlineColor: tag.outlineColor || DEFAULT_COLOR,
          outlineWidth: Number.isFinite(tag.outlineWidth) ? tag.outlineWidth : 0,
        }));
    },
    previewStyle (tag) {
      const width = Math.max(0, Number(tag.outlineWidth) || 0);
      if (!width || !tag.outlineColor) {
        return { border: '1px solid #C3C0C7' };
      }
      return {
        boxShadow: `0 0 0 ${Math.min(width, 4)}px ${tag.outlineColor}`,
      };
    },
    clearOutline (tag) {
      tag.outlineWidth = 0;
      tag.outlineColor = DEFAULT_COLOR;
    },
    async save (bvModalEvt) {
      bvModalEvt.preventDefault();

      const editableById = {};
      this.editableTags.forEach(tag => {
        editableById[tag.id] = tag;
      });

      const nextTags = cloneDeep(this.user.tags || []).map(tag => {
        const edited = editableById[tag.id];
        if (!edited) return tag;

        const width = Math.max(0, Math.min(8, Math.round(Number(edited.outlineWidth) || 0)));
        return {
          ...tag,
          outlineColor: width > 0 ? (edited.outlineColor || DEFAULT_COLOR) : null,
          outlineWidth: width,
        };
      });

      await this.setUser({ tags: nextTags.filter(tag => !tag.group) });
      this.$root.$emit('bv::hide::modal', 'tag-management-modal');
    },
    reset () {
      this.editableTags = [];
    },
  },
};
</script>
