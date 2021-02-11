#!/usr/bin/env node

const fs = require("fs-extra");
const meow = require("meow");
const {
  displayErrorMessages,
  meowOptionsHelper,
  shallowMerge,
} = require("teeny-js-utilities");
const PrettyError = require("pretty-error");
const TeenyLogger = require("teeny-logger");
const logger = new TeenyLogger({
  boring: process.env.NODE_ENV === "test",
});

const defaults = require("../src/defaults");
const { Search } = require("../src/search");

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
  usage: "teeny-file-search [options] [path]",
});

const cli = meow(helpText, options);

const { command, grep, help, type, version } = cli.flags;

if (help) {
  cli.showHelp();
  process.exit(0);
}

if (version) {
  cli.showVersion();
  process.exit(0);
}

if (typeof type === "string" && type !== "d" && type !== "f") {
  logger.error(
    `Error: option '-t, --type <string>' argument '${type}' is invalid. Valid options are "f" or "d".`
  );
  process.exit(1);
}

if (typeof command === "string" && !command) {
  logger.error(
    `Error: option '-c, --command <cmd>' argument '${command}' is invalid.`
  );
  process.exit(1);
}

if (typeof grep === "string" && !grep) {
  logger.error(
    `Error: option '-g, --grep <pattern>' argument '${grep}' is invalid.`
  );
  process.exit(1);
}

if (typeof grep === "string" && typeof type === "string" && type === "d") {
  logger.error(`Error: options "grep" and "type" = "d" are incompatible.`);
  process.exit(1);
}

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
}
const config = shallowMerge(defaults, customCfg);

(async () => {
  const search = new Search(config);
  await search.start();
})();
