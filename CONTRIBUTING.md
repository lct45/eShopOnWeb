# Contributing to NimblePros/eShopOnWeb

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

## We Develop with GitHub

Obviously... 😁

## We Use Pull Requests

Mostly. But pretty much exclusively for non-maintainers. You'll need to fork the repo in order to submit a pull request. Here are the basic steps:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Next.js migration PRs (LCFM)

Migration work is tracked in the [LCFM Jira project](https://fe-anysphere-demo.atlassian.net/browse/LCFM-1). For those PRs:

1. Use the GitHub pull request template (`.github/pull_request_template.md`).
2. Link the `LCFM-*` ticket and name the stage from `docs/migration-stage-gates.md`. The ticket map is in `docs/dotnet-to-nextjs-migration.md`.
3. Land tests in the same PR as the behavior change.
4. Expect Cursor Bugbot to review the diff against `.cursor/BUGBOT.md` (and nested rules under `domain/`, `data/`, and `auth/`). Bugbot does not run the test suite; CI does.
5. For Next.js work under `src/Web.Next`, run `npm ci` then `npm run verify:ci` (see `src/Web.Next/docs/ci.md`). The Web.Next GitHub Actions workflow (LCFM-25) mirrors those gates; the .NET workflow remains until cutover.


- [Pull Request Check List](https://ardalis.com/github-pull-request-checklist/)
- [Resync your fork with this upstream repo](https://ardalis.com/syncing-a-fork-of-a-github-repository-with-upstream/)

## Ask before adding a pull request

You can just add a pull request out of the blue if you want, but it's much better etiquette (and more likely to be accepted) if you open a new issue or comment in an existing issue stating you'd like to make a pull request.

## Getting Started

Look for [issues marked with 'help wanted'](https://github.com/NimblePros/eShopOnWeb/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) to find good places to start contributing.

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers this project.

## Report bugs using Github's [issues](https://github.com/NimblePros/eShopOnWeb/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/NimblePros/eShopOnWeb/issues/new/choose); it's that easy!
