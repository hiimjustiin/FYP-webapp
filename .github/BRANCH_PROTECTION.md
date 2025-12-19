# Branch Protection Rules

This document outlines recommended branch protection rules for the ILA Webapp repository to ensure code quality and prevent breaking changes.

## Protected Branches

The following branches should have protection rules enabled:

- `main` - Production branch
- `uat` - User Acceptance Testing branch
- `develop` - Development integration branch

## Recommended Protection Rules

### For `main` branch (Production)

**Required Status Checks:**

- [x] Require status checks to pass before merging
  - [x] `lint-and-typecheck` - ESLint and TypeScript checks
  - [x] `security-checks` - Dependency vulnerability scanning
  - [x] `backend-safety` - Backend-specific safety checks
- [x] Require branches to be up to date before merging

**Pull Request Requirements:**

- [x] Require pull request reviews before merging
  - Require 2 approvals from code owners
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from code owners
- [x] Require conversation resolution before merging

**Additional Rules:**

- [x] Require linear history (no merge commits)
- [x] Include administrators (enforce rules for admins too)
- [x] Restrict who can push to matching branches
  - Only allow merge via pull requests
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

### For `uat` branch (User Acceptance Testing)

**Required Status Checks:**

- [x] Require status checks to pass before merging
  - [x] `lint-and-typecheck` - ESLint and TypeScript checks
  - [x] `security-checks` - Dependency vulnerability scanning
  - [x] `backend-safety` - Backend-specific safety checks
- [x] Require branches to be up to date before merging

**Pull Request Requirements:**

- [x] Require pull request reviews before merging
  - Require 1 approval
  - Dismiss stale pull request approvals when new commits are pushed
- [x] Require conversation resolution before merging

**Additional Rules:**

- [x] Include administrators
- [x] Restrict who can push to matching branches
  - Only allow merge via pull requests
- [ ] Do not allow force pushes
- [ ] Do not allow deletions

### For `develop` branch (Development)

**Required Status Checks:**

- [x] Require status checks to pass before merging
  - [x] `lint-and-typecheck` - ESLint and TypeScript checks
- [x] Require branches to be up to date before merging

**Pull Request Requirements:**

- [x] Require pull request reviews before merging
  - Require 1 approval
- [ ] Require conversation resolution before merging (optional)

**Additional Rules:**

- [ ] Include administrators (allows admins to push directly for hotfixes)
- [x] Restrict who can push to matching branches
  - Only allow merge via pull requests

## Setting Up Branch Protection

### Via GitHub Web Interface

1. Go to **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Enter the branch name pattern (e.g., `main`, `uat`, `develop`)
4. Configure the settings according to the recommendations above
5. Click **Create** or **Save changes**

### Via GitHub CLI (gh)

```bash
# Example for main branch
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=lint-and-typecheck \
  --field required_status_checks[contexts][]=security-checks \
  --field required_status_checks[contexts][]=backend-safety \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field enforce_admins=true \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Merge Strategy

### Recommended Merge Flow

```
feature/branch → develop → uat → main
```

**Merging Rules:**

1. **Feature branches** → **develop**: Squash and merge (keeps history clean)
2. **develop** → **uat**: Create release PR, merge commit (preserves commit history)
3. **uat** → **main**: Merge commit after UAT approval (preserves testing history)

### Hotfix Flow

For urgent production fixes:

```
hotfix/branch → main (and also → develop, uat to sync)
```

1. Create `hotfix/description` branch from `main`
2. Fix and test thoroughly
3. Create PR to `main` with expedited review
4. After merging to `main`, cherry-pick or merge to `uat` and `develop`

## Automated Safety Checks

The following checks run automatically on every PR:

### 1. Lint & Type Check Job

- **Frontend ESLint** - Code style and potential bugs
- **Frontend TypeScript** - Type safety validation
- **Backend TypeScript** - API type safety validation
- **Critical TODOs** - Prevents merging code with critical markers
- **package.json validation** - Ensures valid JSON structure

### 2. Security Checks Job

- **Dependency vulnerabilities** - Scans for known security issues
- **Outdated dependencies** - Flags packages needing updates

### 3. Backend Safety Job

- **Migration validation** - Ensures migrations follow conventions
- **console.log detection** - Warns about debug statements in production code

## Local Development Commands

Run these commands locally before pushing to catch issues early:

```bash
# Frontend checks
bun lint                    # Run ESLint
bun typecheck              # Run TypeScript type checking
bun typecheck:watch        # Watch mode for type checking
bun build                  # Full build test

# Backend checks
cd backend
bun typecheck              # Run TypeScript type checking for backend
bun typecheck:watch        # Watch mode for backend type checking
bun build                  # Compile TypeScript

# Combined check before committing
bun lint && bun typecheck && cd backend && bun typecheck
```

## Code Review Checklist

Before approving a PR, reviewers should verify:

- [ ] All CI checks pass (green status)
- [ ] Code follows project conventions and style guide
- [ ] No console.log statements in production code
- [ ] TypeScript types are properly defined (no `any` abuse)
- [ ] Database migrations are properly structured with up/down functions
- [ ] New dependencies are justified and documented
- [ ] Security implications have been considered
- [ ] Tests cover new functionality (when applicable)
- [ ] Documentation is updated if needed
- [ ] No sensitive data (API keys, passwords) in code

## Emergency Override

In case of critical production issues where branch protection prevents urgent fixes:

1. **Document the reason** - Create an incident report
2. **Get approval** - Contact repository administrators
3. **Temporary disable** - Admin can temporarily disable protection
4. **Push fix** - Deploy the critical fix
5. **Re-enable protection** - Immediately restore branch protection
6. **Create follow-up PR** - Document what was done and why
7. **Post-mortem** - Review why the emergency override was needed

## Questions?

Contact the DevOps team or repository administrators for:

- Branch protection rule changes
- Emergency access requests
- CI/CD workflow modifications
- Security policy questions
