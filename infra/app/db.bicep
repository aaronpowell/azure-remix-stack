param location string = resourceGroup().location
param serverName string = 'remix'
param administratorLogin string
@secure()
param administratorLoginPassword string

module db '../core/database/postgres.bicep' = {
  name: 'postgres-remix'
  params: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    location: location
    serverName: serverName
  }
}
