param storageAccountName string
param containerName string
param containerProperties object = {
  publicAccess: 'None'
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-05-01' = {
  name: '${storageAccountName}/default/${containerName}'
  properties: containerProperties
}
