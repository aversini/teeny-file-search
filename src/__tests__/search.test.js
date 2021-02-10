/* eslint-disable no-magic-numbers */
const { shallowMerge } = require("teeny-js-utilities");
const {
  // public methods / class
  Search,
} = require("../search");

const defaults = require("../defaults");

let mockLog,
  mockLogError,
  mockLogWarning,
  spyExit,
  spyLog,
  spyLogError,
  spyLogWarning,
  mockExit;

/**
 * Some utilities have logging capabilities that needs to be
 * tested a little bit differently:
 * - mocking process.exit
 * - console.log
 * - inquirer.prompt
 */
describe("when testing for utilities with logging side-effects", () => {
  beforeEach(() => {
    mockExit = jest.fn();
    mockLog = jest.fn();
    mockLogError = jest.fn();
    mockLogWarning = jest.fn();

    spyExit = jest.spyOn(process, "exit").mockImplementation(mockExit);
    spyLog = jest.spyOn(console, "log").mockImplementation(mockLog);
    spyLogError = jest.spyOn(console, "error").mockImplementation(mockLogError);
    spyLogWarning = jest
      .spyOn(console, "warn")
      .mockImplementation(mockLogWarning);
  });
  afterEach(() => {
    spyExit.mockRestore();
    spyLog.mockRestore();
    spyLogError.mockRestore();
    spyLogWarning.mockRestore();
  });

  it("should find and list a specific folder based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          path: `${process.cwd()}`,
          pattern: "eslint$",
          short: true,
          stats: false,
          type: "d",
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" configuration/eslint");
  });

  it("should find and list a specific file based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          path: `${process.cwd()}`,
          pattern: "cli.js",
          short: true,
          stats: true,
          type: "f",
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" bin/cli.js");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list a hidden file based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          dot: true,
          path: `${process.cwd()}`,
          pattern: "ignore",
          short: true,
          stats: true,
          type: "f",
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" .gitignore");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list files while ignoring the case based on the arguments", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          ignoreCase: true,
          path: `${process.cwd()}`,
          pattern: "a",
          short: true,
          stats: true,
          type: "f",
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" README.md");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should find and list all files and directories when there is no pattern provided", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          path: `${process.cwd()}`,
          short: true,
          stats: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" bin/cli.js");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(" src");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should list files and folders when there is no type provided", async () => {
    const search = new Search(
      shallowMerge(
        {
          boring: true,
          path: `${process.cwd()}`,
          short: true,
          stats: true,
        },
        defaults
      )
    );
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" bin/cli.js");
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(" src");
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining("Duration: "));
  });

  it("should run a command on the file that matches the pattern", async () => {
    const config = shallowMerge(
      {
        boring: true,
        path: `${process.cwd()}`,
        pattern: "package.json",
        short: true,
        stats: false,
      },
      defaults
    );
    config.command = "grep name";

    const search = new Search(config);
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("teeny-file-search")
    );
  });

  it("should run a command on the file that matches the pattern but does not return anything", async () => {
    const config = shallowMerge(
      {
        boring: true,
        path: `${process.cwd()}`,
        pattern: "package.json",
        short: true,
        stats: false,
      },
      defaults
    );
    config.command = "chmod +r";

    const search = new Search(config);
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" package.json");
    expect(mockLog).not.toHaveBeenCalledWith(
      expect.stringContaining("teeny-file-search")
    );
  });

  it("should grep some text on the file that matches the pattern", async () => {
    const config = shallowMerge(
      {
        boring: true,
        path: `${process.cwd()}`,
        pattern: "README.md",
        short: true,
        stats: false,
      },
      defaults
    );
    config.grep = "^# ";

    const search = new Search(config);
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" README.md (1 occurrence)");
    expect(mockLog).toHaveBeenCalledWith(
      expect.stringContaining("# Teeny File Search")
    );
  });

  it("should grep some text on the file that matches the pattern", async () => {
    const config = shallowMerge(
      {
        boring: true,
        ignoreCase: true,
        path: `${process.cwd()}`,
        pattern: "package.json",
        short: true,
        stats: false,
      },
      defaults
    );
    config.grep = "ependencies";

    const search = new Search(config);
    await search.start();
    expect(mockLog).toHaveBeenCalledWith(" package.json (2 occurrences)");
  });

  it("should exit in error if the grep pattern is invalid", async () => {
    const config = shallowMerge(
      {
        boring: true,
        path: `${process.cwd()}`,
        pattern: "package.json",
        short: true,
        stats: false,
      },
      defaults
    );
    config.grep = "description [";

    const search = new Search(config);
    await search.start();
    expect(mockLog).not.toHaveBeenCalledWith(" package.json (1 occurrence)");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
