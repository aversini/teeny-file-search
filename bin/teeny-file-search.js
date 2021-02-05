#!/usr/bin/env node

const path = require("path");
const fs = require("fs-extra");
const commander = require("commander");
const program = new commander.Command();
const { displayErrorMessages, shallowMerge } = require("teeny-js-utilities");
const defaults = require("../src/defaults");
const { Search } = require("../src/search");
const pkg = require(path.join(__dirname, "../package.json"));

const optionParseType = (value) => {
  if (value !== "f" && value !== "d") {
    throw new commander.InvalidOptionArgumentError(
      `Valid options are "f" or "d".`
    );
  }
  return value;
};

const optionParseGrep = (value) => {
  if (value !== "" && program.opts().type === "d") {
    throw new commander.InvalidOptionArgumentError(
      `Options "grep" and "type" = "d" are incompatible.`
    );
  }
  return value;
};

program
  .version(pkg.version, "-v, --version", "Output the current version")
  .arguments("[path]")
  .option(
    "-p, --pattern <string>",
    "A regular expression to match file or folder names",
    null
  )
  .option(
    "-t, --type <string>",
    "Search for files (f) or directories (d)",
    optionParseType
  )
  .option("--short", "Short listing format (equivalent to ls)", false)
  .option("--dot", "Show hidden files and directories", false)
  .option("-b, --boring", "Do not use color output", false)
  .option("-s, --stats", "Display some statistics", false)
  .option("-i, --ignore-case", "Ignore case when searching", false)
  .option(
    "-c, --command <cmd>",
    "Command to execute over each node (ex: chmod +x)"
  )
  .option(
    "-g, --grep <pattern>",
    "A regular expression to match the content of the files found",
    optionParseGrep
  )
  .helpOption("-h, --help", "Display help instructions");

program.addHelpText(
  "after",
  `\nPath: the path where to search for files or directories (default: current folder)`
);

program.configureHelp({
  sortOptions: true,
});

program.parse(process.argv);
const customCfg = program.opts();

if (program.args.length) {
  const customPath = program.args[0];
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
