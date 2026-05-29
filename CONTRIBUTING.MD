# Contributing to Greem

Thank you for contributing to Greem.

Before creating an issue or pull request, please read these guidelines to help keep the project maintainable and easy to review.

---

# Getting Started

Follow the setup instructions in the README:

```bash
npm install
npx drizzle-kit push
npm run dev
```

Make sure the application starts successfully before making changes.

---

# Branch Naming Convention

Use descriptive branch names.

## New Features

```txt
feature/add-user-search
feature/leaderboard-pagination
feature/profile-settings
```

## Bug Fixes

```txt
fix/comment-deletion
fix/feed-pagination
fix/leaderboard-ranking
```

## Documentation

```txt
docs/update-readme
docs/add-api-notes
```

## Refactoring

```txt
refactor/feed-hooks
refactor/leaderboard-service
```

Avoid generic branch names such as:

```txt
test
new
changes
update
final
branch-1
```

---

# Pull Request Guidelines

Keep pull requests focused on a single logical change.

Good examples:

* Add profile image upload support
* Fix leaderboard ranking calculation
* Improve feed pagination performance

Bad examples:

* Fix comments
* Redesign profile page
* Update leaderboard
* Random cleanup + new feature + bug fix

Smaller pull requests are significantly easier to review and merge.

---

# Before Opening a Pull Request

Run:

```bash
npm run lint
npm run typecheck
```

Verify:

* Application builds successfully
* No TypeScript errors exist
* No linting errors exist
* No secrets are committed
* No unnecessary files are included

---

# What Contributions Are Accepted

## Accepted

* Bug fixes
* Performance improvements
* Documentation improvements
* Accessibility improvements
* UI/UX improvements
* Code quality improvements
* New features aligned with the project's goals
* Redis and leaderboard-related improvements

## Usually Not Accepted

* Large framework migrations
* Complete application rewrites
* Unrelated features
* Breaking changes without discussion
* Massive dependency additions for small problems
* Formatting-only pull requests touching many files

If you're planning a major change, open an issue first.

---

# UI Guidelines

Before creating new components:

* Check existing components first
* Reuse shared UI primitives when possible
* Follow the current design patterns
* Maintain consistency with the rest of the application

Avoid introducing multiple styles for solving the same UI problem.

---

# Database Changes

When modifying the database schema:

1. Update the schema.
2. Run:

```bash
npx drizzle-kit push
```

3. Verify the application still works.
4. Mention the schema change in your pull request.

Schema-related pull requests should clearly explain:

* What changed
* Why it changed
* Any migration or setup requirements

---

# Code Style

General expectations:

* Prefer readable code over clever code.
* Keep functions focused and small.
* Use descriptive variable names.
* Remove dead code when possible.
* Avoid unnecessary abstractions.
* Follow the existing project structure.

Consistency is usually more important than personal preference.

---

# Documentation

Update documentation when:

* Setup instructions change
* New environment variables are introduced
* New features affect developer workflows
* Database requirements change

Documentation changes do not need to be extensive, but they should remain accurate.

---

# Pull Request Checklist

Before submitting:

* [ ] Branch follows naming conventions
* [ ] Lint passes
* [ ] Typecheck passes
* [ ] Application runs successfully
* [ ] Documentation updated if necessary
* [ ] Pull request focuses on one logical change
* [ ] Screenshots included for UI changes

---

# Reporting Issues

When reporting bugs, include:

* Expected behavior
* Actual behavior
* Steps to reproduce
* Screenshots if applicable
* Relevant error messages

Well-structured bug reports are much easier to investigate.

---

# Questions

If you're unsure whether a change fits the project, open an issue or discussion before investing significant development time.

Thanks for contributing to Greem.
