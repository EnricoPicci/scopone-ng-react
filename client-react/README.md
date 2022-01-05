# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

If you install the required packages with the command `npm i` you can get a lot of security warnings about many vulnerabilities.

According to the authors of `Create React App` these warnings can be ignored and the right way to run an audit is via the command `npm audit --production`.

See [this github post](https://github.com/facebook/create-react-app/issues/11174) for more details.

## Customization with `craco` to be able to use the kind-of-monorepo setup

The React client uses the same `service` as the Angular client.

Therefore the `service` code is held in a library which is external to the folder where both the Angular and React clients have their source code.

The build scripts created by [Create React App](https://github.com/facebook/create-react-app) do not allow though to import any code outside the `./src` folder where the app code is stored.

In order to bypass this limitation, we use [craco](https://github.com/gsoft-inc/craco) as documented in these links

https://stackoverflow.com/a/68017931/5699993
https://github.com/gsoft-inc/craco/blob/master/packages/craco/README.md#installation
https://stackoverflow.com/a/58603207/5699993

The scripts contained in the `package.json` file have been updated to point to the `craco` implementation

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
