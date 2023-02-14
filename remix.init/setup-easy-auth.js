const inquirer = require("inquirer");
const { execSync } = require('child_process');

async function setupEasyAuth(options) {
  const { subscriptionId, location, resourceGroup, appName, url } = options

  // Check for necessary commands exists
  try {
    await execSync(`hash az`, { stdio: 'pipe' })
  } catch (error) {
    console.log(`Please install Azure CLI (https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) and rerun the command.`)

    // Terminate setup process
    process.exit(0)
  }

  const extensionList = JSON.parse(await execSync(`az extension list`))
  const authV2Installed = extensionList.some(e => e.name === 'authV2')

  // Add suppport for 'az webapp auth' running authV2 if not already installed
  if (!authV2Installed) {
    console.log('Installing extension authV2... ⏰')
    await execSync(`az extension add --name authV2`)
    console.log('Finished installing extension authV2 🎉')
  }

  // Set default values
  await execSync(`az account set --subscription ${subscriptionId}`)
  await execSync(`az configure --defaults location=${location} group=${resourceGroup}`)

  // Setup basis to enable adding authentication provider
  await execSync(`az webapp auth update --name ${appName} --enabled true --action AllowAnonymous`)

  console.log("Follow the instructions for creating an OAuth app on Google.")
  console.log("Instructions: https://developers.google.com/identity/protocols/oauth2/openid-connect")
  console.log("Enter below homepage URL and authorization callback URL when creating the app.")
  console.log(`Authorized JavaScript origins: ${url}`)
  console.log(`Authorized redirect URIs: ${url}/.auth/login/google/callback`)
  const { clientId, clientSecret } = await inquirer.prompt([{
    name: "clientId",
    message: "Enter client ID:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter client Secret:",
    type: "input"
  }]);

  if (!clientId) throw Error('No clientId provided for Google provider')
  if (!clientSecret) throw Error('No clientSecret provided for Google provider')

  console.log(`Adding Google authentication provider... ⏰`)
  await execSync(`az webapp auth google update --name ${appName} --client-id ${clientId} --client-secret ${clientSecret} --yes`)
  console.log(`Successfully added Google authentication provider 🎉`)
}

module.exports = setupEasyAuth
