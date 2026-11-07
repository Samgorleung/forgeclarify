# ForgeClarify

AI Systems Architecture & Requirement Spec Auditor for Confluence & Jira, powered by Gemini 3.8 Flash on Atlassian Forge.

## Overview

ForgeClarify helps product and engineering teams bridge the gap between PRDs and sprint execution. Highlight any section of a requirement draft on a Confluence page to instantly run an architectural audit, evaluate readiness scores, uncover missing edge cases, and push structured Gherkin user stories directly to Jira backlogs.

## Architecture & Tech Stack

* **Frontend:** Atlassian Forge Custom UI (React 18 / `@forge/bridge`)
* **Backend:** Atlassian Forge Serverless Resolver (`@forge/resolver`, `@forge/api`)
* **AI Engine:** Google Gemini 3.8 Flash via Google AI Studio API (`responseMimeType: "application/json"`)
* **Integrations:** Confluence Context Menu Module (`confluence:contextMenu`) and Jira Cloud REST API (ADF formatted issue generation)

## Prerequisites

* Node.js v18 or v20
* Atlassian Forge CLI (`npm install -g @forge/cli`)
* Google AI Studio API Key

## Getting Started for Collaborators

### 1. Clone & Install Dependencies

```bash
git clone [https://github.com/Samgorleung/forgeclarify.git](https://github.com/Samgorleung/forgeclarify.git)
cd forgeclarify
npm install
cd static/hello-world
npm install
cd ../..