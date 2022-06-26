const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const inquirer = require("inquirer");
const { EOL } = require("os");

const sort = require("sort-package-json");

const setupEasyAuth = require("./setup-easy-auth");

function escapeRegExp(string) {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getRandomString(length) {
  return crypto.randomBytes(length).toString("hex");
}

async function main({ rootDirectory }) {
  const README_PATH = path.join(rootDirectory, "README.md");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const PACKAGE_JSON_PATH = path.join(rootDirectory, "package.json");

  const REPLACER = "azure-remix-stack-template";

  const DIR_NAME = path.basename(rootDirectory);
  const SUFFIX = getRandomString(2);
  const APP_NAME = DIR_NAME + "-" + SUFFIX;

  const [readme, env, packageJson] = await Promise.all([
    fs.readFile(README_PATH, "utf-8"),
    fs.readFile(EXAMPLE_ENV_PATH, "utf-8"),
    fs.readFile(PACKAGE_JSON_PATH, "utf-8"),
  ]);

  let newEnv = env.replace(
    /^SESSION_SECRET=.*$/m,
    `SESSION_SECRET="${getRandomString(16)}"`
  );

  const newReadme = readme.replace(
    new RegExp(escapeRegExp(REPLACER), "g"),
    APP_NAME
  );

  const answers = await inquirer.prompt([{
    name: "connectionString",
    message: "Local database connection string (leave blank for default):",
    type: "input"
  },
  {
    name: "shadowConnectionString",
    message: "Database connection string for the shadow db:",
    type: "input",
    when: (answers) => answers.connectionString && answers.connectionString.indexOf('database.windows.net') >= 0
  }]);

  if (answers.connectionString) {
    newEnv = newEnv.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL="${answers.connectionString}"`
    )
  }
  if (answers.shadowConnectionString) {
    newEnv += `SHADOW_DATABASE_URL="${answers.shadowConnectionString}${EOL}"`;
  }

  await setupEasyAuth({ subscriptionId: '81a77569-b654-4cae-8282-980ac9136597', location: 'westus2', resourceGroup: 'ExampleGroup3', appName: 'mychiptunestackappsite', url: 'https://mychiptunestackappsite.azurewebsites.net' })

  const newPackageJson =
    JSON.stringify(
      sort({ ...JSON.parse(packageJson), name: APP_NAME }),
      null,
      2
    ) + "\n";

  console.log(
    `Updating template files with what you've told us`
  );

  await Promise.all([
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(PACKAGE_JSON_PATH, newPackageJson),
  ]);

  console.log(
    `Removing temporary files from disk.`
  );

  await Promise.all([
    fs.rm(path.join(rootDirectory, "LICENSE.md"))
  ]);

  console.log(
    `Running the setup script to make sure everything was set up properly`
  );
  execSync(`npm run setup`, { stdio: "inherit", cwd: rootDirectory });

  console.log(`✅  Project is ready! Start development with "npm run dev"`);
}

module.exports = main;
