# Azure Remix Stack

A [Remix Stacks](https://remix.run/stacks) template for deploying to Azure. This is based off the [Indie Stack](https://github.com/remix-run/indie-stack) template, but adapted for Azure.

```
npx create-remix --template aaronpowell/azure-remix-stack
```

## What's in the stack

- [Azure Web App for Containers](https://docs.microsoft.com/azure/app-service/quickstart-custom-container?tabs=dotnet&pivots=container-linux&WT.mc_id=javascript-61097-aapowell) with [Docker](https://www.docker.com/) and [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/?WT.mc_id=javascript-61097-aapowell) for container management
- Production-ready [Azure Database for PostgreSQL](https://azure.microsoft.com/products/postgresql/?WT.mc_id=javascript-61097-aapowell#overview)
- [GitHub Actions](https://github.com/features/actions) for deploy on merge to production and staging environments
- Email/Password Authentication with [cookie-based sessions](https://remix.run/docs/en/v1/api/remix#createcookiesessionstorage)
- Database ORM with [Prisma](https://prisma.io)
- Styling with [Tailwind](https://tailwindcss.com/)
- End-to-end testing with [Cypress](https://cypress.io)
- Local third party request mocking with [MSW](https://mswjs.io)
- Unit testing with [Vitest](https://vitest.dev) and [Testing Library](https://testing-library.com)
- Code formatting with [Prettier](https://prettier.io)
- Linting with [ESLint](https://eslint.org)
- Static Types with [TypeScript](https://typescriptlang.org)
- VS Code [Remote Container definition](https://code.visualstudio.com/docs/remote/containers?WT.mc_id=javascript-61097-aapowell) for easy local dev setup
- [Azure Developer CLI (azd)](https://learn.microsoft.com/azure/developer/azure-developer-cli/overview?WT.mc_id=javascript-61097-aapowell) to provision infrastructure

_Note: you will need an Azure account to deploy this._

## Development

- Initial setup: _If you just generated this project, this step has been done for you._

  ```sh
  npm run setup
  ```

- Start dev server:

  ```sh
  npm run dev
  ```

This starts your app in development mode, rebuilding assets on file changes.

The database seed script creates a new user with some data you can use to get started:

- Email: `aaron.powell@microsoft.com`
- Password: `AzureRocks!`

## Deployment

### Quick testing

You can quickly spin up the infrastructure on Azure using `azd`.

1. Initialize your Azure environment (enter a name for the environment, select a subscription and region to deploy to):

   ```sh
   azd init
   ```

1. Provision the resources in Azure

   ```sh
   azd provision
   ```

1. Deploy from local

   ```sh
   azd deploy
   ```

### Deploy with GitHub Actions or Azure Pipelines

Once you're ready, you can get `azd` to scaffold up a GitHub Action workflow (or Azure Pipelines definition).

1. Scaffold the workflow

   ```sh
   azd pipeline config
   ```

1. Commit the generated workflow and push

### Relevant code:

This is a pretty simple note-taking app, but it's a good example of how you can build a full stack app with Prisma and Remix. The main functionality is creating users, logging in and out, and creating and deleting notes.

- creating users, and logging in and out [./app/models/user.server.ts](./app/models/user.server.ts)
- user sessions, and verifying them [./app/session.server.ts](./app/session.server.ts)
- creating, and deleting notes [./app/models/note.server.ts](./app/models/note.server.ts)

## Deployment

This Remix Stack comes with two GitHub Actions that handle automatically deploying your app to production and staging environments.

Before running a deployment, you'll need to provision the [Azure Container Registry](https://docs.microsoft.com/azure/container-registry/?WT.mc_id=javascript-61097-aapowell) and [Azure WebApp for Conitainers](https://docs.microsoft.com/azure/app-service/quickstart-custom-container?tabs=dotnet&pivots=container-linux&WT.mc_id=javascript-61097-aapowell) instances, as well as an [Azure SQL](https://docs.microsoft.com/azure/azure-sql/database/single-database-create-quickstart?tabs=azure-portal&WT.mc_id=javascript-61097-aapowell) database.

_Note: Ensure that the Azure SQL database connection is configured in [app settings](https://docs.microsoft.com/azure/app-service/configure-common?tabs=portal&WT.mc_id=javascript-61097-aapowell) as `DATABASE_URL` for the app to access it._

## GitHub Actions

We use GitHub Actions for continuous integration and deployment. Anything that gets into the `main` branch will be deployed to production after running tests/build/etc. Anything in the `dev` branch will be deployed to staging.

### Environment Variables

GitHub Actions will need the following secret variables to run:

- `DATABASE_URL`: Connection info for a database to run the Cypress tests again
- `AZURE_RESGISTRY_URL`: URL of the Azure Container Registry
- `AZURE_REGISTRY_USERNAME`: Username to authenticate against Azure Container Registry
- `AZURE_REGISTRY_PASSWORD`: Password to authenticate against Azure Container Registry
- `AZURE_CLIENT_ID`: Client ID to authenticate against
- `AZURE_TENANT_ID`: Tenant ID to autnenticate against
- `AZURE_SUBSCRIPTION_ID`: Subscription that the web app belongs to
- `AZURE_WEBAPP_NAME`: Name of the app to deploy into

## Testing

### Cypress

We use Cypress for our End-to-End tests in this project. You'll find those in the `cypress` directory. As you make changes, add to an existing file or create a new file in the `cypress/e2e` directory to test your changes.

We use [`@testing-library/cypress`](https://testing-library.com/cypress) for selecting elements on the page semantically.

To run these tests in development, run `npm run test:e2e:dev` which will start the dev server for the app as well as the Cypress client. Make sure the database is running in docker as described above.

We have a utility for testing authenticated features without having to go through the login flow:

```ts
cy.login();
// you are now logged in as a new user
```

We also have a utility to auto-delete the user at the end of your test. Just make sure to add this in each test file:

```ts
afterEach(() => {
  cy.cleanupUser();
});
```

That way, we can keep your connected db clean and keep your tests isolated from one another.

### Vitest

For lower level tests of utilities and individual components, we use `vitest`. We have DOM-specific assertion helpers via [`@testing-library/jest-dom`](https://testing-library.com/jest-dom).

### Type Checking

This project uses TypeScript. It's recommended to get TypeScript set up for your editor to get a really great in-editor experience with type checking and auto-complete. To run type checking across the whole project, run `npm run typecheck`.

### Linting

This project uses ESLint for linting. That is configured in `.eslintrc.js`.

### Formatting

We use [Prettier](https://prettier.io/) for auto-formatting in this project. It's recommended to install an editor plugin (like the [VSCode Prettier plugin](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)) to get auto-formatting on save. There's also a `npm run format` script you can run to format all files in the project.

## License

The template is licensed under MIT, but the license file will be removed as you scaffold the template, so make sure you license your repo appropriately.
