## Purpose

Provides the Telegram-facing interface for the application, allowing users to send text messages and receive generated responses while keeping Telegram-specific behavior isolated from the LLM implementation.

## ADDED Requirements

### Requirement: Receive text messages

The system SHALL receive text messages sent by Telegram users and extract the originating chat identifier and message text.

#### Scenario: User sends a text message

* **WHEN** a user sends a text message to the bot
* **THEN** the system SHALL receive the corresponding Telegram update
* **AND** identify the originating chat
* **AND** extract the message text
* **AND** make the text available for processing by the application

### Requirement: Process each message independently

The system SHALL process each incoming text message as an independent request and SHALL NOT use previous messages as context.

#### Scenario: User sends a second message

* **WHEN** a user sends a new text message after a previous message has been processed
* **THEN** the new request SHALL be processed without including the previous message or its response as LLM context

### Requirement: Send generated responses

The system SHALL send the generated response to the same Telegram chat from which the corresponding user message originated.

#### Scenario: LLM returns a response

* **WHEN** the application receives a successful response for a user's message
* **THEN** the system SHALL send that response to the originating Telegram chat

### Requirement: Handle unsupported message types

The system SHALL ignore or safely acknowledge Telegram updates that do not contain text messages.

#### Scenario: User sends a non-text message

* **WHEN** the bot receives an update containing a message without text
* **THEN** the system SHALL NOT send the message content to the LLM
* **AND** processing of subsequent updates SHALL continue normally

### Requirement: Handle Telegram API failures

The system SHALL handle Telegram API failures without terminating the bot process.

#### Scenario: Telegram API request fails

* **WHEN** a Telegram API request fails
* **THEN** the system SHALL record an appropriate technical error
* **AND** the bot process SHALL remain available to process subsequent updates

### Requirement: Protect Telegram credentials

The system SHALL obtain the Telegram bot token from an environment variable and SHALL NOT require the token to be present in application source code.

#### Scenario: Bot starts without a token

* **WHEN** the application starts without a valid Telegram bot token
* **THEN** the application SHALL report a configuration error
* **AND** SHALL NOT start normal Telegram message processing

