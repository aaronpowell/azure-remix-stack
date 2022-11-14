targetScope = 'subscription'

@minLength(1)
@maxLength(50)
@description('Name of the the environment which is used to generate a short unique hash used in all resources.')
param name string

@minLength(1)
@description('Primary location for all resources')
param location string

resource resourceGroup 'Microsoft.Resources/resourceGroups@2020-06-01' = {
    name: 'rg-${name}'
    location: location
    tags: tags
}

var resourceToken = toLower(uniqueString(subscription().id, name))
var tags = {
    'azd-env-name': name
}

module resources './resources.bicep' = {
    name: 'resources-${resourceToken}'
    scope: resourceGroup
    params: {
        location: location
        name: resourceToken
        tags: tags
    }
}

output APP_WEB_BASE_URL string = resources.outputs.WEB_URI
