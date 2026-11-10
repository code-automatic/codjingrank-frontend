export type EditorLanguage = "python" | "cpp" | "java" | "javascript" | "plain";

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "type"
  | "builtin"
  | "function"
  | "operator";

export type HighlightToken = {
  text: string;
  kind: TokenKind;
};

/**
 * Highlighting is intentionally local and dependency-free. Above this limit we
 * fall back to one plain token per line so a large paste cannot freeze typing.
 */
export const MAX_HIGHLIGHT_CHARS = 20_000;

const PYTHON_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "case",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "match",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "self",
  "try",
  "while",
  "with",
  "yield",
]);

const PYTHON_TYPES = new Set([
  "bool",
  "bytes",
  "dict",
  "float",
  "frozenset",
  "int",
  "list",
  "object",
  "set",
  "str",
  "tuple",
]);

const PYTHON_BUILTINS = new Set([
  "abs",
  "all",
  "any",
  "enumerate",
  "input",
  "isinstance",
  "len",
  "map",
  "max",
  "min",
  "open",
  "print",
  "range",
  "reversed",
  "round",
  "sorted",
  "sum",
  "zip",
]);

const CPP_KEYWORDS = new Set([
  "alignas",
  "alignof",
  "and",
  "and_eq",
  "asm",
  "auto",
  "bitand",
  "bitor",
  "break",
  "case",
  "catch",
  "class",
  "compl",
  "concept",
  "const",
  "consteval",
  "constexpr",
  "constinit",
  "const_cast",
  "continue",
  "co_await",
  "co_return",
  "co_yield",
  "decltype",
  "default",
  "delete",
  "do",
  "dynamic_cast",
  "else",
  "enum",
  "explicit",
  "export",
  "extern",
  "false",
  "for",
  "friend",
  "goto",
  "if",
  "inline",
  "mutable",
  "namespace",
  "new",
  "noexcept",
  "not",
  "not_eq",
  "nullptr",
  "operator",
  "or",
  "or_eq",
  "private",
  "protected",
  "public",
  "register",
  "reinterpret_cast",
  "requires",
  "return",
  "sizeof",
  "static",
  "static_assert",
  "static_cast",
  "struct",
  "switch",
  "template",
  "this",
  "thread_local",
  "throw",
  "true",
  "try",
  "typedef",
  "typeid",
  "typename",
  "union",
  "using",
  "virtual",
  "volatile",
  "while",
  "xor",
  "xor_eq",
]);

const CPP_TYPES = new Set([
  "bool",
  "char",
  "char16_t",
  "char32_t",
  "char8_t",
  "double",
  "float",
  "int",
  "int16_t",
  "int32_t",
  "int64_t",
  "int8_t",
  "long",
  "short",
  "signed",
  "size_t",
  "string",
  "uint16_t",
  "uint32_t",
  "uint64_t",
  "uint8_t",
  "unsigned",
  "vector",
  "void",
  "wchar_t",
]);

const CPP_BUILTINS = new Set([
  "cin",
  "cout",
  "cerr",
  "endl",
  "free",
  "getline",
  "malloc",
  "max",
  "min",
  "printf",
  "scanf",
  "sort",
  "std",
  "swap",
]);

const JAVA_KEYWORDS = new Set([
  "abstract",
  "assert",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "else",
  "enum",
  "extends",
  "false",
  "final",
  "finally",
  "for",
  "goto",
  "if",
  "implements",
  "import",
  "instanceof",
  "interface",
  "native",
  "new",
  "null",
  "package",
  "permits",
  "private",
  "protected",
  "public",
  "record",
  "return",
  "sealed",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "true",
  "try",
  "var",
  "void",
  "volatile",
  "while",
  "yield",
]);

const JAVA_TYPES = new Set([
  "ArrayList",
  "Boolean",
  "Character",
  "Double",
  "HashMap",
  "Integer",
  "List",
  "Long",
  "Map",
  "Math",
  "Object",
  "Scanner",
  "Set",
  "String",
  "System",
]);

const JAVA_BUILTINS = new Set([
  "length",
  "out",
  "print",
  "printf",
  "println",
  "size",
]);

const JAVASCRIPT_KEYWORDS = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

type Rule = {
  pattern: RegExp;
  kind: TokenKind;
  classify?: (word: string, rest: string) => TokenKind;
};

const IDENTIFIER_PATTERN = /[A-Za-z_$][A-Za-z0-9_$]*/y;
const NUMBER_PATTERN =
  /(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)[fFlLuU]*/y;
const OPERATOR_PATTERN = /[+\-*/%=<>!&|^~?:]+/y;

function identifierRule(
  keywords: Set<string>,
  types: Set<string>,
  builtins: Set<string>,
): Rule {
  return {
    pattern: IDENTIFIER_PATTERN,
    kind: "plain",
    classify(word, rest) {
      if (keywords.has(word)) return "keyword";
      if (types.has(word)) return "type";
      if (builtins.has(word)) return "builtin";
      if (/^\s*\(/.test(rest)) return "function";
      return "plain";
    },
  };
}

const PYTHON_RULES: Rule[] = [
  { pattern: /"""[\s\S]*?(?:"""|$)/y, kind: "string" },
  { pattern: /'''[\s\S]*?(?:'''|$)/y, kind: "string" },
  { pattern: /#[^\n]*/y, kind: "comment" },
  { pattern: /"(?:\\.|[^"\\\n])*"/y, kind: "string" },
  { pattern: /'(?:\\.|[^'\\\n])*'/y, kind: "string" },
  { pattern: NUMBER_PATTERN, kind: "number" },
  identifierRule(PYTHON_KEYWORDS, PYTHON_TYPES, PYTHON_BUILTINS),
  { pattern: OPERATOR_PATTERN, kind: "operator" },
];

const CPP_RULES: Rule[] = [
  { pattern: /\/\*[\s\S]*?(?:\*\/|$)/y, kind: "comment" },
  { pattern: /\/\/[^\n]*/y, kind: "comment" },
  { pattern: /"(?:\\.|[^"\\\n])*"/y, kind: "string" },
  { pattern: /'(?:\\.|[^'\\\n])*'/y, kind: "string" },
  { pattern: NUMBER_PATTERN, kind: "number" },
  identifierRule(CPP_KEYWORDS, CPP_TYPES, CPP_BUILTINS),
  { pattern: OPERATOR_PATTERN, kind: "operator" },
];

const JAVA_RULES: Rule[] = [
  { pattern: /"""[\s\S]*?(?:"""|$)/y, kind: "string" },
  { pattern: /\/\*[\s\S]*?(?:\*\/|$)/y, kind: "comment" },
  { pattern: /\/\/[^\n]*/y, kind: "comment" },
  { pattern: /"(?:\\.|[^"\\\n])*"/y, kind: "string" },
  { pattern: /'(?:\\.|[^'\\\n])*'/y, kind: "string" },
  { pattern: NUMBER_PATTERN, kind: "number" },
  identifierRule(JAVA_KEYWORDS, JAVA_TYPES, JAVA_BUILTINS),
  { pattern: OPERATOR_PATTERN, kind: "operator" },
];

const JAVASCRIPT_RULES: Rule[] = [
  { pattern: /\/\*[\s\S]*?(?:\*\/|$)/y, kind: "comment" },
  { pattern: /\/\/[^\n]*/y, kind: "comment" },
  { pattern: /`(?:\\.|[^`\\])*`/y, kind: "string" },
  { pattern: /"(?:\\.|[^"\\\n])*"/y, kind: "string" },
  { pattern: /'(?:\\.|[^'\\\n])*'/y, kind: "string" },
  { pattern: NUMBER_PATTERN, kind: "number" },
  identifierRule(JAVASCRIPT_KEYWORDS, new Set(), new Set()),
  { pattern: OPERATOR_PATTERN, kind: "operator" },
];

const RULES_BY_LANGUAGE: Record<Exclude<EditorLanguage, "plain">, Rule[]> = {
  python: PYTHON_RULES,
  cpp: CPP_RULES,
  java: JAVA_RULES,
  javascript: JAVASCRIPT_RULES,
};

/**
 * Maps a contract language slug (`python3`, `cpp`, `c++`, `java`, ...) to the
 * local highlighter. Unknown slugs stay readable as plain text.
 */
export function resolveEditorLanguage(slug: string): EditorLanguage {
  const normalized = slug.trim().toLowerCase();
  if (/^(py|python)/.test(normalized)) return "python";
  if (/(c\+\+|cpp|cxx|clang|gcc|g\+\+)/.test(normalized)) return "cpp";
  if (
    /(javascript|typescript|node)/.test(normalized) ||
    /^js$/.test(normalized) ||
    /^tsx?$/.test(normalized)
  )
    return "javascript";
  if (/^java/.test(normalized)) return "java";
  return "plain";
}

function scan(code: string, rules: Rule[]): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let plain = "";
  let index = 0;

  const flushPlain = () => {
    if (plain.length > 0) {
      tokens.push({ text: plain, kind: "plain" });
      plain = "";
    }
  };

  while (index < code.length) {
    let matched = false;
    for (const rule of rules) {
      rule.pattern.lastIndex = index;
      const match = rule.pattern.exec(code);
      if (!match || match.index !== index || match[0].length === 0) continue;

      flushPlain();
      const text = match[0];
      const end = index + text.length;
      const kind = rule.classify
        ? rule.classify(text, code.slice(end))
        : rule.kind;
      tokens.push({ text, kind });
      index = end;
      matched = true;
      break;
    }
    if (!matched) {
      plain += code[index];
      index += 1;
    }
  }

  flushPlain();
  return tokens;
}

/**
 * Tokenizes source into a flat, lossless token list. Joining every `text`
 * reproduces the input exactly; the comment/string rules consume delimiters so
 * a `#` or `//` inside a literal is never classified as a comment.
 */
export function highlightCode(
  code: string,
  language: EditorLanguage,
): HighlightToken[] {
  if (code.length === 0) return [];
  if (language === "plain" || code.length > MAX_HIGHLIGHT_CHARS) {
    return [{ text: code, kind: "plain" }];
  }
  return scan(code, RULES_BY_LANGUAGE[language]);
}

/**
 * Splits a lossless token stream into display lines. Tokens spanning newlines
 * (block comments, triple-quoted strings) are split while keeping their kind,
 * so gutter line numbers and the highlight layer stay aligned with the input.
 */
export function tokenizeLines(
  code: string,
  language: EditorLanguage,
): HighlightToken[][] {
  const lines: HighlightToken[][] = [[]];
  for (const token of highlightCode(code, language)) {
    const parts = token.text.split("\n");
    for (let i = 0; i < parts.length; i += 1) {
      if (i > 0) lines.push([]);
      if (parts[i].length > 0) {
        lines[lines.length - 1].push({ text: parts[i], kind: token.kind });
      }
    }
  }
  return lines;
}
