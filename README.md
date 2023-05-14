# Webcam Video Capture and Analysis

This project captures video and audio from your webcam, uploads it to a Supabase storage bucket, and sends the video to an API for analysis.

## Setup

1. First, clone this repository to your local machine using `git clone`.

2. Install all the necessary packages using `npm install`.

3. In the `WebcamVideo.js` file, replace the `SUPABASE_URL`, `SUPABASE_KEY`, `ANALYSIS_URL`, `REPORT_URL`, `TOKEN`, and `STORAGE_BUCKET` constants with your own values.

## Usage

Run `npm start` to start the application. You'll be able to capture video and audio from your webcam.

## Features

- **Start Capture:** Starts recording video from your webcam and audio from your microphone.

- **Stop Capture:** Stops recording.

- **Download:** Uploads the captured video to a Supabase storage bucket, sends the video to an API for analysis, and logs the response.

## Tech Stack

This project uses the following technologies:

- React.js for the frontend.
- react-webcam for webcam access.
- Supabase for storing the recorded video.
- uuid for generating unique identifiers for the videos.
- Two different APIs for video analysis and generating reports.