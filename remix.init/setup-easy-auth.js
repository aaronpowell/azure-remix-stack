
function setupEasyAuth(){
    const answers = await inquirer.prompt([{
        name: "provider",
        message: "Please select authentication provider to support:",
        type: "list",
        choices: (answers) => [{name: 'GitHub', value: 'github'}]
      }]);
}

module.exports = setupEasyAuth;