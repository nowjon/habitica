<template>
  <div class="checklist-component">
    <div
      class="d-flex"
    >
      <lockable-label
        :locked="disabled"
        :text="$t('checklist')"
      />
      <div
        class="svg-icon icon-16 my-auto ml-auto pointer"
        :class="{'chevron-flip': showChecklist}"
        @click="showChecklist = !showChecklist"
        v-html="icons.chevron"
      >
      </div>
    </div>
    <b-collapse
      id="checklistCollapse"
      v-model="showChecklist"
    >
      <draggable
        v-model="checklist"
        handle=".grippy"
        filter=".task-dropdown"
        :disabled="disabled"
        @update="updateChecklist"
      >
        <div
          v-for="(item, $index) in checklist"
          :key="item.id"
          class="checklist-entry"
        >
          <div class="inline-edit-input-group checklist-group input-group">
            <span
              v-if="!disabled && !disableDrag"
              class="grippy"
              v-html="icons.grip"
            >
            </span>

            <checkbox
              v-if="!disableEdit"
              :id="`checklist-${item.id}`"
              :checked.sync="item.completed"
              :disabled="disabled"
              class="input-group-prepend"
              :class="{'cursor-auto': disabled}"
            />

            <input
              :ref="'checklistItem-' + $index"
              v-model="item.text"
              class="inline-edit-input checklist-item form-control"
              type="text"
              :disabled="disabled || disableEdit"
              :class="summaryClass(item)"
              @focus="setActiveItem($index)"
              @keydown="autoCompleteMixinUpdateCarretPosition"
              @keydown.tab="autoCompleteMixinHandleTab($event)"
              @keydown.up="autoCompleteMixinSelectPreviousAutocomplete($event)"
              @keydown.down="autoCompleteMixinSelectNextAutocomplete($event)"
              @keypress.enter="autoCompleteMixinSelectAutocomplete($event)"
              @keydown.esc="autoCompleteMixinHandleEscape($event)"
            >
            <span
              v-if="!disabled && !disableEdit"
              class="input-group-append"
              @click="removeChecklistItem($index)"
            >
              <div
                v-once
                class="svg-icon destroy-icon"
                v-html="icons.destroy"
              >
              </div>
            </span>
          </div>
          <div
            v-if="taskType === 'todo'"
            class="checklist-item-extras"
          >
            <template v-if="!disableEdit">
              <div class="checklist-extra-label">
                {{ $t('difficulty') }}
              </div>
              <select-difficulty
                :value="itemPriority(item)"
                :disabled="disabled"
                @select="setItemPriority(item, $event)"
              />
              <div class="checklist-extra-label">
                {{ $t('notes') }}
              </div>
              <textarea
                v-model="item.notes"
                class="checklist-notes"
                rows="2"
                :disabled="disabled"
                :placeholder="$t('addNotes')"
              ></textarea>
            </template>
            <template v-else>
              <div
                class="checklist-difficulty-readonly"
                :class="difficultyClass(item)"
              >
                {{ difficultyLabel(item) }}
              </div>
              <div
                v-if="item.notes"
                v-markdown="item.notes"
                class="checklist-notes-readonly"
              ></div>
            </template>
          </div>
        </div>
      </draggable>
      <div
        v-if="!disabled && !disableEdit"
        class="inline-edit-input-group checklist-group input-group new-checklist"
        :class="{'top-border': items.length === 0}"
      >
        <span
          v-once
          class="input-group-prepend new-icon"
          v-html="icons.positive"
        >
        </span>

        <input
          ref="newChecklistInput"
          v-model="newChecklistItem"
          class="inline-edit-input checklist-item form-control"
          type="text"
          :placeholder="$t('newChecklistItem')"
          @focus="setActiveItem(-1)"
          @keydown="autoCompleteMixinUpdateCarretPosition"
          @keydown.tab="autoCompleteMixinHandleTab($event)"
          @keydown.up="autoCompleteMixinSelectPreviousAutocomplete($event)"
          @keydown.down="autoCompleteMixinSelectNextAutocomplete($event)"
          @keypress.enter="newChecklistEnterHandler($event)"
          @keyup.enter="addChecklistItem($event, true)"
          @keydown.esc="autoCompleteMixinHandleEscape($event)"
          @blur="addChecklistItem($event, false)"
        >
      </div>
      <emoji-auto-complete
        ref="emojiAutocomplete"
        :text="activeFieldText"
        :textbox="textbox"
        :coords="mixinData.autoComplete.coords"
        :caret-position="mixinData.autoComplete.caretPosition"
        @select="selectedAutocomplete"
      />
    </b-collapse>
  </div>
</template>

<script>
// import clone from 'lodash/clone';
import draggable from 'vuedraggable';
import { v4 as uuid } from 'uuid';

import positiveIcon from '@/assets/svg/positive.svg?raw';
import deleteIcon from '@/assets/svg/delete.svg?raw';
import chevronIcon from '@/assets/svg/chevron.svg?raw';
import gripIcon from '@/assets/svg/grip.svg?raw';
import checkbox from '@/components/ui/checkbox';
import selectDifficulty from '@/components/tasks/modal-controls/selectDifficulty';
import lockableLabel from './lockableLabel';
import emojiAutoComplete from '@/components/chat/emojiAutoComplete';
import markdownDirective from '@/directives/markdown';
import { autoCompleteHelperMixin } from '@/mixins/autoCompleteHelper';

export default {
  name: 'Checklist',
  components: {
    checkbox,
    draggable,
    lockableLabel,
    emojiAutoComplete,
    selectDifficulty,
  },
  directives: {
    markdown: markdownDirective,
  },
  mixins: [autoCompleteHelperMixin],
  props: {
    disabled: {
      type: Boolean,
    },
    disableDrag: {
      type: Boolean,
    },
    disableEdit: {
      type: Boolean,
    },
    items: {
      type: Array,
    },
    taskType: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      checklist: this.items,
      showChecklist: true,
      hasPossibilityOfIMEConversion: true,
      newChecklistItem: null,
      textbox: null,
      activeItemIndex: -1,
      icons: Object.freeze({
        positive: positiveIcon,
        destroy: deleteIcon,
        chevron: chevronIcon,
        grip: gripIcon,
      }),
    };
  },
  computed: {
    activeFieldText () {
      if (this.activeItemIndex === -1) {
        return this.newChecklistItem || '';
      }
      const item = this.checklist[this.activeItemIndex];
      return item ? item.text || '' : '';
    },
  },
  methods: {
    summaryClass (item) {
      if (!this.disableEdit) return '';
      if (item.completed) return 'summary-completed';
      return 'summary-incomplete';
    },
    itemPriority (item) {
      const value = Number(item && item.priority);
      if (Math.abs(value - 0.1) < 0.001) return 0.1;
      if (Math.abs(value - 1.5) < 0.001) return 1.5;
      if (Math.abs(value - 2) < 0.001) return 2;
      return 1;
    },
    difficultyKey (item) {
      const value = this.itemPriority(item);
      if (value === 0.1) return 'trivial';
      if (value === 1.5) return 'medium';
      if (value === 2) return 'hard';
      return 'easy';
    },
    difficultyLabel (item) {
      return this.$t(this.difficultyKey(item));
    },
    difficultyClass (item) {
      return `difficulty-${this.difficultyKey(item)}`;
    },
    setItemPriority (item, priority) {
      this.$set(item, 'priority', priority);
      this.updateChecklist();
    },
    updateChecklist () {
      this.$emit('update:items', this.checklist);
    },
    setHasPossibilityOfIMEConversion (bool) {
      this.hasPossibilityOfIMEConversion = bool;
    },
    addChecklistItem (e, checkIME) {
      if (e) {
        e.preventDefault();
      }

      const newChecklistItemText = (this.newChecklistItem || '').trim();

      if ((checkIME && this.hasPossibilityOfIMEConversion)
        || !newChecklistItemText) {
        return;
      }

      const checkListItem = {
        id: uuid(),
        text: newChecklistItemText,
        completed: false,
        notes: '',
        priority: 1,
      };
      this.checklist.push(checkListItem);
      this.newChecklistItem = null;
      this.setHasPossibilityOfIMEConversion(true);
      this.updateChecklist();
    },
    removeChecklistItem (i) {
      this.checklist.splice(i, 1);
      this.updateChecklist();
    },
    setActiveItem (index) {
      this.activeItemIndex = index;
      if (index === -1) {
        this.textbox = this.$refs.newChecklistInput;
      } else {
        const refArr = this.$refs[`checklistItem-${index}`];
        this.textbox = refArr ? refArr[0] || refArr : null;
      }
    },
    newChecklistEnterHandler (e) {
      const ac = this._getActiveAutocomplete();
      if (ac && ac.selected !== null) {
        e.preventDefault();
        ac.makeSelection();
      } else if (ac) {
        ac.cancel();
        this.setHasPossibilityOfIMEConversion(false);
      } else {
        this.setHasPossibilityOfIMEConversion(false);
      }
    },
    selectedAutocomplete (newText, newCaret) {
      if (this.activeItemIndex === -1) {
        this.newChecklistItem = newText;
      } else {
        this.checklist[this.activeItemIndex].text = newText;
      }
      this.$nextTick(() => {
        if (this.textbox) {
          this.textbox.setSelectionRange(newCaret, newCaret);
          this.textbox.focus();
        }
      });
    },
  },
};
</script>

<style lang="scss">
  @import '@/assets/scss/colors.scss';

  .checklist-component {
    position: relative;

    .chevron-flip {
      transform: translateY(-5px) rotate(180deg);
    }

    .lock-icon {
      color: $gray-200;
    }

    .pointer {
      cursor: pointer;
    }

    .top-border {
      border-top: 1px solid $gray-500;
    }

    .checklist-entry {
      position: relative;
      border-bottom: 1px solid $gray-500;

      &:first-of-type {
        border-top: 1px solid $gray-500;
      }
    }

    .checklist-item-extras {
      padding: 0.25rem 0.75rem 0.75rem;

      .checklist-extra-label {
        margin: 0.5rem 0 0.25rem;
        color: $gray-100;
        font-size: 12px;
        line-height: 1.33;
      }

      .checklist-notes {
        width: 100%;
        min-height: 3.25rem;
        padding: 0.375rem 0.5rem;
        border: 1px solid $gray-400;
        border-radius: 2px;
        color: $gray-50;
        font-size: 14px;
        line-height: 1.43;
        resize: vertical;
      }

      .checklist-difficulty-readonly {
        font-size: 12px;
        font-weight: bold;
        line-height: 1.33;
        text-transform: uppercase;

        &.difficulty-trivial {
          color: $gray-200;
        }

        &.difficulty-easy {
          color: $yellow-5;
        }

        &.difficulty-medium {
          color: $orange-10;
        }

        &.difficulty-hard {
          color: $red-10;
        }
      }

      .checklist-notes-readonly {
        margin-top: 0.25rem;
        color: $gray-100;
        font-size: 14px;
        line-height: 1.43;

        p {
          margin-bottom: 0;
        }
      }
    }

    .checklist-group {
      height: 2rem;
      border-bottom: 1px solid $gray-500;

      &:first-of-type {
        border-top: 1px solid $gray-500;
      }

      .inline-edit-input  {
        padding-left: 0.75rem;
      }

      .input-group-prepend {
        margin-left: 0.375rem;
        margin-top: 0.375rem;
        margin-right: 0;
        padding: 0;
        &:not(.new-icon) {
          width: 1.125rem;
          height: 1.125rem;
        }
        &.new-icon {
          margin-left: 0.688rem;
          margin-top: 0.625rem;
          margin-bottom: 0.625rem;
          height: 10px;
          width: 13px;
        }
      }

      .input-group-append,
      .input-group-prepend {
        background: inherit;
      }

      .checklist-item {
        padding: 0;
        margin-left: 0.75rem;
        margin-top: 0.188rem;
        margin-bottom: 0.25rem;
        height: 1.5rem;
        font-size: 14px;
        font-weight: normal;
        font-stretch: normal;
        font-style: normal;
        line-height: 1.71;
        letter-spacing: normal;
        color: $gray-50;
      }

      .new-icon {
        cursor: default;

        svg {
          width: 0.625rem;
          height: 0.625rem;
          object-fit: contain;
          fill: $gray-200;
        }
      }
    }

    span.grippy {
      position: absolute;
      left: -15px;
      width: 0.625rem;
      height: 1rem;
      object-fit: contain;
      color: $gray-200;
      top: 4px;
    }

    .checklist-item {
      margin-bottom: 0px;
      border-radius: 0px;
      border: none !important;
      padding-left: 36px;

      &.summary-incomplete {
        opacity: 1;
      }
      &.summary-completed {
        text-decoration: line-through;
      }
    }

    .checklist-entry .checklist-group,
    .checklist-entry .checklist-group:first-of-type {
      border-top: none;
      border-bottom: none;
      height: auto;
      min-height: 2rem;
    }

    .checklist-group {
      .grippy {
        opacity: 0;
        cursor: pointer;

        &:hover, &:active {
          opacity: 1;
        }
      }

      .destroy-icon {
        display: none;
      }

      &:hover {
        cursor: text;

        .destroy-icon {
          display: inline-block;
          color: $gray-200;

          &:hover {
            color: $maroon-50;
          }
        }

        .grippy {
          display: inline-block;
          opacity: 1;
        }
      }
    }
  }
</style>
