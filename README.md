# Teeny File Search

![npm](https://img.shields.io/npm/v/teeny-file-search?label=version&logo=npm)
![David](https://img.shields.io/david/aversini/teeny-file-search?logo=npm)
![David](https://img.shields.io/david/dev/aversini/teeny-file-search?logo=npm)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/aversini/teeny-file-search/coverage?label=coverage&logo=github)

> Teeny File Search is a command line tool that can:
>
> - find files or folders that match a certain pattern
> - look for string within those files and display them (think find and grep)

**DEPRECATION NOTICE:** For newer Node versions support, please use https://github.com/aversini/node-cli/tree/main/packages/search

## Installation

```sh
> npm install --global teeny-file-search
```

## Examples

**Get help**

<img src="https://raw.githubusercontent.com/aversini/teeny-file-search/master/configuration/screenshots/help.png" alt="help example">

**Find files with the extension ".js" in the `src` folder**

<img src="https://raw.githubusercontent.com/aversini/teeny-file-search/master/configuration/screenshots/example1.png" alt="example with file extension">

**Find folders which name or path includes \_\_tests\_\_ in the `src` folder**

<img src="https://raw.githubusercontent.com/aversini/teeny-file-search/master/configuration/screenshots/example2.png" alt="example with folder name">

**Search in all the markdown files under the current folder with the keywords "Table of Content"**

<img src="https://raw.githubusercontent.com/aversini/teeny-file-search/master/configuration/screenshots/example3.png" alt="example with grep">

**Change the permissions to executable for all the files with extension ".sh" found under the `bin` folder**

<img src="https://raw.githubusercontent.com/aversini/teeny-file-search/master/configuration/screenshots/example4.png" alt="example with command">

## License

MIT © Arno Versini
