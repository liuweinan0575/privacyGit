#privacyGit

> privacyGit is a node.js based application that aims to help us use [github](https://en.wikipedia.org/wiki/GitHub) securely.

When we work on a project or write some programs with our friends, usually, we will have to use version control software. [Git](https://en.wikipedia.org/wiki/Git) is such a good choice. 

Surely, we can use git in an internal network. But how to deal with a case that we are not in the same place and we do not have a cloud machine. 

The answer may be github, yes, which has been the largest soft repository around the world. But to our knowledge, github can only be used with a public way and it is not free for us to create a private repository.

For a new programmer, we may not have enough money or we may simply not want to spend these money(or we do not have credit card to pay for the service) for a private repository in github. 

Then will we be not able to fight together any longer?

## Usage

### Basic

In the github homepage of privacyGit, download zip or use git to get the source code. Then we can get the files as below:

```bash
-- package.json
-- privacyGit.js
-- README.md
```

Before the use of privacyGit we need install all the dependencies
```bash
$ npm install
```

Then we can happily use privacyGit.

> Currently, the privacyGit provides four commands:

### Init

This command is used to initilize the privacyGit system:

```bash
$ node privacyGit.js init sourceCodeDir distCodeDir lengthOfKey
```

This command required three parameters:

- sourceCodeDir

This directory is our coding place and needs to use git locally.

- distCodeDir

The code in this directory can be pushed to github with encrypted format. Then, our friends can pull our commited files into their distCodeDir. Furthermore, our friends can use the update command to decrypt our commit and finally get our original commit code.

Similarly, our friends can commit their code with encrypted format and we can update it.

With this way, we can use github as our "public" git safely.

**Note that:** Currently, the privacyGit only support [DES symmetric encryption
technique](https://en.wikipedia.org/wiki/Data_Encryption_Standard). Therefore, our friend and we should use the same key to encrypt and decrypt codes.

- lengthOfKey

This parameter is designed to decide the length of the used key. Currently, the generated key is "helloworld", and you can modify it manually.

#### Example

For example, we use the following command to initial our privacyGit system:

```bash
$ node privacyGit.js init "mySourceDir" "myDistDir" 5
```

Then the project structure will become:

```bash
-- mySourceDir
   --
-- myDistDir
   --
-- .privacyConfig
-- package.json
-- privacyGit.js
-- README.md
```

**Note that** mySourceDir and myDistDir are two empty directory and .privacyConfig is the configuration file.

```bash
{
  "key": "helloworld",
  "ignore": [
    ".privacyConfig",
    "node_modules",
    "README.md",
    "privacyGit.js"
  ],
  "files": {
    "source": {
      "sourceName": "mySourceDir",
      "sourceContent": {}
    },
    "dist": {
      "distName": "myDistDir",
      "distContent": {}
    }
  }
}
```

Later, we can create our local git repository in "mySourceDir", and use "commit" command to encrypt all the modification to "myDistDir" directory. And "myDistDir" directory is used to push/pull encrypted file to/from github.
In the repository of github, pushed files are all encrypted format with DES.

### Commit or commit file/directory

We can use commit command to commit all the modification to "myDistDir" directory:

```bash
$ node privacyGit.js commit
or
$ npm run commit
```

Or commit a simple file or some modified files in a directory:

```bash
$ node privacyGit.js commit "./mySourceDir/hello.txt" // commit hello.txt only
or
$ node privacyGit.js commit "./mySourceDir/helloDir" // commit all modified files in "helloDir" directory
```

Then we can push the files to github, and let our friends update/pull them.

### Update or update file/directory

If we pull some files which are commited by our friends from github, they will be in our "myDistDir"(we use myDistDir for commit/update files to/from github). Then we can update them with our update command:

```bash
$ node privacyGit.js update
or
$ npm run update
```
Or update a simple file or some modified files in a directory:

```bash
$ node privacyGit.js update "./mySourceDir/salut.txt.cipher" // update salut.txt.cipher only
or
$ node privacyGit.js update "./mySourceDir/salutDir" // update all modified files in "salutDir" directory
```

### Help

This command provides the help info for privacyGit, but it is still on the way to meet us(laught).

## License

MIT © [Weinan, Liu](https://github.com/liuweinan0575)
