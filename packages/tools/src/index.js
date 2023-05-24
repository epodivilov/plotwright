class PageObject {
  /**
   * 
   * @param {import('@playwright/test').Page} page 
   * @param {string} name 
   * @param {string} url 
   */
  constructor(page, name, url) {
      this.page = page;
      this.name = name;
      this.pageUrl = url;
  }

  get isOpen() {
      const { pathname } = new URL(this.page.url());

      return pathname === this.pageUrl;
  }
}

module.exports = { PageObject }