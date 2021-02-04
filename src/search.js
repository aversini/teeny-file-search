const boxen = require("boxen");
const kleur = require("kleur");
const { Performance, runCommand } = require("teeny-js-utilities");
const TeenyLogger = require("teeny-logger");
const logger = new TeenyLogger({
  boring: process.env.NODE_ENV === "test",
});
const perf = new Performance();

const STR_TYPE_DIRECTORY = "d";
const STR_TYPE_FILE = "f";
const BYTE_CHUNKS = 1000;
const MODE_OWNER_POS = 0;
const MODE_GROUP_POS = 1;
const MODE_WORD_POS = 2;
const OCTAL = 8;
const DECIMAL = 10;
const LAST_THREE_ENTRIES = -3;
const path = require("path");
const join = path.join;
const basename = path.basename;
const fs = require("fs");
const dirBlacklist = /node_modules|(^|\/)\.[^/.]/gi;

const ownerNames = {
  0: "root",
};

let totalDirScanned = 0,
  totalFileScanned = 0;

function extractMode(mode) {
  const modeDec = parseInt(mode.toString(OCTAL), DECIMAL)
    .toString()
    .slice(LAST_THREE_ENTRIES);
  const modeOwner = modeDec.charAt(MODE_OWNER_POS);
  const modeGroup = modeDec.charAt(MODE_GROUP_POS);
  const modeWorld = modeDec.charAt(MODE_WORD_POS);
  const modes = {
    0: "---",
    1: "--x",
    2: "-w-",
    3: "-wx",
    4: "r--",
    5: "r-x",
    6: "rw-",
    7: "rwx",
  };
  return modes[modeOwner] + modes[modeGroup] + modes[modeWorld];
}

function convertSize(bytes) {
  const sizes = ["B", "K", "M", "G", "T"];
  const len = 5;
  let posttxt = 0;

  while (bytes >= BYTE_CHUNKS) {
    posttxt = posttxt + 1;
    bytes = bytes / BYTE_CHUNKS;
  }
  const str = parseInt(bytes, DECIMAL).toFixed(0) + sizes[posttxt];
  return new Array(len + 1 - str.length).join(" ") + str;
}

function convertDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const getOwnerNameFromId = async (uid) => {
  let res;

  /* istanbul ignore if */
  if (!ownerNames[uid]) {
    try {
      res = await runCommand(`id -nu ${uid}`);
      ownerNames[uid] = res;
      return res;
    } catch (e) {
      // nothing to declare officer
      return uid;
    }
  } else {
    return ownerNames[uid];
  }
};

const formatLongListings = async (stat, type) => {
  const delim = type === STR_TYPE_FILE ? "-" : "d";
  return {
    mode: delim + extractMode(stat.mode),
    size: `${convertSize(stat.size)}`,
    mdate: `${convertDate(stat.mtime)}`,
    owner: `${await getOwnerNameFromId(stat.uid)}`,
  };
};

const printListing = async (nodes, { type, long }) => {
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
    if (long) {
      l = await formatLongListings(node.stat, type);
      separator = "\t";
    }
    name = path.relative(process.cwd(), node.name);
    /* istanbul ignore if */
    if (type === STR_TYPE_DIRECTORY) {
      name = name === "" ? "." : `./${name}`;
    }
    name = type === STR_TYPE_FILE ? kleur.gray(name) : kleur.blue(name);
    /* istanbul ignore else */
    if (node && node.match && node.shortname) {
      if (type === STR_TYPE_FILE) {
        name = name.replace(
          node.shortname,
          node.shortname.replace(node.match, kleur.black().bgYellow(node.match))
        );
      } else {
        name = name.replace(node.match, kleur.black().bgYellow(node.match));
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

const printStatistics = ({
  duration,
  totalDirScanned,
  totalDirsFound,
  totalFileScanned,
  totalFilesFound,
  type,
}) => {
  let msg = `Total folders scanned: ${kleur.yellow(totalDirScanned)}\n`;
  msg += `Total files scanned: ${kleur.yellow(totalFileScanned)}\n`;
  msg +=
    type === STR_TYPE_DIRECTORY
      ? `Total folders matching: ${kleur.green(totalDirsFound)}\n`
      : `Total files matching: ${kleur.green(totalFilesFound)}\n`;
  msg += `Duration: ${kleur.yellow(`${duration}ms`)}`;
  logger.log();
  logger.log(
    boxen(msg, {
      padding: 1,
      align: "center",
      borderColor: "yellow",
    })
  );
};

function checkPattern(rePattern, str) {
  if (rePattern) {
    rePattern.lastIndex = 0;
    return rePattern.exec(str);
  }
  return true;
}

function ignoreFolders(dir) {
  dirBlacklist.lastIndex = 0;
  return dirBlacklist.exec(basename(dir));
}

function isNotDotNode(path) {
  return path[0] !== ".";
}

const scanFileSystem = async (
  dirs,
  options,
  { dirsList: dirsList, filesList: filesList } = {
    dirsList: [],
    filesList: [],
  }
) => {
  for (const strPath of dirs) {
    let res, files, shortname;
    const stat = fs.lstatSync(strPath);

    if (stat.isDirectory() && !ignoreFolders(strPath)) {
      totalDirScanned++;
      if (options.type === STR_TYPE_DIRECTORY) {
        if ((res = checkPattern(options.rePattern, strPath, options.type))) {
          dirsList.push({
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
        scanFileSystem(
          files.filter(isNotDotNode).map(function (file) {
            return join(strPath, file);
          }),
          options,
          { dirsList, filesList }
        );
      } catch (e) {
        // nothing to declare
      }
    } else if (stat.isFile()) {
      totalFileScanned++;
      if (options.type === STR_TYPE_FILE) {
        shortname = basename(strPath);
        if ((res = checkPattern(options.rePattern, shortname, options.type))) {
          filesList.push({
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
    dirsList,
    filesList,
  };
};

const search = async ({ path, pattern, type, boring, long, stats }) => {
  if (stats) {
    perf.start();
  }

  /* istanbul ignore else */
  if (boring) {
    kleur.enabled = false;
  }

  const rePattern = pattern ? new RegExp(pattern) : null;

  const { dirsList, filesList } = await scanFileSystem([path], {
    type,
    rePattern,
  });
  await printListing(type === STR_TYPE_FILE ? filesList : dirsList, {
    type,
    long,
  });

  if (stats) {
    perf.stop();
    printStatistics({
      duration: perf.results.duration,
      totalDirScanned,
      totalDirsFound: dirsList.length,
      totalFileScanned,
      totalFilesFound: filesList.length,
      type,
    });
  }
};

module.exports = {
  // public methods
  search,
  // private methods
  checkPattern,
  convertDate,
  convertSize,
  extractMode,
  formatLongListings,
  getOwnerNameFromId,
  isNotDotNode,
  ignoreFolders,
  printListing,
  printStatistics,
  scanFileSystem,
};
