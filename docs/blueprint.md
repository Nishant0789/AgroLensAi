# **App Name**: AgroLens AI

## Core Features:

- Firebase Authentication: Secure user authentication with Google Sign-In and email using Firebase Auth, featuring a sliding animation for login/signup.
- AI Crop Scanner: Analyze crop images using the Gemini 1.5 Flash API via Firebase AI Logic to identify diseases and provide solutions in the user's language.
- Geo-Location Alerts: Utilize browser Geolocation API and Cloud Firestore with Geo-hashing to store disease locations and provide 'Nearby Alerts' to warn other users within a 5km radius.
- Farmer Dashboard (Field Journal): A private section where farmers can view past scans, dates, and AI diagnoses stored in Firestore.
- Weather Module: Display a dynamic 7-day weather forecast using a weather API (like OpenWeather) with animated weather icons.
- Agro-Consultant Chatbot: A persistent AI chat assistant powered by Gemini that answers farming questions and maintains chat context.
- "Newbie to Pro" Guide: A structured onboarding module that asks for location and crop type, and then utilizes Gemini to generate a custom 'Growth Roadmap' based on local soil/weather patterns using a Stepper UI. The roadmap LLM will use browser location and farmer's crop type as a tool to determine local growing conditions.

## Style Guidelines:

- Primary color: Deep forest green (#228B22) for a 'Nature-Tech' aesthetic.
- Background color: Soft earth tone (#F5F5DC) to complement the natural theme.
- Accent color: Light sage green (#98FB98) to highlight interactive elements and calls to action.
- Body and headline font: 'Inter', a sans-serif for a modern, machined look, used in headlines and body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use animated icons related to weather and crop conditions to enhance the visual appeal and user experience.
- Incorporate smooth page transitions using Fade/Slide effects. Add hover effects on cards using scale up and shadow animations, and use Lottie animations for 'Analyzing...' states in the scanner.