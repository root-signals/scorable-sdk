# Default target
all: update-readme ruff mypy test

pre-commit: update-readme mypy

# Note: These make targets also create/update venv if necessary.
#
# They also work from within venv as recursive venv is harmless.

# Python is left up to the caller (for GHA convenience)
PYTHON?=python3
IN_VENV=PATH=.venv/bin:$$PATH

.venv: .venv/bin/activate

.venv/bin/activate: pyproject.toml
	rm -rf .venv
	$(PYTHON) -m venv .venv
	$(IN_VENV) pip install uv
	$(IN_VENV) uv pip install '.[dev]'

mypy: .venv
	$(IN_VENV) mypy --follow-imports silent

# ruff is handled at top level
pre-commit: mypy

ruff: .venv
	$(IN_VENV) ruff check --fix --unsafe-fixes .
	$(IN_VENV) ruff format .

test: .venv
	$(IN_VENV) pytest

# readme is generated always, and if it changes, it is considered 'failure'
.PHONY: update-readme
update-readme: .venv
	$(IN_VENV) python3 examples.py --update-readme

# openapi code generation

openapi.yaml: Makefile
	curl -L http://localhost:8000/docs/download -o openapi.yaml

.PHONY: generate-openapi
generate-openapi:
	curl -L http://localhost:8000/docs/download -o openapi.yaml

.PHONY: openapi-unchanged
openapi-unchanged:
	curl -L http://localhost:8000/docs/download -o openapi.yaml.new
	diff -u openapi.yaml openapi.yaml.new || \
		( echo "OpenAPI has changed. Please run 'make generate-openapi generate' and commit the changes." && exit 1 )
	rm openapi.yaml.new

src/scorable/generated/__init__.py: openapi.yaml
	make generate-openapi-client

.PHONY: generate-openapi-client
generate-openapi-client:
	rm -rf src/scorable/generated
	rm -rf src/scorable/generated
	docker run --rm \
		-u $(shell id -u):$(shell id -g) \
		-v ${PWD}:/local openapitools/openapi-generator-cli:v7.4.0 \
		generate -i /local/openapi.yaml \
		-g python -o /local/src \
		--skip-validate-spec \
		--additional-properties=generateSourceCodeOnly=true,packageName=scorable.generated.openapi_client
	docker run --rm \
		-u $(shell id -u):$(shell id -g) \
		-v ${PWD}:/local openapitools/openapi-generator-cli:v7.4.0 \
		generate -i /local/openapi.yaml \
		-g python -o /local/src \
		--skip-validate-spec \
		--additional-properties=generateSourceCodeOnly=true,packageName=scorable.generated.openapi_aclient,library=asyncio

.PHONY: fix-openapi-client
fix-openapi-client:
	echo "Fixing sync client"
	echo "from .api_client import ApiClient" > src/scorable/generated/openapi_client/__init__.py
	echo > src/scorable/generated/openapi_client/api/__init__.py
	echo "Fixing async client"
	echo "from .api_client import ApiClient" > src/scorable/generated/openapi_aclient/__init__.py
	echo > src/scorable/generated/openapi_aclient/api/__init__.py
	make ruff || make ruff

# Some comments about ^: These 2 echo lines are necessary as by
# default __init__.py imports everything to the module, and this leads
# to crazily long import times for anything from the generated client.
#
# There's a ticket to fix this in upstream code: https://github.com/OpenAPITools/openapi-generator/issues/18144
#
# Unfortunately models/ wildcard importing is necessary, as deserializer imports classes from
# scorable.generated.openapi_client.models.
#
# About the additional-properties,
# c.f. https://openapi-generator.tech/docs/generators/python:
#
# generateSourceCodeOnly: just generate the library source code

# This target does not include generate-openapi, as that requires
# local instance to be available which is not guaranteed.
.PHONY: generate
generate: generate-openapi-client fix-openapi-client

# Convenience target to simulate run on ReadTheDocs
docs/.venv/bin/activate: docs/requirements.txt
	rm -rf docs/.venv
	$(PYTHON) -m venv docs/.venv
	cd docs && $(IN_VENV) pip install uv
	cd docs && $(IN_VENV) uv pip install -r requirements.txt

.PHONY: rtd-html
rtd-html: docs/.venv/bin/activate
	cd docs && $(IN_VENV) make html

# Actual release targets

dist: .venv Makefile README.md $(wildcard src/scorable/*.py)
	rm -rf dist
	$(IN_VENV) hatch build

# Push dist to main pypi repository
upload-main: dist
	$(IN_VENV) twine upload dist/*

# Push dist to test pypi repository
upload-test: dist
	$(IN_VENV) twine upload -r testpypi dist/*


