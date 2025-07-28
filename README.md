# Local Stack CLI

Local Stack CLI is a command-line tool designed to streamline the management of Docker Compose services, Makefile targets, and custom commands.

## Features

- **Docker Compose Integration**: Start and manage Docker Compose services.
- **Makefile Support**: Select and execute Makefile targets.
- **Custom Commands**: Execute user-defined commands from the configuration file.

## Setup

Follow these steps to set up the project:

1. **Install dependencies**:

    ```bash
    npm install
    ```

1. **Set up the configuration file**:

    Copy the `config.template.json` file to `config.json`:

    ```bash
    cp config.template.json config.json
    ```

    Open the `config.json` file in your preferred text editor and update the paths and commands as needed to match your environment and needs. This file is used by the CLI to define custom commands and paths.

1. **Build the project**:

    ```bash
    npm run build
    ```

## Usage

After building the project, you can run the CLI using the following command:

```bash
npm start
```

### Optional: Add an Alias

To make it easier to run the CLI, you can add an alias to your shell configuration file (e.g., `.zshrc`, `.bashrc`, or `.bash_profile`):

1. Open your shell configuration file:

    ```bash
    nano ~/.zshrc
    ```

1. Add the following alias:

    ```bash
    alias local-stack="node /path-to-your-repo/local-stack/dist/cli.js"
    ```

1. Save the file and reload your shell:

    ```bash
    source ~/.zshrc
    ```

Now, you can run the CLI using:

```bash
local-stack
```

## Development

For development, you can use the following commands:

- **Start in development mode**:

  ```bash
  npm run dev
  ```

## Requirements

- Node.js `v22.17.1`
- Docker (for Docker Compose functionality)
- AWS CLI (for AWS SSO integration, if enabled)
