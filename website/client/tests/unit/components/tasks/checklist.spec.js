import { describe, expect, test } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import Checklist from '@/components/tasks/modal-controls/checklist.vue';
import selectDifficulty from '@/components/tasks/modal-controls/selectDifficulty';

const items = [
  {
    id: 'a', text: 'Pack bag', completed: false, notes: '', priority: 1,
  },
  {
    id: 'b', text: 'Leave', completed: true, notes: 'by noon', priority: 1.5,
  },
];

function mountChecklist (taskType, extra = {}) {
  return shallowMount(Checklist, {
    propsData: {
      items: items.map(item => ({ ...item })),
      taskType,
    },
    mocks: {
      $t: key => key,
    },
    stubs: {
      'b-collapse': { template: '<div><slot /></div>' },
      draggable: { template: '<div class="draggable-stub"><slot /></div>' },
      'emoji-auto-complete': true,
      checkbox: true,
      'lockable-label': true,
    },
    ...extra,
  });
}

describe('Checklist', () => {
  test('puts to-do items in their own scroll section', () => {
    const wrapper = mountChecklist('todo');

    expect(wrapper.vm.scrollsChecklist).to.equal(true);
    const scroller = wrapper.find('.checklist-items');
    expect(scroller.exists()).to.equal(true);
    expect(scroller.classes()).to.include('is-scrollable');
    expect(scroller.find('.checklist-entry').exists()).to.equal(true);
    expect(scroller.element.contains(wrapper.find('.new-checklist').element)).to.equal(false);
  });

  test('does not cap daily checklist items', () => {
    const wrapper = mountChecklist('daily');

    expect(wrapper.vm.scrollsChecklist).to.equal(false);
    expect(wrapper.find('.checklist-items').classes()).to.not.include('is-scrollable');
  });

  test('asks checklist difficulty menus to escape the scroller', () => {
    const wrapper = mountChecklist('todo');
    const difficulty = wrapper.find(selectDifficulty);

    expect(difficulty.exists()).to.equal(true);
    expect(difficulty.props('boundary')).to.equal('viewport');
    expect(difficulty.props('popperOpts')).to.deep.equal({ positionFixed: true });
  });

  test('scrolls the new to-do item into the checklist section', async () => {
    const wrapper = mountChecklist('todo');
    const scroller = wrapper.find('.checklist-items').element;
    const seen = [];
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function scrollIntoView () {
      seen.push(this);
    };
    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      get: () => 480,
    });

    try {
      wrapper.setData({ newChecklistItem: 'Buy tickets' });
      wrapper.vm.addChecklistItem({ preventDefault () {} }, false);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.checklist).to.have.length(3);
      expect(seen.length).to.be.greaterThan(0);
      expect(seen[seen.length - 1].classList.contains('checklist-entry')).to.equal(true);
      expect(scroller.scrollTop).to.equal(480);
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });
});
