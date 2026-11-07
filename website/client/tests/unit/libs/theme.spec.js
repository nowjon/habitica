import {
  describe, expect, test, beforeEach, afterEach,
} from 'vitest';
import axios from 'axios';
import Vue from 'vue';
import sinon from 'sinon';
import generateStore from '@/store';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  bindThemeToUser,
  getStoredTheme,
  isDarkTheme,
  persistTheme,
} from '@/libs/theme';

async function flush () {
  await Vue.nextTick();
  await Vue.nextTick();
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    if (axios.put && axios.put.restore) axios.put.restore();
  });

  test('saves the choice and applies it immediately', () => {
    persistTheme('dark');

    expect(getStoredTheme()).to.equal('dark');
    expect(isDarkTheme()).to.equal(true);
    expect(document.documentElement.style.colorScheme).to.equal('dark');

    persistTheme('light');

    expect(getStoredTheme()).to.equal('light');
    expect(isDarkTheme()).to.equal(false);
  });

  test('unknown values fall back to light', () => {
    applyTheme('blue');

    expect(document.documentElement.getAttribute('data-theme')).to.equal('light');
  });

  test('a saved account preference replaces the browser choice', async () => {
    persistTheme('light');
    const store = generateStore();
    const put = sinon.stub(axios, 'put').resolves({ data: { data: {} } });
    bindThemeToUser(store);

    store.state.user.loadingStatus = 'LOADED';
    store.state.user.data = {
      _id: 'user-1',
      preferences: { darkMode: 'dark' },
      tags: [],
    };
    await flush();

    expect(isDarkTheme()).to.equal(true);
    expect(getStoredTheme()).to.equal('dark');
    expect(put.called).to.equal(false);
  });

  test('the first browser choice is saved on the account', async () => {
    persistTheme('dark');
    const store = generateStore();
    const put = sinon.stub(axios, 'put').resolves({ data: { data: {} } });
    bindThemeToUser(store);

    store.state.user.loadingStatus = 'LOADED';
    store.state.user.data = {
      _id: 'user-2',
      preferences: {},
      tags: [],
    };
    await flush();

    expect(put.calledOnce).to.equal(true);
    expect(put.firstCall.args[0]).to.equal('/api/v4/user');
    expect(put.firstCall.args[1]).to.eql({ 'preferences.darkMode': 'dark' });
    expect(isDarkTheme()).to.equal(true);
  });
});
