try {
  if (localStorage.getItem('habitica-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }
} catch (e) {
  // localStorage can throw in private browsing.
}
