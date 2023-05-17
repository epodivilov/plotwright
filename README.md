# Plotwright

Plotwright is a meta-framework for end-to-end testing, built on top of Mountebank and Playwright. It simplifies the process of setting up, configuring, and running tests, while providing a more convenient API and offering base classes for PageObjects and PageElements. The goal of Plotwright is to help developers write clear, readable, and maintainable tests with ease.

The name "Plotwright" is a combination of the words "plot" and "wright." A plot refers to a story or sequence of events, which can be seen as a metaphor for a test scenario. A wright, on the other hand, is a worker or craftsman, such as a playwright who crafts stories for the stage. In this context, Plotwright can be understood as a tool that helps developers craft their test scenarios.

## Features

- Simplified configuration and setup for Mountebank and Playwright
- Base classes for PageObjects and PageElements
- Easy-to-use API for writing and organizing tests
- Pre-configured templates and examples to kickstart your testing journey

## Getting Started

### Prerequisites

- Ensure that your Backends for Frontends (BFF) service can propagate the `X-Request-ID` header. This is required for the `plotwright` framework to correctly handle requests and responses.

### Installation

1. Install the `plotwright` package:

```bash
npm install plotwright
```

### Configuration

Create a plotwright.config.js file in the root of your project. This file will be used to configure plotwright to fit your needs.

```javascript
// plotwright.config.ts
const {} = require("plotwright");

module.exports = makeConfig({
  mountebanks: {
    // mountebanks options
  },
  playwright: {
    // playwright options
  },
});
```

### Running Tests

Run your tests with the following command:

```bash
npx plotwright test
```

This will run your tests using the configuration specified in plotwright.config.ts. If the test run completes successfully, a report will be generated.

