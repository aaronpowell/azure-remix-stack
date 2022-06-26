const inquirer = require("inquirer");
const { execSync } = require('child_process');

const providers = [{ name: 'Apple', value: 'apple' },
{ name: 'Facebook', value: 'facebook' },
{ name: 'GitHub', value: 'github' },
{ name: 'Google', value: 'google' },
{ name: 'Twitter', value: 'twitter' },
{ name: 'Done (continue)', value: null }
]

async function setupEasyAuth(options) {
  const { subscriptionId, location, resourceGroup, appName, url } = options

  // Add suppport for 'az webapp auth' running authV2
  await execSync(`az extension add --name authV2`)

  const setupProvider = await prepareSetupProvider(subscriptionId, location, resourceGroup, appName)

  do {
    const answer = await inquirer.prompt({
      name: "provider",
      message: "Please select authentication provider to support:",
      type: "list",
      choices: providers
    });

    if (answer.provider === null) break;
    const providerIndex = providers.findIndex(p => p.value === answer.provider)
    const [provider] = providers.splice(providerIndex, 1)

    const { clientId, clientSecret } = await renderInstructionForProvider(url, provider.value)
    if (!clientId) throw Error('No clientId provided for provider: ' + provider.name)
    if (!clientSecret) throw Error('No clientSecret provided for provider: ' + provider.name)

    console.log(`Adding provider ${provider.name} ⏰`)
    await setupProvider(provider.value, clientId, clientSecret)
    console.log(`Provider ${provider.name} added 🎉`)
  } while (true)
  console.log('Done adding prvoiders, continuing with setup...')
}

function renderInstructionForProvider(url, provider) {
  switch (provider) {
    case 'apple': return renderAppleInstructions(url)
    case 'facebook': return renderFacebookInstructions(url)
    case 'github': return renderGitHubInstructions(url)
    case 'google': return renderGoogleInstructions(url)
    case 'twitter': return renderTwitterInstructions(url)
    default: throw Error(`Could not find ${provider} provider`)
  }
}

async function renderAppleInstructions(url) {
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  return await inquirer.prompt([{
    name: "clientId",
    message: "Enter client ID:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter client Secret:",
    type: "input"
  }]);
}

async function renderFacebookInstructions(url) {
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  return await inquirer.prompt([{
    name: "clientId",
    message: "Enter app ID:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter app Secret:",
    type: "input"
  }]);
}

async function renderGitHubInstructions(url) {
  console.log("Follow the instructions for creating an OAuth app on GitHub.")
  console.log("Instructions: https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app")
  console.log("You will need to enter below information.")
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  console.log("On the application page, make note of the Client ID, which you'll need later.")
  console.log("Under Client Secrets, select Generate a new client secret.")
  console.log("Make note of the client secret value, which you'll need later.")
  return await inquirer.prompt([{
    name: "clientId",
    message: "Enter client ID:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter client Secret:",
    type: "input"
  }]);
}

async function renderGoogleInstructions(url) {
  console.log("Follow the instructions for creating an OAuth app on GitHub.")
  console.log("Instructions: https://developers.google.com/identity/protocols/oauth2/openid-connect")
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  return await inquirer.prompt([{
    name: "clientId",
    message: "Enter client ID:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter client Secret:",
    type: "input"
  }]);
}

async function renderTwitterInstructions(url) {
  console.log(`Homepage URL: ${url}`)
  console.log(`Authorization callback URL: ${url}/.auth/login/github/callback`)
  return await inquirer.prompt([{
    name: "clientId",
    message: "Enter API key:",
    type: "input"
  }, {
    name: "clientSecret",
    message: "Enter API Secret:",
    type: "input"
  }]);
}

async function prepareSetupProvider(subscriptionId, location, resourceGroup, appName) {
  await execSync(`az account set --subscription ${subscriptionId}`)
  await execSync(`az config set defaults.location=${location} defaults.group=${resourceGroup}`)
  await execSync(`az webapp auth update --name ${appName} --enabled true --action AllowAnonymous`)

  return async function (provider, clientId, clientSecret) {
    await execSync(`az webapp auth ${provider} update --name ${appName} --client-id ${clientId} --client-secret ${clientSecret} --yes`)
  }
}

module.exports = setupEasyAuth


// az webapp auth update --resource-group chiptunestac9c98 --name chiptunestac9c98
// --enabled true --action AllowAnonymous --token-store true
// --google-client-id 580722921481-d5r14v49fjhp2vp09b007qfajjrl9kfd.apps.googleusercontent.com --google-client-secret 4YD623bOEcZcMvNhZvdMwz6q



// Google
// Client ID: 580722921481-d5r14v49fjhp2vp09b007qfajjrl9kfd.apps.googleusercontent.com
// Client Secret: 4YD623bOEcZcMvNhZvdMwz6q


// az account set --subscription 81a77569-b654-4cae-8282-980ac9136597`
// az config set defaults.location=westus2 defaults.group=remove-me
// az webapp auth update --name remove-me-2 --enabled
// az webapp auth github update --name remove-me-2 --client-id foo --client-secret bar
