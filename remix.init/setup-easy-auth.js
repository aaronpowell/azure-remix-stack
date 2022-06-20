const inquirer = require("inquirer");
const { execSync } = require('child_process');

async function setupEasyAuth(subscriptionId, location, resourceGroup, appName) {
  const { provider } = await inquirer.prompt({
    name: "provider",
    message: "Please select authentication provider to support:",
    type: "list",
    choices: (answers) => [{ name: 'GitHub', value: 'github' }]
  });
  console.log(' Selected provider: ' + provider)

  switch (provider) {
    case 'github': await setUpGitHubProvider(subscriptionId, location, resourceGroup, appName)
      break;
    default:
      break;
  }
}

async function setUpGitHubProvider(subscriptionId, location, resourceGroup, appName, url) {
  // [Get url from azure portal]

  console.log("Follow the instructions for creating an OAuth app on GitHub.")
  console.log("Instructions: https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app")
  console.log("You will need to enter below information.")
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  console.log("On the application page, make note of the Client ID, which you'll need later.")
  console.log("Under Client Secrets, select Generate a new client secret.")
  console.log("Make note of the client secret value, which you'll need later.")

  const { clientId, clientSecret } = await inquirer.prompt([{
    name: "clientId:",
    message: "Client ID:",
    type: "input"
  }, {
    name: "clientSecret:",
    message: "Client Secret:",
    type: "input"
  }]);

  await execSync(`az account set --subscription ${subscriptionId}`)
  // az account set --subscription 81a77569-b654-4cae-8282-980ac9136597`
  await execSync(`az config set defaults.location=${location} defaults.group=${resourceGroup}`)
  // az config set defaults.location=westus2 defaults.group=remove-me
  await execSync(`az containerapp auth update --name ${appName} --enabled`)
  // az containerapp auth update --name remove-me-2 --enabled
  await execSync(`az containerapp auth github update --name ${appName} --client-id ${clientId} --client-secret ${clientSecret} --yes`)
  // az containerapp auth github update --name remove-me-2 --client-id foo --client-secret bar

  const revisions = JSON.parse(await execSync(`az containerapp revision list --name ${appName}`))
  // az containerapp revision list --name remove-me-2

  const revision = revisions.find(r => r.properties.active)
  if (!revision) throw Error('No revision found')

  const response = JSON.parse(await execSync(`az containerapp revision restart --revision ${revision.name}`))
  // az containerapp revision restart --revision remove-me-2--hu0fxxp
  if (response !== "Restart succeeded") throw Error('Failed to restart revision')
}

module.exports = setupEasyAuth;


