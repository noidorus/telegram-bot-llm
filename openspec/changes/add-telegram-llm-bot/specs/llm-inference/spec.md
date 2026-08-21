## Purpose

Provides a provider-independent interface for generating responses from a locally hosted language model, allowing the Telegram bot to use an LLM without depending on a specific inference backend.

## ADDED Requirements

### Requirement: Generate a response from user input

The system SHALL provide an inference capability that accepts a user's text input and returns the generated text response from the configured language model.

#### Scenario: Successful generation

* **WHEN** the inference capability receives a valid user text input
* **THEN** it SHALL send the input to the configured language model
* **AND** return the generated text response to the caller

### Requirement: Process requests without conversation history

The inference capability SHALL process each request independently and SHALL NOT require or persist conversation history.

#### Scenario: Independent inference requests

* **WHEN** two separate user messages are submitted as separate inference requests
* **THEN** the second request SHALL NOT include the first request or its response as implicit context

### Requirement: Configurable model

The system SHALL allow the language model used for inference to be selected through configuration without requiring application source code changes.

#### Scenario: Model configuration is changed

* **WHEN** the configured model name is changed before application startup
* **THEN** subsequent inference requests SHALL use the newly configured model

### Requirement: Support local inference backends

The system SHALL support a locally hosted language model inference backend and SHALL allow the inference backend to be replaced without changing the Telegram-facing behavior.

#### Scenario: Inference backend is replaced

* **WHEN** the configured local inference backend is replaced with another supported backend
* **THEN** Telegram message receiving and response behavior SHALL remain unchanged

### Requirement: Handle inference failures

The system SHALL report inference failures to the caller without terminating the Telegram bot process.

#### Scenario: Inference service is unavailable

* **WHEN** the configured inference service cannot be reached
* **THEN** the inference capability SHALL return an error to the caller
* **AND** the Telegram bot process SHALL remain available to process subsequent messages

### Requirement: Protect inference configuration

The system SHALL obtain inference service configuration from environment variables or equivalent runtime configuration and SHALL NOT require service credentials or sensitive configuration to be hard-coded in application source code.

#### Scenario: Required inference configuration is missing

* **WHEN** required inference configuration is unavailable at application startup
* **THEN** the application SHALL report a configuration error
* **AND** SHALL NOT start normal message processing

