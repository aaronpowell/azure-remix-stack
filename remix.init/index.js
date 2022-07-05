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

function getRandomPassword(length = 20, wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()+_-=}{[]|:;"/?.><,`~') {
  return Array.from(crypto.randomBytes(length))
    .map((x) => wishlist[x % wishlist.length])
    .join('')
}

async function main({ rootDirectory }) {
  const README_PATH = path.join(rootDirectory, "README.md");
  const EXAMPLE_ENV_PATH = path.join(rootDirectory, ".env.example");
  const ENV_PATH = path.join(rootDirectory, ".env");
  const PACKAGE_JSON_PATH = path.join(rootDirectory, "package.json");

  const REPLACER = "chiptune-stack-template";
  const DIR_NAME = path.basename(rootDirectory);
  const APP_NAME = DIR_NAME.replace(/-/g, "").slice(0, 12);
  console.log(`Start creating app with name`, APP_NAME);

  const azureSubscriptions = JSON.parse(execSync(`az login`));
  console.log("Azure login success", azureSubscriptions);

  const parametersJSONFile = JSON.parse(await fs.readFile(`${__dirname}/azure/parameters.json`));

  const configuration = [
    { name: "AZURE_SUBSCRIPTION_ID", value: azureSubscriptions[0].id },
    { name: "WEB_SITE_NAME", value: APP_NAME },
    { name: "SQL_SERVER_NAME", value: APP_NAME },
    { name: "WEB_SERVERFARMS_NAME", value: APP_NAME },
    { name: "CONTAINER_REGISTRY_NAME", value: APP_NAME },
    { name: "CONTAINER_REGISTRY_IMAGE_NAME_AND_LABEL", value: APP_NAME },
    { name: "CONTAINER_REGISTRY_USERNAME", value: "Username.1" },
    { name: "SQL_SERVER_ADMIN_USERNAME", value: APP_NAME },
    { name: "SQL_SERVER_ADMIN_PASSWORD", value: getRandomPassword() }
  ];

  configuration.forEach((parameter) => {
    parametersJSONFile.parameters[parameter.name].value = parameter.value;
  });

  await fs.writeFile(`${__dirname}/azure/replaced_parameters.json`, JSON.stringify(parametersJSONFile, null, 2));

  const location = "northeurope";
  const resourceGroup = JSON.parse(execSync(`az group create --location ${location} --name ${APP_NAME}`));
  console.log("Created new resource group", resourceGroup);
  
  console.log("Deploying stack to Azure with parameters...", parametersJSONFile);
  const deployment = JSON.parse(execSync(`az deployment group create --template-file ${__dirname}/azure/template.json --parameters @${__dirname}/azure/replaced_parameters.json --resource-group ${resourceGroup.name} --name ${APP_NAME}`));

  console.log("Setting up container registry access");
  const servicePrincipalName = deployment[""];
  const acrRegistryId = execSync(`az acr show --name $ACR_NAME --query "id" --output tsv`)
  const acrPassword = `$(az ad sp create-for-rbac --name ${servicePrincipalName} --scopes ${acrRegistryId} --role acrpush --query "password" --output tsv)`
  const acrUsername = `$(az ad sp list --display-name ${servicePrincipalName} --query "[].appId" --output tsv)`

  console.log(`Add the following configuration to your repository Github Actions secrets: `)
  console.log(JSON.stringify({
    AZURE_REGISTRY_USERNAME: acrUsername,
    AZURE_REGISTRY_PASSWORD: acrPassword,
    DATABASE_URL: deployment[""]
  }, null, 2))

  await inquirer.prompt({ type: "confirm" });
  


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

  console.log(`✅  Project is ready! Start development with "npm run dev"`);
}

module.exports = main;
