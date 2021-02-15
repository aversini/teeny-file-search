#!/usr/bin/env node

const fs = require("fs-extra");
const meow = require("meow");
const { red } = require("kleur");
const {
  displayErrorMessages,
  meowOptionsHelper,
  meowParserHelper,
  shallowMerge,
} = require("teeny-js-utilities");
const PrettyError = require("pretty-error");

const defaults = require("../src/defaults");
const { Search } = require("../src/search");
const { STR_TYPE_FILE } = require("../src/utilities");

const pe = new PrettyError();
// Automatically prettifying all exceptions that are logged
pe.start();

const { helpText, options } = meowOptionsHelper({
  examples: [
    {
      command:
        'teeny-file-search --type f --pattern=".sh$" --command "chmod +x"',
      comment: '## Find files with the extension ".jsx" in the "src" folder',
    },
    {
      command:
        'teeny-file-search --type f --pattern=".sh$" --command "chmod +x"',
      comment:
        '## Change the permissions to executable for all the files with extension ".sh" found under the "bin" folder',
    },
    {
      command:
        'teeny-file-search --type f --pattern ".md$" --grep "Table of Content"',
      comment:
        '## Search in all the markdown files under the `src` folder for the keywords "Table of Content"',
    },
  ],
  flags: {
    boring: {
      alias: "b",
      default: false,
      description: "Do not use color output",
      type: "boolean",
    },
    command: {
      alias: "c",
      description: "Command to execute over each node (ex: chmod +x)",
      type: "string",
    },
    dot: {
      default: false,
      description: "Show hidden files and directories",
      type: "boolean",
    },
    grep: {
      alias: "g",
      description:
        "A regular expression to match the content of the files found",
      type: "string",
    },
    help: {
      alias: "h",
      description: "Display help instructions",
      type: "boolean",
    },
    ignoreCase: {
      alias: "i",
      default: false,
      description: "Ignore case when searching",
      type: "boolean",
    },
    pattern: {
      alias: "p",
      description: "A regular expression to match file or folder names",
      type: "string",
    },
    short: {
      default: false,
      description: "Short listing format (equivalent to ls)",
      type: "boolean",
    },
    stats: {
      alias: "s",
      default: false,
      description: "Display some statistics",
      type: "boolean",
    },
    type: {
      alias: "t",
      description: "Search for files (f) or directories (d)",
      type: "string",
    },
    version: {
      alias: "v",
      description: "Output the current version",
      type: "boolean",
    },
  },
  parameters: {
    path: {
      default: "current folder",
      description: "the path where to search for files or directories",
    },
  },
  usage: true,
});

const cli = meow(helpText, options);
meowParserHelper({
  cli,
  restrictions: [
    {
      exit: 1,
      message: (x) =>
        red(
          `\nError: option '-t, --type <string>' argument '${x.type}' is invalid. Valid options are "f" or "d".`
        ),
      test: (x) =>
        typeof x.type === "string" && x.type !== "d" && x.type !== "f",
    },
    {
      exit: 1,
      message: (x) =>
        red(
          `\nError: option '-c, --command <cmd>' argument '${x.command}' is invalid.`
        ),
      test: (x) => typeof x.command === "string" && !x.command,
    },
    {
      exit: 1,
      message: (x) =>
        red(
          `\nError: option '-g, --grep <pattern>' argument '${x.grep}' is invalid.`
        ),
      test: (x) => typeof x.grep === "string" && !x.grep,
    },
    {
      exit: 1,
      message: () =>
        red(`\nError: options "grep" and "type" = "d" are incompatible.`),
      test: (x) =>
        typeof x.grep === "string" &&
        typeof x.type === "string" &&
        x.type === "d",
    },
  ],
});

const customCfg = cli.flags;

if (cli.input.length) {
  const customPath = cli.input[0];
  if (fs.pathExistsSync(customPath)) {
    customCfg.path = customPath;
  } else {
    displayErrorMessages([`Folder ${customPath} does not exist!`]);
  }
}

/**
 * Merging default configuration with the
 * preferences shared by the user.
 */
if (customCfg.grep) {
  // forcing simplified display if grep is true.
  customCfg.short = true;
  // And forcing type to files
  customCfg.type = STR_TYPE_FILE;
}
const config = shallowMerge(defaults, customCfg);

(async () => {
  const search = new Search(config);
  await search.start();
})();
