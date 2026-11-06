import {
  generateUser,
} from '../../../../helpers/api-integration/v3';

describe('PUT /tags/:tagId', () => {
  let user;

  before(async () => {
    user = await generateUser();
  });

  it('updates a tag given it\'s id', async () => {
    const updatedTagName = 'Tag updated';
    let createdTag = await user.post('/tags', { name: 'Tag 1' });
    const updatedTag = await user.put(`/tags/${createdTag.id}`, {
      name: updatedTagName,
      ignored: true,
    });

    createdTag = await user.get(`/tags/${updatedTag.id}`);

    expect(updatedTag.name).to.equal(updatedTagName);
    expect(updatedTag.ignored).to.not.exist;

    expect(createdTag.name).to.equal(updatedTagName);
    expect(createdTag.ignored).to.not.exist;
  });

  it('updates outline color and width for a tag', async () => {
    const createdTag = await user.post('/tags', { name: 'Outlined Tag' });
    const updatedTag = await user.put(`/tags/${createdTag.id}`, {
      outlineColor: '#FF5500',
      outlineWidth: 3,
    });

    expect(updatedTag.outlineColor).to.equal('#FF5500');
    expect(updatedTag.outlineWidth).to.equal(3);

    const fetchedTag = await user.get(`/tags/${createdTag.id}`);
    expect(fetchedTag.outlineColor).to.equal('#FF5500');
    expect(fetchedTag.outlineWidth).to.equal(3);
  });
});
