import scoreTask, {
  applyChecklistRewardDiff,
  scoreChecklistItem,
} from '../../../website/common/script/ops/scoreTask';
import crit from '../../../website/common/script/fns/crit';
import {
  generateUser,
  generateDaily,
  generateTodo,
} from '../../helpers/common.helper';

const EPSILON = 0.001;

function freshUser () {
  return generateUser();
}

describe('scoreChecklistItem', () => {
  beforeEach(() => {
    sandbox.stub(crit, 'crit').returns(1);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('grants experience and gold when a to do checklist item is checked', () => {
    const user = freshUser();
    const beforeExp = user.stats.exp;
    const beforeGp = user.stats.gp;
    const task = generateTodo({ userId: user._id, text: 'Parent' });
    const item = {
      text: 'Sub item',
      completed: true,
      priority: 1,
      notes: 'Bring the notebook',
      value: 0,
    };

    const delta = scoreChecklistItem({ user, task, item });

    expect(delta).to.be.greaterThan(0);
    expect(user.stats.exp).to.be.greaterThan(beforeExp);
    expect(user.stats.gp).to.be.greaterThan(beforeGp);
    expect(item.value).to.be.greaterThan(0);
    expect(item.scoredPriority).to.equal(1);
    expect(item.notes).to.equal('Bring the notebook');
  });

  it('pays more for a harder checklist item', () => {
    const easyUser = freshUser();
    const hardUser = freshUser();
    const easyTask = generateTodo({ userId: easyUser._id });
    const hardTask = generateTodo({ userId: hardUser._id });

    scoreChecklistItem({
      user: easyUser,
      task: easyTask,
      item: {
        completed: true, priority: 0.1, value: 0,
      },
    });
    scoreChecklistItem({
      user: hardUser,
      task: hardTask,
      item: {
        completed: true, priority: 2, value: 0,
      },
    });

    expect(hardUser.stats.exp).to.be.greaterThan(easyUser.stats.exp);
    expect(hardUser.stats.gp).to.be.at.least(easyUser.stats.gp);
  });

  it('removes the reward when the checklist item is unchecked', () => {
    const before = freshUser();
    const user = _.cloneDeep(before);
    const task = generateTodo({ userId: user._id });
    const item = {
      completed: true, priority: 1.5, value: 0,
    };

    scoreChecklistItem({ user, task, item });
    item.completed = false;
    scoreChecklistItem({ user, task, item });

    expect(Math.abs(user.stats.exp - before.stats.exp)).to.be.lessThan(EPSILON);
    expect(Math.abs(user.stats.gp - before.stats.gp)).to.be.lessThan(EPSILON);
    expect(Math.abs(item.value)).to.be.lessThan(EPSILON);
  });

  it('uses the difficulty from when the item was checked if it later changes', () => {
    const kept = freshUser();
    const changed = freshUser();
    const keptItem = {
      completed: true, priority: 2, value: 0,
    };
    const changedItem = {
      completed: true, priority: 2, value: 0,
    };

    scoreChecklistItem({ user: kept, task: generateTodo({ userId: kept._id }), item: keptItem });
    scoreChecklistItem({
      user: changed,
      task: generateTodo({ userId: changed._id }),
      item: changedItem,
    });

    changedItem.priority = 0.1;
    keptItem.completed = false;
    changedItem.completed = false;
    scoreChecklistItem({ user: kept, task: generateTodo({ userId: kept._id }), item: keptItem });
    scoreChecklistItem({
      user: changed,
      task: generateTodo({ userId: changed._id }),
      item: changedItem,
    });

    expect(Math.abs(changed.stats.exp - kept.stats.exp)).to.be.lessThan(EPSILON);
    expect(Math.abs(changed.stats.gp - kept.stats.gp)).to.be.lessThan(EPSILON);
  });

  it('does not reward a daily checklist item', () => {
    const user = freshUser();
    const beforeExp = user.stats.exp;
    const task = generateDaily({ userId: user._id });
    const item = {
      completed: true, priority: 2, value: 0,
    };

    const delta = scoreChecklistItem({ user, task, item });

    expect(delta).to.equal(0);
    expect(user.stats.exp).to.equal(beforeExp);
    expect(item.value).to.equal(0);
  });

  it('does not reclaim a reward from an already completed item that was never scored', () => {
    const user = freshUser();
    const beforeExp = user.stats.exp;
    const item = { completed: false, value: 0 };

    const delta = scoreChecklistItem({
      user,
      task: generateTodo({ userId: user._id }),
      item,
    });

    expect(delta).to.equal(0);
    expect(user.stats.exp).to.equal(beforeExp);
  });

  it('does not multiply the parent to do reward by completed checklist items', () => {
    const plainUser = freshUser();
    const checklistUser = freshUser();
    const plain = generateTodo({ userId: plainUser._id, text: 'Plain' });
    const withChecklist = generateTodo({
      userId: checklistUser._id,
      text: 'With checklist',
      checklist: [
        {
          text: 'Done', completed: true, priority: 2, value: 4,
        },
        {
          text: 'Also done', completed: true, priority: 0.1, value: 3,
        },
      ],
    });

    scoreTask({ user: plainUser, task: plain, direction: 'up' });
    scoreTask({ user: checklistUser, task: withChecklist, direction: 'up' });

    expect(checklistUser.stats.exp).to.equal(plainUser.stats.exp);
    expect(checklistUser.stats.gp).to.equal(plainUser.stats.gp);
    expect(checklistUser.stats.mp).to.equal(plainUser.stats.mp);
  });

  it('awards only checklist items whose completion changed', () => {
    const user = freshUser();
    const beforeExp = user.stats.exp;
    const task = generateTodo({
      userId: user._id,
      checklist: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          text: 'Already done',
          completed: true,
          priority: 2,
          value: 1,
          scoredPriority: 2,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          text: 'Still open',
          completed: false,
          priority: 2,
          value: 0,
        },
      ],
    });
    const previous = task.checklist.map(item => ({ ...item }));
    task.checklist[1].completed = true;

    const changed = applyChecklistRewardDiff(user, task, previous);

    expect(changed).to.equal(true);
    expect(user.stats.exp).to.be.greaterThan(beforeExp);
    expect(task.checklist[0].value).to.equal(1);
    expect(task.checklist[1].value).to.be.greaterThan(0);
    expect(task.checklist[1].scoredPriority).to.equal(2);
  });

  it('does not award edits to a challenge template', () => {
    const user = freshUser();
    const beforeExp = user.stats.exp;
    const task = generateTodo({
      text: 'Challenge task',
      challenge: { id: '33333333-3333-4333-8333-333333333333' },
      checklist: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          text: 'Item',
          completed: true,
          priority: 2,
        },
      ],
    });

    const changed = applyChecklistRewardDiff(user, task, []);

    expect(changed).to.equal(false);
    expect(user.stats.exp).to.equal(beforeExp);
  });
});
