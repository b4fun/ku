all: help

##@ General

# The help target prints out all targets with their descriptions organized
# beneath their categories. The categories are represented by '##@' and the
# target descriptions by '##'. The awk commands is responsible for reading the
# entire set of makefiles included in this invocation, looking for lines of the
# file as xyz: ## something, and then pretty-format the target and help. Then,
# if there's a line with ##@ something, that gets pretty-printed as a category.
# More info on the usage of ANSI control characters for terminal formatting:
# https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_parameters
# More info on the awk command:
# http://linuxcommand.org/lc3_adv_awk.php

help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Release

release: build-frontend release-cli ## Build and relase the application.

build-frontend: ## Build frontend.
	npm run build

GO_BUILDER_VERSION ?= v1.19.0
GO_RELEASER_EXTRA_FLAGS ?=
GITHUB_ACTOR ?=

release-cli: ## Build and release the cli application.
	docker run --rm --privileged \
		-v $(CURDIR):/workspace \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v $(GOPATH)/src:/go/src \
		-w /workspace/server \
		-e "GITHUB_TOKEN=$(GITHUB_TOKEN)" \
		--entrypoint /bin/bash \
		ghcr.io/gythialy/golang-cross:$(GO_BUILDER_VERSION) \
		-c 'echo $$GITHUB_TOKEN | docker login -u $(GITHUB_ACTOR) --password-stdin ghcr.io && goreleaser --rm-dist $(GO_RELEASER_EXTRA_FLAGS)'

release-cli-snapshot: ## Build and release the cli application with snapshot mode
	GO_RELEASER_EXTRA_FLAGS="$(GO_RELEASER_EXTRA_FLAGS) --snapshot" make release-cli