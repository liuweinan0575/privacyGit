"use strict"
// TODO: state saving object change; need to create folder if not existing
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const mkdirp = require('mkdirp');

const CmdArray = ['commit', 'update', 'init', 'help'];

function CrytoSys(secretKey) {
  const ENCODING = 'hex';
  const encrytedFun = function (plainText) {
    const encipher = crypto.createCipher('des-ede3-cbc', secretKey);
    return `${encipher.update(plainText, 'utf8', ENCODING)}${encipher.final(ENCODING)}`;
  };
  const decrytedFun = function (cipherText) {
    const decipher = crypto.createDecipher('des-ede3-cbc', secretKey);
    return `${decipher.update(cipherText, ENCODING, 'utf8')}${decipher.final('utf8')}`;
  };
  return { encrytedFun, decrytedFun };
}

function FileSys(allFiles, cmdArgu, configObject, crytoSys, ignoreArray) {
  function dealWithFile(fileName, sourceContent, distContent) {
    fs.readFile(fileName, 'utf8', (err, data) => {
      if (err) throw err;
      // console.log(data);
      let filePath, fileData, operator;
      if (cmdArgu === CmdArray[0]) {
        fileData = crytoSys.encrytedFun(data);
        filePath = `${fileName.replace(configObject.files.source.sourceName, configObject.files.dist.distName)}.cipher`;
        operator = 'crypt';
      } else {
        // update
        fileData = crytoSys.decrytedFun(data);
        filePath = fileName.substr(0, fileName.length-7);
        filePath = filePath.replace(configObject.files.dist.distName, configObject.files.source.sourceName)
        operator = 'decryt';
      }
      mkdirp.sync(filePath.substring(0,filePath.lastIndexOf("/")));

      fs.writeFile(filePath, fileData, (err) => {
        if (err) throw err;
        delete allFiles[fileName];

        fs.stat(filePath, (err, stats) => {
          if (err) throw err;
          const size = stats.size, mtime = stats.mtime.toString();
          // console.log(distContent);
          if (cmdArgu === CmdArray[0]) {
            distContent[filePath] = {size, mtime};
          } else {
            sourceContent[filePath] = {size, mtime};
          }
          // console.log(sourceContent);
          // console.log(distContent);
          beforeDone(allFiles, cmdArgu, configObject);
          console.log(`${operator} ${fileName} successfullly`);
        });
      });
    });
  }

  function dealWithFolder(dir, sourceContent, distContent) {
    if (cmdArgu === CmdArray[0]) {
      mkdirp.sync(dir.replace(configObject.files.source.sourceName, configObject.files.dist.distName));
    } else {
      mkdirp.sync(dir.replace(configObject.files.source.distName, configObject.files.dist.sourceName));
    }

    fs.readdir(dir, (err, files) => {
      files.forEach((fileName) => {
        const filePath = `${dir}/${fileName}`;
        // if fileName does not start with ".", neither in ignoreArray
        // if (!(fileName.indexOf('.') === 0 || ignoreArray.indexOf(fileName) !== -1)) {
        if (ignoreArray.indexOf(fileName) === -1) {
          fs.stat(filePath, (err, stats) => {
            if (err) throw err;
            if (stats.isFile()) {
              console.log(filePath+' is a file');
              const size = stats.size, mtime = stats.mtime.toString();
              const oldState = cmdArgu === CmdArray[0]?sourceContent[filePath]:distContent[filePath];
              if (!(oldState && size === oldState.size && mtime == oldState.mtime)) {
                if (cmdArgu === CmdArray[0]) {
                  sourceContent[filePath] = {size, mtime};
                } else {
                  distContent[filePath] = {size, mtime};
                }
                dealWithFile(filePath, sourceContent, distContent);
              } else {
                delete allFiles[filePath];
              }
            } else {
              console.log(filePath+' is a folder');
              dealWithFolder(filePath, sourceContent, distContent);
            }
          });
        }
      });
    });
  }

  function beforeDone(allFiles, cmdArgu, configObject){
    if (Object.keys(allFiles).length === 0) {
      fs.writeFile('.privacyConfig', JSON.stringify(configObject, null, 2), (err) => {
        if (err) throw err;
        console.log('update .privacyConfig successfullly');
        console.log(`${cmdArgu} successfullly`);
      });
    }
  }

  return { dealWithFile, dealWithFolder };
}

// console.log(getFiles('.', null, ['node_modules']));
function getFiles(dir, fileObject, ignoreFiles){
  fileObject = fileObject || {};
  const stats = fs.statSync(dir);
  if (stats.isFile()) {
    fileObject[dir] = true;
  } else if (stats.isDirectory()) {
    const files = fs.readdirSync(dir);
    for (let i in files){
      if (ignoreFiles.indexOf(files[i]) === -1 ) {
        const name = `${dir}/${files[i]}`;
        if (fs.statSync(name).isDirectory()){
          getFiles(name, fileObject, ignoreFiles);
        } else {
          fileObject[name] = true;
        }
      }
    }
  }
  return fileObject;
}

function globalOperation(cmdArgu) {
  // read config file
  fs.readFile('.privacyConfig', 'utf8', (err, data) => {
    if (err) throw err;
    const configObject = JSON.parse(data);
    const SECRET_KEY = configObject.key,
      ignoreArray = configObject.ignore,
      files = configObject.files,
      source = files.source,
      sourceName = source.sourceName,
      sourceContent = source.sourceContent,
      dist = files.dist,
      distName = dist.distName,
      distContent = dist.distContent;

    if (!SECRET_KEY) {
      console.log('Please set SECRET_KEY in config file');
      return;
    }

    // read all the files except for the ones in ignoreArray
    const allFiles = getFiles(cmdArgu === CmdArray[0]?sourceName:distName, null, ignoreArray);
    const crytoSys = new CrytoSys(SECRET_KEY);
    const fileSys = new FileSys(allFiles, cmdArgu, configObject, crytoSys, ignoreArray),
      dealWithFile = fileSys.dealWithFile,
      dealWithFolder = fileSys.dealWithFolder;

    // const CmdArray = ['commit', 'update', 'init', 'help'];
    if (cmdArgu === CmdArray[0]) {
      dealWithFolder(sourceName, sourceContent, distContent);
    } else if (cmdArgu === CmdArray[1]){
      dealWithFolder(distName, sourceContent, distContent);
    }
  });
}

function partialOperation(cmdArgu, fileArgu) {
  if (fileArgu.indexOf('../') > -1) {
    console.log('upper folder is not available');
  } else if (fileArgu.indexOf('./') > -1) {
    // read config file
    fs.readFile('.privacyConfig', 'utf8', (err, data) => {
      if (err) throw err;
      const configObject = JSON.parse(data);
      const SECRET_KEY = configObject.key,
        ignoreArray = configObject.ignore || [],
        files = configObject.files || [],
        source = files.source,
        dist = files.dist,
        sourceName = source.sourceName,
        sourceContent = source.sourceContent,
        distName = dist.distName,
        distContent = dist.distContent;

      if (!SECRET_KEY) {
        console.log('Please set SECRET_KEY in config file');
        return;
      }
      if (cmdArgu === CmdArray[0] && fileArgu.indexOf(sourceName)) {
        console.log('commit for source folder only');
        return;
      } else if (cmdArgu === CmdArray[1] && fileArgu.indexOf(distName) ) {
        console.log('update for dist folder only');
        return;
      }

      // read all the files except for the ones in ignoreArray
      const allFiles = getFiles(fileArgu, null, ignoreArray);
      const crytoSys = new CrytoSys(SECRET_KEY);
      const fileSys = new FileSys(allFiles, cmdArgu, configObject, crytoSys, ignoreArray),
        dealWithFolder = fileSys.dealWithFolder,
        dealWithFile = fileSys.dealWithFile;

      const stats = fs.statSync(fileArgu);
      if (stats.isFile()) {
        console.log(fileArgu+' is a file');
        const size = stats.size, mtime = stats.mtime.toString();
        const oldState = cmdArgu === CmdArray[0]?sourceContent[fileArgu]:distContent[fileArgu];
        if (!(oldState && size === oldState.size && mtime == oldState.mtime)) {
          if (cmdArgu === CmdArray[0]) {
            sourceContent[fileArgu] = {size, mtime};
          } else {
            distContent[fileArgu] = {size, mtime};
          }
          dealWithFile(fileArgu, sourceContent, distContent);
        } else {
          delete allFiles[filePath];
        }
      } else if (stats.isDirectory()) {
        console.log(fileArgu+' is a folder');
        dealWithFolder(fileArgu, sourceContent, distContent);
      }
    });
  }
}

function initOperation(cmdArgu, fileArgu, distArgu, keyLength) {
  const configObject = {
    key: 'helloworld',
    ignore: ['.privacyConfig', 'node_modules', 'README.md', 'privacyGit.js'],
    files: {
      source: {sourceName: fileArgu, sourceContent: {} },
      dist: {distName: distArgu, distContent: {} },
    }
  };

  fs.writeFile('.privacyConfig', JSON.stringify(configObject, null, 2), (err) => {
    if (err) throw err;
    console.log('init ".privacyConfig" successfully');
  });

  mkdirp(fileArgu, function (err) {
    if (err) console.error(err)
    else console.log('create source dir successfully')
  });

  mkdirp(distArgu, function (err) {
    if (err) console.error(err)
    else console.log('create dist dir successfully')
  });
}

function main() {
  const cmdArgu = process.argv[2];
  const fileArgu = process.argv[3];

  if (CmdArray.indexOf(cmdArgu) === -1) {
    console.log('use "node privacyGit help" see more info');
  } else if (cmdArgu === CmdArray[3]) {
    console.log('help info is coming');
  } else if (cmdArgu === CmdArray[2]) {
    // init for generating the config file
    console.log(process.argv.length);
    if (process.argv.length <= 5) {
      console.log('use "node privacyGit help" see more info');
    }
    const distArgu = process.argv[4];
    const keyLength = process.argv[5];
    initOperation(cmdArgu, fileArgu, distArgu, keyLength);
  } else {
    //
    if (!fileArgu) {
      // global operation
      globalOperation(cmdArgu);
    } else {
      // partial operation
      partialOperation(cmdArgu, fileArgu)
    }
  }
}

main();
