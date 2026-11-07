import clone from 'lodash/clone';

export default {
  methods: {
    async syncTask () {
      if (this.groupId || this.task?.group.id) {
        const members = await this.$store.dispatch('members:getGroupMembers', {
          groupId: this.groupId || this.task?.group.id,
          includeAllPublicFields: true,
        });
        this.members = members;
        this.membersNameAndId = [];
        this.members.forEach(member => {
          this.membersNameAndId.push({
            id: member._id,
            name: member.profile.name,
            addlText: `@${member.auth.local.username}`,
          });
          this.memberNamesById[member._id] = member.profile.name;
        });
        this.assignedMembers = [];
        if (this.task?.group?.assignedUsers) {
          this.assignedMembers = this.task.group.assignedUsers;
        }
      }

      // @TODO: Task modal component is mutating a prop
      // and that causes issues. We need to not copy the prop similar to group modals
      if (this.task) {
        this.checklist = clone(this.task.checklist);
        this.taskValue = this.task.value;
        // Captured once per open so checklist rewards use the pre-edit completion state.
        if (!Array.isArray(this.task._checklistRewardSnapshot)) {
          const checklist = Array.isArray(this.task.checklist) ? this.task.checklist : [];
          this.$set(this.task, '_checklistRewardSnapshot', checklist.map(item => ({
            id: item.id,
            completed: Boolean(item.completed),
            value: item.value,
            scoredPriority: item.scoredPriority,
          })));
        }
      }
    },
  },
};
