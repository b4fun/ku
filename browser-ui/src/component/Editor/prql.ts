const configuration = {
  comments: {
    lineComment: "#",
  },
  // symbols used as brackets
  brackets: [
    ["[", "]"],
    ["(", ")"],
  ],
  // symbols that are auto closed when typing
  autoClosingPairs: [
    {
      open: "[",
      close: "]",
    },
    {
      open: "(",
      close: ")",
    },
    {
      open: '"',
      close: '"',
    },
    {
      open: "'",
      close: "'",
    },
  ],
  // symbols that can be used to surround a selection
  surroundingPairs: [
    {
      open: "[",
      close: "]",
    },
    {
      open: "(",
      close: ")",
    },
    {
      open: '"',
      close: '"',
    },
    {
      open: "'",
      close: "'",
    },
  ],
};

const grammars = {
  $schema:
    "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  name: "PRQL",
  patterns: [
    {
      include: "#comment",
    },
    {
      include: "#keywords",
    },
    {
      include: "#named-args",
    },
    {
      include: "#assigns",
    },
    {
      include: "#function-call",
    },
    {
      include: "#type-def",
    },
    {
      include: "#interpolation-strings",
    },
    {
      include: "#strings",
    },
    {
      include: "#ident",
    },
  ],
  repository: {
    comment: {
      name: "comment.line",
      match: "#.*$",
    },
    keywords: {
      patterns: [
        {
          name: "keyword.control.prql",
          match:
            "\\b(from|select|derive|filter|take|sort|join|aggregate|group|func|table|and|or|not|null|true|false)\\b",
        },
      ],
    },
    "named-args": {
      match: "(\\w+)\\s*:",
      captures: {
        "1": { name: "entity.name.tag" },
      },
    },
    assigns: {
      match: "(\\w+)\\s*=(?!=)",
      captures: {
        "1": { name: "variable.name" },
      },
    },
    "function-call": {
      match: "\\b(\\w+)\\b(\\s+(\\w|[.])+)+(\\s|$|,|]|\\))",
      captures: {
        "1": {
          name: "support.function",
        },
        "2": {
          name: "variable.parameter",
        },
      },
    },
    "type-def": {
      name: "support.type",
      match: "<\\w+>",
    },
    ident: {
      name: "variable",
      match: "\\b(\\w+)\\b",
    },
    "interpolation-strings": {
      name: "string.interpolated",
      begin: '(s|f)"',
      end: '"',
      patterns: [
        {
          name: "keyword.operator.new",
          match: "\\{[^}]*}",
        },
      ],
    },
    strings: {
      name: "string.quoted.double",
      begin: '"',
      end: '"',
      patterns: [
        {
          name: "constant.character.escape",
          match: "\\\\.",
        },
      ],
    },
  },
  scopeName: "source.prql",
};

export { configuration, grammars };
