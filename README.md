# Spark Application Composer
Allows the management of applications built for the Spark Pipeline Driver project.

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
