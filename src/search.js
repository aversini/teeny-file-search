/* eslint-disable max-depth */
const fs = require("fs");
const kleur = require("kleur");
const { basename, join, relative } = require("path");
const plur = require("plur");
const { Performance } = require("teeny-js-utilities");
const TeenyLogger = require("teeny-logger");
const logger = new TeenyLogger({
  boring: process.env.NODE_ENV === "test",
});
const perf = new Performance();

const {
  checkPattern,
  formatLongListings,
  printStatistics,
  runCommandOnNode,
  runGrepOnNode,
  STR_TYPE_BOTH,
  STR_TYPE_DIRECTORY,
  STR_TYPE_FILE,
} = require("./utilities");

class Search {
  constructor({
    boring,
    command,
    dot,
    foldersBlacklist,
    grep,
    ignoreCase,
    short,
    path,
    pattern,
    stats,
    type,
  }) {
    this.path = path;
    this.rePattern = pattern
      ? new RegExp(pattern, ignoreCase ? "i" : "")
      : null;
    this.type = type || STR_TYPE_BOTH;
    this.boring = boring;
    kleur.enabled = !boring;
    this.displayLongListing = !short;
    this.displayStats = stats;
    this.displayHiddenFilesAndFolders = dot;
    this.nodesList = [];
    this.foldersBlacklist = foldersBlacklist;
    this.totalDirScanned = 0;
    this.totalFileScanned = 0;
    this.totalDirFound = 0;
    this.totalFileFound = 0;
    this.command = command ? command.trim() : null;
    try {
      this.grep = grep ? new RegExp(grep, "g") : null;
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
  }

  ignoreFolders = (dir) => {
    this.foldersBlacklist.lastIndex = 0;
    return this.foldersBlacklist.test(basename(dir));
  };

  filterHidden = (val) => {
    if (this.displayHiddenFilesAndFolders) {
      return true;
    }
    return val[0] !== ".";
  };

  start = async () => {
    if (this.displayStats) {
      perf.start();
    }

    await this.scanFileSystem([this.path]);
    await this.postProcessResults();

    if (this.displayStats) {
      perf.stop();
      printStatistics({
        duration: perf.results.duration,
        totalDirScanned: this.totalDirScanned,
        totalDirsFound: this.totalDirFound,
        totalFileScanned: this.totalFileScanned,
        totalFilesFound: this.totalFileFound,
        type: this.type,
      });
    }
  };

  scanFileSystem = async (dirs) => {
    for (const strPath of dirs) {
      let res, files, shortname, stat;
      try {
        stat = fs.lstatSync(strPath);
      } catch (e) {
        // ignore read permission denied errors silently...
      }

      if (stat && stat.isDirectory() && !this.ignoreFolders(strPath)) {
        this.totalDirScanned++;

        if ((res = checkPattern(this.rePattern, strPath))) {
          this.totalDirFound++;
          this.nodesList.push({
            type: STR_TYPE_DIRECTORY,
            match: res,
            name: strPath,
            shortname: strPath,
            stat,
            command: this.command,
          });
        }

        try {
          files = fs.readdirSync(strPath);
          this.scanFileSystem(
            files.filter(this.filterHidden).map(function (file) {
              return join(strPath, file);
            })
          );
        } catch (e) {
          // nothing to declare
        }
      } else if (stat && stat.isFile()) {
        this.totalFileScanned++;

        shortname = basename(strPath);
        if ((res = checkPattern(this.rePattern, shortname, this.type))) {
          this.totalFileFound++;
          this.nodesList.push({
            type: STR_TYPE_FILE,
            match: res[0],
            name: strPath,
            shortname,
            stat,
            command: this.command,
          });
        }
      }
    }
  };

  postProcessResults = async () => {
    /* istanbul ignore if */
    if (!this.boring) {
      logger.log();
    }

    for (const node of this.nodesList) {
      if (
        (this.type === STR_TYPE_FILE && node.type === STR_TYPE_FILE) ||
        (this.type === STR_TYPE_DIRECTORY &&
          node.type === STR_TYPE_DIRECTORY) ||
        this.type === STR_TYPE_BOTH
      ) {
        let l = {
            mode: "",
            size: "",
            owner: "",
            group: "",
            mdate: "",
          },
          name,
          separator = "";

        /* istanbul ignore if */
        if (this.displayLongListing) {
          l = await formatLongListings(node.stat, node.type);
          separator = "\t";
        }

        const color = node.type === STR_TYPE_FILE ? kleur.gray : kleur.blue;
        name = relative(process.cwd(), node.name);
        const match = node.match ? new RegExp(node.match, "g") : node.match;
        name = color(name.replace(match, kleur.black().bgYellow(node.match)));

        if (this.grep && node.type === STR_TYPE_FILE) {
          const { totalMatchingLines, results } = await runGrepOnNode(
            node.name,
            this.grep
          );
          /* istanbul ignore else */
          if (totalMatchingLines) {
            const occurrences = plur("occurrence", totalMatchingLines);
            logger.log(
              ` %s${separator}%s${separator}%s${separator}%s${separator}%s`,
              l.mode.trim(),
              l.owner.trim(),
              l.size.trim(),
              l.mdate,
              name,
              `(${kleur.white(totalMatchingLines)} ${occurrences})`
            );
            logger.log(`${results.join("\n")}\n`);
          }
        } else {
          /* istanbul ignore next */
          // eslint-disable-next-line no-lonely-if
          if (!this.grep) {
            logger.log(
              ` %s${separator}%s${separator}%s${separator}%s${separator}%s`,
              l.mode.trim(),
              l.owner.trim(),
              l.size.trim(),
              l.mdate,
              name
            );
            if (node.command) {
              await runCommandOnNode(node.name, node.command);
            }
          }
        }
      }
    }
  };
}

module.exports = {
  Search,
};
