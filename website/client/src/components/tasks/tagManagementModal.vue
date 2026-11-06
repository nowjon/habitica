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
      v-for="(tag, index) in editableTags"
      :key="tag.id"
      class="tag-row"
    >
      <div class="d-flex align-items-center mb-2">
        <div
          class="tag-preview mr-3"
          :style="previewStyle(tag)"
        ></div>
        <label class="sr-only" :for="`tag-name-${tag.id}`">
          {{ $t('tagName') }}
        </label>
        <input
          :id="`tag-name-${tag.id}`"
          v-model="tag.name"
          class="form-control name-input mr-2"
          type="text"
          :placeholder="$t('tagName')"
          maxlength="100"
          @keydown.enter.prevent
        >
        <button
          class="btn btn-link delete-btn"
          type="button"
          :title="$t('deleteTag')"
          @click="removeTag(index)"
        >
          <div
            class="svg-icon destroy-icon"
            v-html="icons.destroy"
          ></div>
        </button>
      </div>
      <div class="d-flex align-items-center outline-controls">
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
        <span class="width-unit mr-auto">{{ $t('tagOutlineWidthUnit') }}</span>
        <button
          class="btn btn-link clear-btn"
          type="button"
          @click="clearOutline(tag)"
        >
          {{ $t('tagOutlineNone') }}
        </button>
      </div>
    </div>
    <div class="add-tag-row d-flex align-items-center">
      <input
        ref="newTagInput"
        v-model="newTagName"
        class="form-control name-input mr-2"
        type="text"
        :placeholder="$t('newTag')"
        maxlength="100"
        @keydown.enter.prevent="addTag"
      >
      <button
        class="btn btn-secondary add-tag-btn"
        type="button"
        :disabled="!canAddTag"
        @click="addTag"
      >
        {{ $t('addTag') }}
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
    padding: 12px 0;
    border-bottom: 1px solid $gray-600;
  }

  .tag-preview {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    background: $white;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .name-input {
    height: 32px;
    padding: 4px 10px;
    font-size: 14px;
  }

  .outline-controls {
    padding-left: 30px;
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

  .delete-btn {
    padding: 0;
    flex-shrink: 0;
    color: $gray-200;

    &:hover {
      color: $red-50;
    }
  }

  .destroy-icon {
    width: 14px;
    height: 16px;
  }

  .add-tag-row {
    padding-top: 16px;
  }

  .add-tag-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>

<script>
import { v4 as uuid } from 'uuid';
import { mapState, mapActions } from '@/libs/store';
import deleteIcon from '@/assets/svg/delete.svg?raw';

const DEFAULT_COLOR = '#925CF3';

function normalizeName (name) {
  return String(name || '').trim();
}

export default {
  data () {
    return {
      editableTags: [],
      newTagName: '',
      icons: Object.freeze({
        destroy: deleteIcon,
      }),
    };
  },
  computed: {
    ...mapState({ user: 'user.data' }),
    canAddTag () {
      return Boolean(normalizeName(this.newTagName));
    },
  },
  methods: {
    ...mapActions({ setUser: 'user:set' }),
    syncTags () {
      this.newTagName = '';
      this.editableTags = (this.user.tags || [])
        .filter(tag => !tag.group)
        .map(tag => ({
          id: tag.id,
          name: tag.name,
          challenge: Boolean(tag.challenge),
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
    addTag () {
      const name = normalizeName(this.newTagName);
      if (!name) return;

      this.editableTags.push({
        id: uuid(),
        name,
        challenge: false,
        outlineColor: DEFAULT_COLOR,
        outlineWidth: 0,
      });
      this.newTagName = '';
      this.$nextTick(() => {
        if (this.$refs.newTagInput) this.$refs.newTagInput.focus();
      });
    },
    removeTag (index) {
      this.editableTags.splice(index, 1);
    },
    async save (bvModalEvt) {
      bvModalEvt.preventDefault();

      if (normalizeName(this.newTagName)) {
        this.addTag();
      }

      const nextTags = [];
      const seenNames = new Set();

      this.editableTags.forEach(tag => {
        const name = normalizeName(tag.name);
        if (!name) return;

        const nameKey = name.toLowerCase();
        if (seenNames.has(nameKey)) return;
        seenNames.add(nameKey);

        const width = Math.max(0, Math.min(8, Math.round(Number(tag.outlineWidth) || 0)));
        const nextTag = {
          id: tag.id,
          name,
          outlineColor: width > 0 ? (tag.outlineColor || DEFAULT_COLOR) : null,
          outlineWidth: width,
        };
        if (tag.challenge) nextTag.challenge = true;
        nextTags.push(nextTag);
      });

      await this.setUser({ tags: nextTags });
      this.$root.$emit('bv::hide::modal', 'tag-management-modal');
    },
    reset () {
      this.editableTags = [];
      this.newTagName = '';
    },
  },
};
</script>
