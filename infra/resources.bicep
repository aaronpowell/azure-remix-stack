param environmentName string
param location string = resourceGroup().location
param principalId string = ''
param webImageName string = ''

// Monitor application with Azure Monitor
module monitoring './core/monitor/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    environmentName: environmentName
    location: location
  }
}

// Container apps host (including container registry)
module containerApps './core/host/container-apps.bicep' = {
  name: 'container-apps'
  params: {
    environmentName: environmentName
    location: location
    logAnalyticsWorkspaceName: monitoring.outputs.logAnalyticsWorkspaceName
  }
}

// Web frontend
module web './app/web.bicep' = {
  name: 'web'
  params: {
    environmentName: environmentName
    location: location
    imageName: webImageName
    applicationInsightsName: monitoring.outputs.applicationInsightsName
    containerAppsEnvironmentName: containerApps.outputs.containerAppsEnvironmentName
    containerRegistryName: containerApps.outputs.containerRegistryName
  }
}

output WEB_URI string = web.outputs.WEB_URI
