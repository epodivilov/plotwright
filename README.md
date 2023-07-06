# Plotwright

Plotwright is a practical testing framework that combines the capabilities of Playwright and Mountebank. It allows you to test not only the client side of the application, but also the interaction with the server, substituting API responses according to the contract we need.

## How Plotwright can be useful

- **Simplicity**: Plotwright simplifies the testing process by eliminating the need for complex preparatory work such as deploying APIs, Docker, and other infrastructure.
- **Isolation**: The framework allows you to isolate tests from each other, making the testing process more stable and predictable.
- **Flexibility**: Plotwright allows you to substitute API responses with those you need in your tests. You can easily simulate errors, broken data, empty data, and anything else to test how the UI behaves in such cases.

## Differences from other products

- **Isolation**: Plotwright allows you to fully isolate tests from each other, providing more stable and reliable results.
- **Testing not only the client side**: Unlike Playwright, Plotwright allows you to test not only the client side, but also the BFF (Back-end for Front-end) of your application.
- **Language independence**: Plotwright allows you to test your application regardless of the language used on the client side or on the BFF.
- **Simplification of the testing process**: Unlike regular Playwright and headless Chrome tools, Plotwright simplifies the testing process by providing a convenient API and automating many routine tasks.
- **API response substitution**: Plotwright allows you to substitute API responses with those you need in specific tests, allowing you to simulate various scenarios and conditions.

## Get started

1. Install Plotwright using npm: `npm install plotwright`
2. Create a minimal configuration file: `npx plotwright init`
3. Specify in the file the path to your e2e tests and to the substituted APIs:
  ```javascript
  /**
   * plotwright.config.js
   * @type {import('plotwright').Configuration}
   */
  module.exports = {
    playwright: {
      testDir: "./e2e/specs",
    },
    mountebank: {
      imposters: ["./e2e/imposters/stub-api."],
    },
  };
  ```

5. Create a test scenario file:
  ```javascript
  // ./e2e/specs/example.spec.js
  import { test, describe, expect, step } from "plotwright";
  
  describe("Test suite", () => {
    test("Test example page", async ({ page, useStubs }) => {
      await useStubs([import("./_stubs_/success-response-api.json")]);
  
      await page.goto("https://example.com");
  
      await step("Check page title", async () => {
        const title = await page.title();
        expect(title).toBe("Example Domain");
      });
  
      await step("Check page has button 'Submit'", async () => {
        await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
      });
    });
  });
  ```

7. Run the test using the command `npx plotwright test`.

