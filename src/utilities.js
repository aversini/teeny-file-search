const boxen = require("boxen");
const { green, yellow } = require("kleur");
const fs = require("fs");
const prettyMilliseconds = require("pretty-ms");
const { runCommand } = require("teeny-js-utilities");
const TeenyLogger = require("teeny-logger");
const kleur = require("kleur");
const logger = new TeenyLogger({
  boring: process.env.NODE_ENV === "test",
});

const BYTE_CHUNKS = 1000;
const DECIMAL = 10;
const LAST_THREE_ENTRIES = -3;
const MODE_GROUP_POS = 1;
const MODE_OWNER_POS = 0;
const MODE_WORD_POS = 2;
const OCTAL = 8;
const STR_TYPE_DIRECTORY = "d";
const STR_TYPE_FILE = "f";
const STR_TYPE_BOTH = "both";
const PERMISSIONS_PREFIX = {
  [STR_TYPE_FILE]: "-",
  [STR_TYPE_DIRECTORY]: "d",
};

const ownerNames = {
  0: "root",
};

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

const MONTHS = {
  0: "Jan",
  1: "Feb",
  2: "Mar",
  3: "Apr",
  4: "May",
  5: "Jun",
  6: "Jul",
  7: "Aug",
  8: "Sep",
  9: "Oct",
  10: "Nov",
  11: "Dec",
};
function convertDate(mtime) {
  const month = MONTHS[mtime.getMonth()];
  /* eslint-disable no-magic-numbers */
  const date = `${mtime.getDate()}`.padStart(2, "0");
  const hours = `${mtime.getHours()}`.padStart(2, "0");
  const minutes = `${mtime.getMinutes()}`.padStart(2, "0");
  /* eslint-enable */

  return `${month} ${date}  ${hours}:${minutes}`;
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

const formatLongListings = async (stat, type) => ({
  mode: PERMISSIONS_PREFIX[type] + extractMode(stat.mode),
  size: `${convertSize(stat.size)}`,

  mdate: `${convertDate(stat.mtime)}`,
  // mdate: "aaa",

  owner: `${await getOwnerNameFromId(stat.uid)}`,
});
const printStatistics = ({
  duration,
  totalDirScanned,
  totalDirsFound,
  totalFileScanned,
  totalFilesFound,
  type,
  pattern,
}) => {
  let msg = `Total folders scanned: ${yellow(totalDirScanned)}\n`;
  msg += `Total files scanned: ${yellow(totalFileScanned)}\n`;
  switch (type) {
    case STR_TYPE_DIRECTORY:
      msg += `Total folders matching: ${green(totalDirsFound)}\n`;
      break;

    case STR_TYPE_FILE:
      msg += `Total files matching: ${green(totalFilesFound)}\n`;
      break;

    default:
      if (pattern) {
        msg += `Total folders matching: ${green(totalDirsFound)}\n`;
        msg += `Total files matching: ${green(totalFilesFound)}\n`;
      }
      break;
  }

  msg += `Duration: ${yellow(`${prettyMilliseconds(duration)}`)}`;
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

async function runCommandOnNode(node, command) {
  try {
    const stdout = await runCommand(`${command} ${node}`);
    if (stdout) {
      logger.log("==>", stdout);
    }
  } catch (e) {
    // nothing to declare officer
  }
}

async function runGrepOnNode(node, rePattern) {
  try {
    const lines = [];
    let totalMatchingLines = 0;
    const buffer = fs.readFileSync(node, "utf8").split("\n");

    buffer.forEach(function (line, lineNumber) {
      let res;
      rePattern.lastIndex = 0;
      if (!(res = rePattern.exec(line))) {
        return;
      }
      totalMatchingLines++;
      if (lineNumber > 0) {
        lines.push(`${lineNumber}: ${kleur.grey(buffer[lineNumber - 1])}`);
      }
      lines.push(
        `${lineNumber + 1}: ${kleur.grey(
          line.replace(rePattern, kleur.black().bgYellow(res[0]))
        )}`
      );
      // eslint-disable-next-line no-magic-numbers
      lines.push(`${lineNumber + 2}: ${kleur.grey(buffer[lineNumber + 1])}`);
      lines.push("");
    });
    return {
      totalMatchingLines,
      results: lines.length ? lines : [],
    };
  } catch (e) {
    /* istanbul ignore next */
    logger.error(e);
  }
}

module.exports = {
  convertDate,
  convertSize,
  checkPattern,
  extractMode,
  formatLongListings,
  getOwnerNameFromId,
  printStatistics,
  runCommandOnNode,
  runGrepOnNode,
  STR_TYPE_BOTH,
  STR_TYPE_DIRECTORY,
  STR_TYPE_FILE,
};
