import type { Page } from "@playwright/test";

export class PageObject {
  protected page: Page;
  protected name: string;

  url: string;

  constructor(page: Page, name: string, url: string) {
    this.page = page;
    this.name = name;
    this.url = url;
  }
}

