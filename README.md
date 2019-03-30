# Spark Application Composer
Allows the management of applications built with the [Spark Pipeline Driver](https://github.com/Acxiom/spark-pipeline-driver) project.

## Steps Editor
The steps editor is used to create and update the steps used to build the pipelines. A bulk load option is available to
dump JSON metadata that is generated either by hand or using the [Application Utilities](https://github.com/Acxiom/spark-pipeline-driver/tree/develop/application-utils).

## Pipeline Editor
The pipeline editor is used to combine steps in a way that can process data using Spark.

## Application Editor
The application editor is used to build a complete execution in Spark.

## Building
This project requires [NodeJS](https://nodejs.org/en/).

Clone the repository and install the modules:

```bash
npm install
```

## Running
There are two ways to run the project:

### File based
This mode saves all of the data to the local filesystem.

```bash
node server.js
```

### Mongo based
This mode stores all of the data in a mongo database. By default it connects to localhost.

```bash
NODE_ENV=mongo node server.js
```

### UI
The UI is accessible at:

http://localhost:8000

## Generating Step Metadata
A [tool](https://github.com/Acxiom/spark-pipeline-driver/tree/develop/application-utils) is provided that allows producing step metadata form jar files that contain steps that have been properly
annotated. This data can be loaded into the system using the "Load Metadata" button on the home page.
