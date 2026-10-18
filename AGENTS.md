
# Quality Engineering Challenge — Agent Instructions

## Architecture
- Monorepo organized by testing modality.
- API: Python, Pytest and Playwright.
- E2E: TypeScript, Cucumber.js and Playwright.
- Mobile: Python and Appium.
- Performance: k6.
- CI/CD: GitHub Actions.

## E2E conventions
- Use Gherkin for business scenarios.
- Keep UI interactions inside Page Objects.
- Keep step definitions thin and readable.
- Reuse the existing E2EWorld and hooks.
- Prefer semantic locators or stable data-test attributes.
- Never use fixed sleeps or arbitrary retries.
- Isolate browser state between scenarios.
- Preserve screenshots on failures.
- Do not hardcode private credentials.
- Never modify shared customer data unless explicitly required.

## Quality
- Do not weaken assertions to make tests pass.
- Do not mask failures with XFAIL or skip.
- Keep changes small and focused.
- Avoid unnecessary abstractions and dependencies.
- Preserve existing working tests.
- Explain architectural decisions and trade-offs.
- Report any unverified assumptions.

## Validation
- Run TypeScript type checking.
- Run the affected scenarios.
- Report passed, failed and skipped tests.
- Do not create commits unless requested.


## Test Environment Safety

- Public demo accounts are shared between users.
- Never repeatedly attempt invalid passwords on shared accounts.
- Authentication-negative scenarios must run only in an isolated environment.
- Prefer controlled test data and isolated environments.
- Never submit real payment information.
- Do not modify shared account profiles.
- Do not copy or redistribute third-party application source code.
- Verify UI selectors through source inspection or browser evidence.
- Report environmental failures separately from product defects.
