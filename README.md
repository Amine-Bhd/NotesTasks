# Note-Doo Haven 📝✅

A powerful, cross-platform notes and tasks management application built with **React Native (Expo)** and **Supabase**. Designed to work seamlessly on Android and the Web.

## 🌟 Features

*   **Notes Management:** Rich notes with clickable links (view/edit modes).
*   **Smart Links:** Special reference system (e.g., `[1]`) that links to external URLs.
*   **Tasks & Subtasks:** Hierarchical task management.
    *   *Cascading Completion:* Checking a parent checks all children.
    *   *Smart Undo:* Unchecking a parent restores the exact state of children.
*   **Bidirectional Linking:** Link Notes to Tasks and vice-versa.
*   **Cloud Sync:** Real-time synchronization using Supabase.
*   **Dark Mode:** Fully supported dark theme for both notes and tasks.
*   **Cross-Platform:** Runs as a Native Android App and a Responsive Web App.

## 🛠 Tech Stack

*   **Framework:** React Native (Expo SDK 54)
*   **Language:** TypeScript
*   **State Management:** Zustand
*   **Backend/Auth:** Supabase
*   **Navigation:** React Navigation (Native Stack)
*   **Storage:** SecureStore (Native) / AsyncStorage (Web)

## 🚀 Getting Started

### Prerequisites

*   Node.js (LTS)
*   npm
*   A Supabase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd NoteDooHaven
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory (do not commit this file):
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### Running the App

*   **Start the Development Server:**
    ```bash
    npx expo start
    ```
    *   Press `a` for Android (emulator or connected device).
    *   Press `w` for Web (opens in browser).

## 📦 Deployment

### Android (APK)

We use **EAS Build** to generate the Android APK.

1.  **Configure Secrets:**
    ```bash
    npx eas secret:push
    ```
    (Upload your Supabase URL and Key).

2.  **Build:**
    ```bash
    eas build -p android --profile preview
    ```
3.  Download the APK link provided by EAS.

### Web

1.  **Export Static Bundle:**
    ```bash
    npx expo export -p web
    ```
    This creates a `dist` directory.

2.  **Deploy:**
    *   Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop).
    *   Or connect your repo to Vercel/Netlify for auto-deployment.

## 🔒 Security Note

This app uses Row Level Security (RLS) on Supabase. While the API keys are visible in the frontend build, your data is secured because users can only access their own records.