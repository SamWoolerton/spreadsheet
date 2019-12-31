# Spreadsheet

Uses Parsimmon for parser combinator library, and builds a DAG to make computations more efficient.
Features syntax highlighting, autocomplete, and basic type hinting for functions.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

## Run tests

```
node -r esm tests/parser/test_eval
node -r esm tests/parser/test_ast
node -r esm tests/parser/test_regen
```
