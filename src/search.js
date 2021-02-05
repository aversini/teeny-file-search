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
  STR_TYPE_DIRECTORY,
  STR_TYPE_FILE,
} = require("./utilities");

class Search {
  constructor({
    boring,
    dot,
    foldersBlacklist,
    ignoreCase,
    long,
    path,
    pattern,
    stats,
    type,
  }) {
    this.path = path;
    this.rePattern = pattern
      ? new RegExp(pattern, ignoreCase ? "i" : "")
      : null;
    this.type = type;
    this.boring = boring;
    kleur.enabled = !boring;
    this.displayLongListing = long;
    this.displayStats = stats;
    this.displayHiddenFilesAndFolders = dot;
    this.dirsList = [];
    this.filesList = [];
    this.foldersBlacklist = foldersBlacklist;
    this.totalDirScanned = 0;
    this.totalFileScanned = 0;
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
        totalDirsFound: this.dirsList.length,
        totalFileScanned: this.totalFileScanned,
        totalFilesFound: this.filesList.length,
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
        if (this.type === STR_TYPE_DIRECTORY) {
          if ((res = checkPattern(this.rePattern, strPath, this.type))) {
            this.dirsList.push({
              match: res,
              name: strPath,
              shortname: strPath,
              stat,
            });
            // runCommand(strPath);
          }
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
        if (this.type === STR_TYPE_FILE) {
          shortname = basename(strPath);
          if ((res = checkPattern(this.rePattern, shortname, this.type))) {
            this.filesList.push({
              match: res[0],
              name: strPath,
              shortname,
              stat,
            });
            // runCommand(strPath);
          }
        }
      }
    }

    return {
      dirsList: this.dirsList,
      filesList: this.filesList,
    };
  };

  prettyPrintResults = async () => {
    const nodes = this.type === STR_TYPE_FILE ? this.filesList : this.dirsList;
    logger.log();
    for (const node of nodes) {
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
        l = await formatLongListings(node.stat, this.type);
        separator = "\t";
      }
      name = relative(process.cwd(), node.name);
      /* istanbul ignore if */
      if (this.type === STR_TYPE_DIRECTORY) {
        name = name === "" ? "." : `./${name}`;
      }

      /* istanbul ignore else */
      if (node && node.match && node.shortname) {
        if (this.type === STR_TYPE_FILE) {
          name = kleur.gray(
            name.replace(node.match, kleur.black().bgYellow(node.match))
          );
        } else {
          name = kleur.blue(
            name.replace(node.match, kleur.black().bgYellow(node.match))
          );
        }
      }
      logger.log(
        ` %s${separator}%s${separator}%s${separator}%s${separator}%s`,
        l.mode.trim(),
        l.owner.trim(),
        l.size.trim(),
        l.mdate,
        name
      );
    }
  };
}

module.exports = {
  Search,
};
