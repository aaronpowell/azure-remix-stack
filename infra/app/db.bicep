param location string = resourceGroup().location
param administratorLogin string
@secure()
param administratorLoginPassword string
param serviceName string = 'db'
param databaseName string = 'remix'
param serverName string

module db '../core/database/postgres.bicep' = {
  name: '${serviceName}-remix'
  params: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    location: location
    serverName: serverName
    databaseName: databaseName
  }
}

output SERVER_NAME string = db.name
output DATABASE_NAME string = db.outputs.DB_NAME
output SERVER_HOST string = db.outputs.SERVER_HOST
