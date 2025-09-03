#!/bin/bash
# Environment switcher for VectorSEM
# Usage: source .paired/scripts/set-env.sh [dev|test|prod]

set -e

# Get the directory of this script
if [[ -n "${BASH_SOURCE[0]}" ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    # Fallback for when script is sourced differently
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

# Get project root (parent of .paired directory)
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Debug output
echo "🔍 Script directory: $SCRIPT_DIR"
echo "🔍 Project root: $PROJECT_ROOT"

ENV_TYPE=${1:-dev}

case "$ENV_TYPE" in
    dev)
        ENV_FILE="$PROJECT_ROOT/.env.dev"
        echo "🔧 Setting up DEVELOPMENT environment (MacBook - no model loading)"
        ;;
    test)
        ENV_FILE="$PROJECT_ROOT/.env.test"
        echo "🧪 Setting up TEST environment (Desktop - with model loading)"
        ;;
    prod)
        ENV_FILE="$PROJECT_ROOT/.env.prod"
        echo "🚀 Setting up PRODUCTION environment"
        ;;
    *)
        echo "❌ Invalid environment: $ENV_TYPE"
        echo "Usage: source .paired/scripts/set-env.sh [dev|test|prod]"
        return 1
        ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file not found: $ENV_FILE"
    return 1
fi

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Set additional environment variables
export VECTORSEM_ENV="$ENV_TYPE"
export VECTORSEM_PROJECT_ROOT="$PROJECT_ROOT"

echo "✅ Environment loaded: $ENV_TYPE"
echo "📍 Project root: $PROJECT_ROOT"
echo "🔧 Environment file: $ENV_FILE"

# Show key environment variables
echo ""
echo "🔍 Key Environment Variables:"
echo "VECTORSEM_ENV: ${VECTORSEM_ENV}"
echo "VECTORSEM_PRELOAD_MODEL: ${VECTORSEM_PRELOAD_MODEL:-Not set}"
echo "VECTORSEM_MODEL_PATH: ${VECTORSEM_MODEL_PATH:-Not set}"
echo "VECTORSEM_PROJECT_ROOT: ${VECTORSEM_PROJECT_ROOT}"

# Additional environment-specific setup
case "$ENV_TYPE" in
    dev)
        echo "💻 Development mode: Model preloading disabled for faster startup"
        ;;
    test)
        echo "🖥️  Test mode: Model preloading enabled for full testing"
        ;;
    prod)
        echo "🚀 Production mode: Full optimization enabled"
        ;;
esac

echo ""
echo "💡 Tip: Use 'vstatus' alias to check current environment status"
