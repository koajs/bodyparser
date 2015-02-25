TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 3000
MOCHA_OPTS =

install:
	@npm install

test:
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--harmony \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@NODE_ENV=test node --harmony \
		node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		$(TESTS)

test-travis:
	@NODE_ENV=test node --harmony \
		node_modules/.bin/istanbul cover ./node_modules/.bin/_mocha \
		--report lcovonly \
		-- -u exports \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		--require should \
		$(MOCHA_OPTS) \
		$(TESTS)

autod:
	@./node_modules/.bin/autod -w \
		-e example.js \
		-f "~" \
		-k supertest \
		-D mocha,should,istanbul-harmony
	@$(MAKE) install

.PHONY: test
