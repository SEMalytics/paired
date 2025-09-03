# PAIRED Deployment Guide

## Overview

The PAIRED platform uses a templatized deployment system that supports multiple target environments with different configurations. This guide explains how to deploy PAIRED to development, production, and public repositories.

## Quick Start

```bash
# Deploy to development (default)
./scripts/deploy-template.sh development

# Preview production deployment
./scripts/deploy-template.sh production --dry-run

# Force deploy to public repository
./scripts/deploy-template.sh public --force
```

## Deployment Environments

### Development (`development`)
- **Repository:** `SEMalytics/paired-dev`
- **Purpose:** Active development and testing
- **Includes:** All files including development docs and tests
- **Auto-deploy:** Yes (no confirmation required)

### Production (`production`)
- **Repository:** `internexio/paired`
- **Purpose:** Enterprise production deployment
- **Includes:** Essential files only, sanitized for production
- **Auto-deploy:** No (requires confirmation)

### Public (`public`)
- **Repository:** `SEMalytics/paired`
- **Purpose:** Public release of PAIRED platform
- **Includes:** User-facing files only, fully sanitized
- **Auto-deploy:** No (requires confirmation)

## Configuration

Deployment configurations are defined in `templates/deployment-config.yml`. This file controls:

- Repository URLs and branches
- File inclusion rules
- Sanitization settings
- Auto-deployment behavior
- Validation requirements

### Adding New Environments

To add a new deployment environment:

1. Edit `templates/deployment-config.yml`
2. Add new environment under `deployment_environments:`
3. Define repository, branch, and inclusion rules
4. Test with `--dry-run` flag

Example:
```yaml
deployment_environments:
  staging:
    name: "Staging"
    repository: "https://github.com/company/paired-staging.git"
    branch: "main"
    description: "Staging environment for testing"
    auto_deploy: false
    include_dev_docs: true
    include_test_files: true
```

## Command Line Options

### Basic Usage
```bash
./scripts/deploy-template.sh <environment> [options]
```

### Options

- `-d, --dry-run` - Preview deployment without executing
- `-f, --force` - Skip confirmation prompts
- `-v, --verbose` - Enable detailed output
- `-c, --config FILE` - Use custom configuration file
- `-h, --help` - Show help message

### Examples

```bash
# Preview what would be deployed to production
./scripts/deploy-template.sh production --dry-run

# Deploy to development with verbose output
./scripts/deploy-template.sh development --verbose

# Force deploy to production (skip confirmation)
./scripts/deploy-template.sh production --force

# Use custom configuration file
./scripts/deploy-template.sh staging --config custom-deploy.yml
```

## File Inclusion Rules

### Always Included (Essential Core)
- `README.md`
- `LICENSE`
- `install.sh`
- `bin/paired`
- `src/` directory (all source code)
- `templates/` directory

### Conditionally Included

**Development Extras** (when `include_dev_docs: true`):
- `docs/development/`
- `test/`
- `scripts/dev-*`
- `planning/`

**Production Essentials** (production environments):
- `docs/user-guide/`
- `docs/installation/`
- `scripts/deploy-*`
- `scripts/paired-doctor.sh`

## Sanitization

Production deployments automatically sanitize files by:

- Removing debug statements (`console.log`, `debugger`)
- Replacing hardcoded paths with environment variables
- Removing TODO/FIXME comments
- Cleaning up development artifacts

Sanitization is controlled by the `sanitize_sensitive_data` flag in the configuration.

## Security Considerations

### Sensitive Data
- API keys and secrets are replaced with environment variable placeholders
- Hardcoded paths are converted to portable formats
- Development-specific information is filtered out

### Repository Access
- Production deployments require appropriate repository permissions
- Use SSH keys or personal access tokens for authentication
- Test access with `git ls-remote <repository-url>` before deployment

## Validation and Testing

### Pre-deployment Validation
The deployment script can run validation checks:
- `npm test` - Run test suite
- `scripts/validate-agents.sh` - Validate agent functionality
- `paired-doctor` - System health check

### Post-deployment Verification
After deployment, verify:
1. Repository contains expected files
2. Installation script works on clean system
3. Core functionality operates correctly

## Troubleshooting

### Common Issues

**Permission Denied**
```bash
chmod +x scripts/deploy-template.sh
```

**Repository Access Failed**
- Verify repository URL is correct
- Check authentication credentials
- Ensure repository exists and is accessible

**Configuration Parse Error**
- Validate YAML syntax in `deployment-config.yml`
- Check environment name exists in configuration
- Verify all required fields are present

**Missing Dependencies**
- Install Python 3 and PyYAML: `pip3 install pyyaml`
- Ensure git is installed and configured

### Debug Mode
Run with verbose flag to see detailed execution:
```bash
./scripts/deploy-template.sh development --verbose --dry-run
```

## Best Practices

### Before Deployment
1. **Test locally** - Ensure all functionality works
2. **Run validation** - Execute test suites and health checks
3. **Review changes** - Use `--dry-run` to preview deployment
4. **Check configuration** - Verify target repository and settings

### During Deployment
1. **Monitor output** - Watch for errors or warnings
2. **Verify completion** - Ensure deployment finishes successfully
3. **Check repository** - Confirm files are present in target repo

### After Deployment
1. **Test installation** - Verify install script works on clean system
2. **Validate functionality** - Run basic functionality tests
3. **Update documentation** - Keep deployment records current
4. **Notify team** - Inform stakeholders of successful deployment

## Integration with CI/CD

The deployment script can be integrated into continuous integration pipelines:

```yaml
# GitHub Actions example
- name: Deploy to Development
  run: ./scripts/deploy-template.sh development --force
  if: github.ref == 'refs/heads/main'

- name: Deploy to Production
  run: ./scripts/deploy-template.sh production --force
  if: startsWith(github.ref, 'refs/tags/v')
```

## Support

For deployment issues:
1. Check this documentation
2. Run with `--dry-run` and `--verbose` flags
3. Verify configuration file syntax
4. Test repository access manually
5. Contact the PAIRED development team

---

*This deployment system is designed to be flexible, secure, and reliable. Always test deployments in development environments before deploying to production.*
