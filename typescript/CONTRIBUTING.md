# Contributing to Scorable TypeScript SDK

Thank you for contributing to Scorable TypeScript SDK! 🙏

We appreciate all contributions, whether you're fixing bugs, adding new features, improving documentation, or helping other users.

## Why Contribute?

You might want to contribute to Scorable TypeScript SDK for several reasons:

- **Fix a bug** you encountered
- **Add a new feature** that would be useful for your use case
- **Improve documentation** to help other developers
- **Add new evaluators or metrics** to expand the library's capabilities
- **Optimize performance** or improve code quality

## Getting Started

1. **Fork the repository** and clone your fork
2. **Install dependencies**: `npm install`
3. **Set up your API key**: `export SCORABLE_API_KEY="your-key"`
4. **Run tests**: `npm test`
5. **Build the project**: `npm run build`

## Guidelines

When contributing, please:

- **Follow existing patterns** in the codebase
- **Look at similar modules** for examples of structure and implementation
- **Reuse existing utilities** and helper functions where possible
- **Write tests** for new functionality
- **Add documentation** for new features
- **Run the linter**: `npm run lint:fix`
- **Format your code**: `npm run format`

## Code Style

We use ESLint and Prettier to maintain consistent code style. Run `npm run fix-all` to automatically fix most issues.

## Testing

- Add tests for new features in the `tests/` directory
- Run `npm test` to execute all tests
- Integration tests require a valid API key

