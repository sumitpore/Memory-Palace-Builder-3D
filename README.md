# MemoryPalace Builder

Transform any object, place, or photo into a powerful mnemonic 'memory palace' using the generative power of the Google Gemini API. This tool is designed to help you memorize lists of items by associating them with vivid, unforgettable scenes inside an immersive 3D environment.

## Local Setup and Installation

To run this project locally, you will need Node.js and npm installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sumitpore/Memory-Palace-Builder-3D.git
    cd memory-palace-builder
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create an environment file**:
    Create a file named `.env` in the root of the project directory.

4.  **Add Environment Variables**:
    Add the following keys to your `.env` file. The application is configured to read these variables.

    ```
    # Your Google AI Studio API key for the Gemini API
    # Required for the application to function.
    API_KEY="YOUR_GEMINI_API_KEY"

    # Your Google Maps Platform API key with the Places API enabled.
    # Optional: Enables the real-time place search. If omitted, the app
    # will fall back to a predefined list of famous places.
    MAPS_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the application in development mode. Open your browser and navigate to the local URL provided in the terminal (e.g., `http://localhost:5173`).
    
## Key Features

-   **AI-Powered Generation**: Leverages the Google Gemini API to create detailed mnemonic scenes, a logical route, and a quick recap for your memorization list.
-   **Immersive 3D Navigation**: Generates a 3D panoramic view of your palace, allowing you to look around using your mouse or keyboard's arrow keys for a truly immersive experience.
-   **Multiple Anchor Types**:
    -   **Defaults**: Start quickly with common anchors like "A cozy desk" or "a trusty backpack."
    -   **Real Place**: Use any real-world location as your anchor. Integrates with Google Maps Places API if a key is provided.
    -   **Upload Image**: Use your own photograph as the foundation for your memory palace.
-   **Interactive Image Generation**: Generates multiple visual representations of your memory palace and allows you to suggest edits with text prompts to refine the imagery.
-   **Secure Local Storage**: Save and manage your memory palaces directly in your browser using IndexedDB. No data is stored on a server.
-   **Flexible Input Modes**:
    -   **Bulk Edit**: Paste a list with each item on a new line.
    -   **Single Item**: Add, view, and remove items one by one.
-   **Responsive & Accessible**: Designed to work beautifully on all devices, with a strong focus on keyboard navigation and ARIA standards for screen reader users.
-   **Enhanced Security**: Built with security best practices to mitigate common risks associated with LLM applications, including protections against prompt injection and model denial-of-service.

## How It Works

1.  **Choose Your Anchor**: Select from one of the three anchor types. This will be the foundation of your memory palace.
2.  **List Items to Memorize**: Enter the list of things you want to remember. Use the "Bulk Edit" mode for pasting lists or "Single Item" mode to build your list one by one.
3.  **Build the Palace**: Click the "Build My Memory Palace" button. The app sends your anchor and list to the Gemini API.
4.  **Review Your Palace**: The AI returns a complete memory palace, including:
    -   A title.
    -   Four unique images representing the palace, designed for a 3D view.
    -   An interactive **3D viewer** where you can navigate the scene by dragging your mouse or using your keyboard's arrow keys.
    -   A list of "Mnemonic Scenes" describing where each item is located.
    -   A "Quick Recap" table for easy review.
5.  **Refine the Imagery (Optional)**: If an image isn't quite right, click the edit icon. You can provide a text prompt (e.g., "add a blue book to the table") to generate a new set of images based on your changes.
6.  **Save Your Palace**: Click "Save to My Palaces" to store the complete memory palace securely in your browser for future access.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **3D Rendering**: Three.js
-   **Generative AI**:
    -   **Text & Logic**: Google Gemini API (`gemini-2.5-flash`)
    -   **Image Generation & Editing**: Google Gemini API (`gemini-2.5-flash-image-preview`)
-   **Local Database**: IndexedDB for client-side storage.
-   **Maps Integration (Optional)**: Google Maps Places API for the "Real Place" search functionality.

## Building for Production

To create an optimized version of the app for deployment:

```bash
npm run build
```

This command will bundle the React application into static files in a `dist` directory, which can then be deployed to any static hosting service.

## Security Features

This application was developed with a strong focus on security and privacy, incorporating mitigations for the [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/).

-   **LLM01: Prompt Injection**: The system prompt sent to the Gemini API is hardened with strict instructions, ordering the model to ignore any user input that attempts to override its core function or security boundaries.
-   **LLM04: Model Denial of Service**: All user-facing text inputs have client-side character limits. This prevents users from sending excessively long requests that could lead to resource exhaustion or high costs.
-   **Data Privacy & Transparency**:
    -   A clear notice is displayed, informing users that their data is processed by Google's AI.
    -   All saved memory palaces are stored exclusively in the user's local browser via IndexedDB. No user-generated content is ever stored on a remote server.

## License

This project is licensed under the MIT License.