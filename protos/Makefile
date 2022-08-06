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

##@ Build

generate: generate-proto generate-js ## Generate everything

lint-proto: buf ## Run lint against protobuf.
	@export PATH=$(shell pwd)/bin:$(PATH)
	$(BUF) lint

generate-proto: buf lint-proto ## Generate protobuf code.
	@export PATH=$(shell pwd)/bin:$(PATH)
	$(BUF) generate

generate-js:  ## Generate js from ts
	npm run build

##@ Tools

BUF = $(shell pwd)/bin/buf
BUF_VERSION ?= "v1.7.0"
PROTOC_GEN_GO_VERSION ?= "v1.28.1"
PROTOC_GEN_GO_GRPC_VERSION ?= "v1.2.0"
buf: ## Download buf locally if necessary.
	$(call go-get-tool,$(BUF),github.com/bufbuild/buf/cmd/buf@${BUF_VERSION})
	$(call go-get-tool,$(shell pwd)/bin/protoc-gen-buf-breaking,github.com/bufbuild/buf/cmd/protoc-gen-buf-breaking@${BUF_VERSION})
	$(call go-get-tool,$(shell pwd)/bin/protoc-gen-buf-lint,github.com/bufbuild/buf/cmd/protoc-gen-buf-lint@${BUF_VERSION})
	$(call go-get-tool,$(shell pwd)/bin/protoc-gen-go,google.golang.org/protobuf/cmd/protoc-gen-go@${PROTOC_GEN_GO_VERSION})
	$(call go-get-tool,$(shell pwd)/bin/protoc-gen-go-grpc,google.golang.org/grpc/cmd/protoc-gen-go-grpc@${PROTOC_GEN_GO_GRPC_VERSION})


# go-get-tool will 'go get' any package $2 and install it to $1.
PROJECT_DIR := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))
define go-get-tool
@[ -f $(1) ] || { \
	set -e ;\
	TMP_DIR=$$(mktemp -d) ;\
	cd $$TMP_DIR ;\
	go mod init tmp ;\
	echo "Downloading $(2)" ;\
	GOBIN=$(PROJECT_DIR)/bin go install $(2) ;\
	rm -rf $$TMP_DIR ;\
}
endef