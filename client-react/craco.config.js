const path = require("path");
const enableImportsFromExternalPaths = require("./src/helpers/craco/enableImportsFromExternalPaths");

// Paths to the code you want to use
const scopone_rx_service_lib = path.resolve(__dirname, "../scopone-rx-service/src");

module.exports = {
    plugins: [
        {
            plugin: {
                overrideWebpackConfig: ({ webpackConfig }) => {
                    enableImportsFromExternalPaths(webpackConfig, [
                        // Add the paths here
                        scopone_rx_service_lib,
                    ]);
                    return webpackConfig;
                },
            },
        },
    ],
};