import { Page } from "@playwright/test";

export class PageObject {
  protected page: Page
  public name: string
  public pageUrl: string

  constructor(page: Page, name: string, url: string) {
    this.page = page;
    this.name = name;
    this.pageUrl = url;
  }

  get isOpen() {
    const { pathname } = new URL(this.page.url());

    return pathname === this.pageUrl;
  }
}
