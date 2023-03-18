const { execSync } = require('child_process');

async function assertCommand(command, url) {
  try {
    await execSync(`hash ${command}`, { stdio: 'pipe' })
  } catch (error) {
    console.log(`Please install '${command}' (${url}) and rerun the command.`)

    // Terminate setup process
    process.exit(0)
  }
}

async function setupGitRepository(options) {
  console.log(`Setting up repository: ${options.appName}... ⏰`)

  // Check for necessary commands exists
  await assertCommand('git', 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git')
  await assertCommand('gh', 'https://cli.github.com/manual/installation')

  await execSync(`gh auth login --hostname github.com --git-protocol https --web`)
  await execSync(`git init`)
  await execSync(`git add .`)
  await execSync(`git commit -m “Initial commit”`)
  await execSync(`gh repo create ${options.appName} --public --push --source ./`)

  console.log(`Successfully setup repository 🎉`)
}

module.exports = setupGitRepository
