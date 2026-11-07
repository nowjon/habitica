import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parse } from 'vue/compiler-sfc';

describe('themeToggle', () => {
  test('keeps its script so the click handler is compiled', () => {
    const filename = path.resolve(__dirname, '../../../src/components/ui/themeToggle.vue');
    const source = fs.readFileSync(filename, 'utf8');
    const descriptor = parse({ source, filename });

    expect(descriptor.errors).to.deep.equal([]);
    expect(descriptor.script).to.not.equal(null);
    expect(descriptor.script.content).to.include('toggleDarkMode');
    expect(descriptor.script.content).to.include('darkModeMixin');
    expect(descriptor.template.content).to.include('top-menu-icon');
    expect(descriptor.template.content).to.include('<svg');
  });
});
