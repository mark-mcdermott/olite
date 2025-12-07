# Development Workflow Shortcuts

These shortcuts allow you to quickly invoke development workflows by typing simple keywords. They work across all LLM coding assistants, regardless of whether the assistant supports formal commands or agents.

## Available Shortcuts

### Planning Phase

**`qnew`** - Planning and Approach
See @.llm/llm/workflows/planning.md
Understand best practices and create implementation plan.

**`qplan`** - Plan Validation
See @.llm/llm/workflows/validation.md
Analyze codebase consistency and validate plan against existing patterns.

### Implementation Phase

**`qcode`** - Implementation with Testing
See @.llm/llm/workflows/implementation.md
Implement plan with TDD, run tests, and enforce linting.

### Review Phase

**`qcheck`** - Comprehensive Code Review
See @.llm/llm/workflows/review.md
Perform thorough analysis covering functions, tests, and architecture.

**`qcheckf`** - Function-Specific Review
See @.llm/llm/workflows/review-functions.md
Focus on function/method quality using evaluation checklist.

**`qcheckt`** - Test-Specific Review
See @.llm/llm/workflows/review-tests.md
Focus on test quality using test evaluation checklist.

**`qux`** - UX Testing Scenarios
See @.llm/llm/workflows/ux-testing.md
Generate comprehensive UX testing scenarios.

### Documentation

**`qdoc`** - Add Documentation
See @.llm/llm/workflows/documentation.md
Add meaningful documentation to code files.

### Testing

**`qtest`** - Test Writing (Ruby and JavaScript)
See @.llm/llm/workflows/test-writing.md
Write tests following TDD principles for either Ruby or JavaScript.

**`qtest-ruby`** - Ruby Test Writing
See @.llm/llm/workflows/test-writing-ruby.md
Write RSpec tests with FactoryBot following Ruby testing best practices.

**`qtest-js`** - JavaScript Test Writing
See @.llm/llm/workflows/test-writing-javascript.md
Write Vitest tests with Vue Test Utils following JavaScript testing best practices.

### Git Operations

**`qgit`** - Git Workflow
See @.llm/llm/workflows/git-workflow.md
Commit and push changes with proper commit message formatting.

**`pr`** - Pull Request Generation
See @.llm/llm/commands/pr.md
Generate pull request name and description, open for editing, and create the PR.

## How Shortcuts Work

Shortcuts are simple keywords that:
1. Load the relevant workflow documentation
2. Set the context for the current development phase
3. Guide the LLM to follow established patterns and practices

They provide a consistent interface regardless of which LLM tool you're using (Claude Code, Cursor, Copilot, etc.).
