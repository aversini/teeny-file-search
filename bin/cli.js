#!/usr/bin/env node

const { blue, grey } = require("kleur");
const fs = require("fs-extra");
const meow = require("meow");
const { displayErrorMessages, shallowMerge } = require("teeny-js-utilities");
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

const cli = meow(
  `
  Usage:
    $ teeny-file-search [options] [path]

  Options:
    ${blue("-b, --boring")}            Do not use color output ${grey(
    "(default: false)"
  )}
    ${blue(
      "-c, --command <cmd>"
    )}     Command to execute over each node (ex: chmod +x)
    ${blue("    --dot")}               Show hidden files and directories ${grey(
    "(default: false)"
  )}
    ${blue(
      "-g, --grep <pattern>"
    )}    A regular expression to match the content of the files found
    ${blue("-h, --help")}              Display help instructions
    ${blue("-i, --ignore-case")}       Ignore case when searching ${grey(
    "(default: false)"
  )}
    ${blue(
      "-p, --pattern <string>"
    )}  A regular expression to match file or folder names ${grey(
    "(default: null)"
  )}
    ${blue("-s, --stats")}             Display some statistics ${grey(
    "(default: false)"
  )}
    ${blue(
      "    --short"
    )}             Short listing format (equivalent to ls) ${grey(
    "(default: false)"
  )}
    ${blue("-t, --type <string>")}     Search for files (f) or directories (d)
    ${blue("-v, --version")}           Output the current version

  ${blue("Path:")} the path where to search for files or directories ${grey(
    "(default: current folder)"
  )}

  Examples:
    ${grey('## Find files with the extension ".jsx" in the "src" folder')}
    ${blue('> teeny-file-search --type f --pattern ".jsx$" src')}

    ${grey(
      '## Change the permissions to executable for all the files with extension ".sh" found under the "bin" folder'
    )}
    ${blue(
      '> teeny-file-search --type f --pattern=".sh$" --command "chmod +x"'
    )}

    ${grey(
      'Search in all the markdown files under the `src` folder for the keywords "Table of Content"'
    )}
    ${blue(
      '> teeny-file-search --type f --pattern ".md$" --grep "Table of Content"'
    )}
`,
  {
    allowUnknownFlags: false,
    autoHelp: false,
    autoVersion: false,
    description: false,
    flags: {
      boring: {
        alias: "b",
        default: false,
        type: "boolean",
      },
      command: {
        alias: "c",
        type: "string",
      },
      dot: {
        default: false,
        type: "boolean",
      },
      grep: {
        alias: "g",
        type: "string",
      },
      help: {
        alias: "h",
        type: "boolean",
      },
      ignoreCase: {
        alias: "i",
        default: false,
        type: "boolean",
      },
      pattern: {
        alias: "p",
        type: "string",
      },
      short: {
        default: false,
        type: "boolean",
      },
      stats: {
        alias: "s",
        default: false,
        type: "boolean",
      },
      type: {
        alias: "t",
        type: "string",
      },
      version: {
        alias: "v",
        type: "boolean",
      },
    },
  }
);

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
