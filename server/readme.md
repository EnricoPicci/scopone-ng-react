# Scopone Go Server

## Node Modules

node_modules and package.json are present only because the serverless framework is installed in this folder to speed up the
deployment. Otherwise, any time we deploy, we should download it since the serverless command must be launched from
within this folder in order for it to work properly.
