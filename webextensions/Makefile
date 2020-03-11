NPM_MOD_DIR := $(CURDIR)/node_modules
NPM_BIN_DIR := $(NPM_MOD_DIR)/.bin

.PHONY: xpi install_dependency install_hook lint format

all: xpi

install_dependency:
	[ -e "$(NPM_BIN_DIR)/eslint" -a -e "$(NPM_BIN_DIR)/jsonlint-cli" ] || npm install

install_hook:
	echo '#!/bin/sh\nmake lint' > "$(CURDIR)/.git/hooks/pre-commit" && chmod +x "$(CURDIR)/.git/hooks/pre-commit"

lint: install_dependency
	"$(NPM_BIN_DIR)/eslint" . --ext=.js --report-unused-disable-directives
	find . -type d -name node_modules -prune -o -type f -name '*.json' -print | xargs "$(NPM_BIN_DIR)/jsonlint-cli"

format: install_dependency
	"$(NPM_BIN_DIR)/eslint" . --ext=.js --report-unused-disable-directives --fix

xpi: lint
	rm -f ./*.xpi
	zip -r -9 xulmigemo-we.xpi manifest.json background -x '*/.*' >/dev/null 2>/dev/null
