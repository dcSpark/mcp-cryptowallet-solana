# MCP Server

This is a Model Context Protocol (MCP) server implementation that enables the use of a Solana crypto wallet in AI assistants like Claude and other clients like Cursor.

## Overview

This server implements the Model Context Protocol (MCP), allowing for improved context management and communication between AI assistants like Claude and various client applications. It's built with Node.js and Typescript and can be easily run using npx.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

No installation is required if you're using npx. If you want to install it globally:

```bash
npm install -g @modelcontextprotocol/server
```

### Running the Server

#### Using npx (recommended)

You can run the server directly using npx without installing:

```bash
npx -y @modelcontextprotocol/server
```

### Setting up Claude

#### Using the MCP Server with Claude

To use the MCP server with Claude, you need to configure the server as a context provider in Claude. Please set up your claude_desktop_config.json file like this:

```json
{
  "mcpServers": {
    "mcp-cryptowallet-solana": {
      "command": "npx",
      "args": [
        "-y",
        "@mcp-dockmaster/mcp-cryptowallet-solana"
      ],
      "env": {
        "PRIVATE_KEY": "YOUR_PRIVATE_KEY"
      }
    }
  }
}
```

### Environment Variables

The MCP server requires the following environment variables to be set:

- `PRIVATE_KEY`: Optional.The private key of the wallet to use for the MCP server. This should be a valid Solana private key in base58 format.

### Setting up private key

If you don't provide a private key, the server can generate a new keypair and use the public key as the default wallet.

To set up a private key, you can use the `wallet_generate_keypair` tool and this will return a private key that you can use in the `PRIVATE_KEY` environment variable or you can import into the server using the `wallet_import_private_key` tool.

### Switching networks

The server supports switching between Solana networks using the `wallet_switch_network` tool. by default the server will use the devnet network.

You can check the current network using the `wallet_get_current_network` tool.

### Tools

The server implements the following tools:

- `wallet_get_balance`: Get the balance of the default wallet or a public key passed as parameter.
- `wallet_get_token_accounts`: Get the token accounts of the default wallet or a public key passed as parameter.
- `wallet_get_token_balance`: Get the balance of a specific token account.
- `wallet_create_transaction`: Create a transaction message.
- `wallet_sign_transaction`: Sign a transaction message.
- `wallet_send_transaction`: Send a transaction.
- `wallet_generate_keypair`: Generate a new keypair.
- `wallet_import_private_key`: Import a private key into the server.
- `wallet_validate_address`: Validate an address.
- `wallet_check_transaction`: Check a transaction.
- `wallet_switch_network`: Switch the network of the server.
- `wallet_get_current_network`: Get the current network of the server.



