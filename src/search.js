/* eslint-disable max-depth */
const fs = require("fs");
const kleur = require("kleur");
const { basename, join, relative } = require("path");
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
  STR_TYPE_BOTH,
  STR_TYPE_DIRECTORY,
  STR_TYPE_FILE,
} = require("./utilities");

class Search {
  constructor({
    boring,
    dot,
    foldersBlacklist,
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
    await this.prettyPrintResults();

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
      let res, files, shortname;
      const stat = fs.lstatSync(strPath);

      if (stat.isDirectory() && !this.ignoreFolders(strPath)) {
        this.totalDirScanned++;

        if ((res = checkPattern(this.rePattern, strPath))) {
          this.totalDirFound++;
          this.nodesList.push({
            type: STR_TYPE_DIRECTORY,
            match: res,
            name: strPath,
            shortname: strPath,
            stat,
          });

          // runCommand(strPath);
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
      } else if (stat.isFile()) {
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
          });

          // runCommand(strPath);
        }
      }
    }
  };

  prettyPrintResults = async () => {
    logger.log();
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
        name = color(
          name.replace(
            new RegExp(node.match, "g"),
            kleur.black().bgYellow(node.match)
          )
        );
        logger.log(
          ` %s${separator}%s${separator}%s${separator}%s${separator}%s`,
          l.mode.trim(),
          l.owner.trim(),
          l.size.trim(),
          l.mdate,
          name
        );
      }
    }
  };
}

module.exports = {
  Search,
};
