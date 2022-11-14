const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const inquirer = require("inquirer");
const { EOL } = require("os");

const sort = require("sort-package-json");

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

  const answers = await inquirer.prompt([
    {
      name: "dbType",
      type: "list",
      message: "What database server should we use?",
      choices: ["devcontainer", "Local", "Azure"],
      default: "devcontainer",
    },
  ]);

  let connectionString = "";
  let shadowConnectionString = "";

  switch (answers.dbType) {
    case "devcontainer":
      connectionString = "postgresql://postgres:$AzureR0cks!@db:5432/remix";
      break;
    case "Local":
      const localAnswers = await inquirer.prompt([
        {
          name: "connStr",
          type: "input",
          message: "What is the connection string?",
          default: "postgresql://postgres:postgres@localhost:5432/remix",
        },
      ]);
      connectionString = localAnswers.connStr;
      break;
    case "Azure":
      const azureAnswers = await inquirer.prompt([
        {
          name: "connStr",
          type: "input",
          message: "What is the connection string?",
        },
        {
          name: "shadowConnectionString",
          message: "Database connection string for the shadow db:",
          type: "input",
        },
      ]);
      connectionString = azureAnswers.connStr;
      shadowConnectionString = azureAnswers.shadowConnectionString;
      break;
    default:
      throw new Error("Unknown dbType");
  }

  newEnv = newEnv.replace(
    /^DATABASE_URL=.*$/m,
    `DATABASE_URL="${connectionString}"`
  );
  if (shadowConnectionString) {
    newEnv += `${EOL}SHADOW_DATABASE_URL="${shadowConnectionString}"`;
  }

  const newPackageJson =
    JSON.stringify(
      sort({ ...JSON.parse(packageJson), name: APP_NAME }),
      null,
      2
    ) + "\n";

  console.log(`Updating template files with what you've told us`);

  await Promise.all([
    fs.writeFile(README_PATH, newReadme),
    fs.writeFile(ENV_PATH, newEnv),
    fs.writeFile(PACKAGE_JSON_PATH, newPackageJson),
  ]);

  console.log(`Removing temporary files from disk.`);

  await Promise.all([fs.rm(path.join(rootDirectory, "LICENSE.md"))]);

  if (answers.dbType === "devcontainer") {
    console.log(
      `Skipping the project setup until you open the devcontainer. Once done, "npm run setup" will execute on your behalf.`
    );
  } else {
    console.log(
      `Running the setup script to make sure everything was set up properly`
    );
    execSync(`npm run setup`, { stdio: "inherit", cwd: rootDirectory });
  }

  console.log(`✅ Project is ready! Start development with "npm run dev"`);
}

module.exports = main;
