# LlamaSynthGen

LLM Discussion Generator powered by Llama Instruct models. Generates structured discussions between multiple AI actors on random topics.

## Overview

LlamaSynthGen is a Node.js application that leverages the power of Llama 3rd gen models to generate realistic, multi-actor discussions. The system creates a specified number of AI personas, assigns them to discuss a given topic, and generates a conversation following natural dialogue patterns.

## Features

- **Multi-Actor Discussions**: Generate discussions with configurable number of actors (3 by default)
- **Topic Generation**: Automatically creates relevant discussion topics
- **Dynamic Role Assignment**: Each actor gets a unique system prompt based on their persona
- **Configurable Rounds**: Set how many rounds of conversation to generate
- **Debug Mode**: Enable detailed logging for development and debugging
- **Model Agnostic**: Works with any Llama.cpp compatible model
- **Discussion Persistence**: Saves generated discussions to files

## Requirements

- Node.js 18+
- A Llama.cpp compatible model (e.g., Llama-3.2-3B-Instruct.gguf)
- Model files stored in a local directory

## Installation

```bash
git clone <repository-url>
cd llamasynthgen
npm install
```

## Setup

1. Download a Llama.cpp compatible model (e.g., Llama-3.2-3B-Instruct.gguf)
2. Place the model file in your preferred directory
3. Update your `.env` file with the correct paths:

```env
MODEL_NAME=Llama-3.2-3B-Instruct.gguf
MODEL_PATH=/path/to/your/model/directory/
```

## Usage

Run the application with:

```bash
npm start
```

You will be prompted to:
1. Specify the number of actors (default: 3)
2. Set the number of conversation rounds (default: 100)
3. Enable debugging mode (default: false)

## How It Works

1. **Actor Generation**: The system creates a list of AI personas with names and descriptions
2. **Topic Selection**: A discussion topic is generated for the actors
3. **Conversation Loop**: Each actor responds to the previous message, creating a back-and-forth discussion
4. **Output**: Generated discussions are saved to the `discussions` directory

## Configuration

### Environment Variables

- `MODEL_NAME`: Name of the GGUF model file to use
- `MODEL_PATH`: Directory path where the model is stored

### Runtime Parameters

- `ACTORS_NUM`: Number of AI actors in the discussion (default: 3)
- `ROUNDS_NUM`: Number of conversation rounds (default: 100)
- `DEBUG_MODE`: Enable debug logging (default: false)

## Output

Generated discussions are saved in the `discussions` directory with timestamps in the filename format: `1234567890.txt`

## Project Structure

```
llamasynthgen/
├── index.js              # Main application entry point
├── userInput.js          # User input handling
├── tokens.js             # LLM token definitions
├── package.json          # Project metadata and dependencies
├── .env                  # Environment variables
├── discussions/          # Directory for generated discussions
└── node_modules/         # Dependencies
```

## Dependencies

- `node-llama-cpp`: Core LLM inference engine
- `eslint`: Code linting
- `@eslint/js`: ESLint configuration

## Customization

### Modifying Actor Generation

The system prompts for actor creation based on:
- Persona names
- Optional descriptions (when enabled)
- Role-specific system prompts

### Adjusting Conversation Flow

Modify the following in `index.js`:
- `ROUNDS_NUM`: Control conversation length
- `USE_EXTRA_DESCRIPTION`: Toggle detailed actor descriptions
- System prompts for actors and initial setup

## Troubleshooting

### Model Not Found
Ensure `MODEL_NAME` and `MODEL_PATH` are correctly set in `.env`

### Discussion Not Generated
Check that:
- Model path is accessible
- Model file exists and is compatible
- Required environment variables are set

### Performance Issues
Consider:
- Reducing `ACTORS_NUM` or `ROUNDS_NUM`
- Using smaller model files
- Increasing system resources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License

## Author

Taras Bozhok