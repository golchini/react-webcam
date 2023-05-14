import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';

// Constant URLs and Tokens
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;
const ANALYSIS_URL = process.env.REACT_APP_ANALYSIS_URL;
const REPORT_URL = process.env.REACT_APP_REPORT_URL;
const TOKEN = process.env.REACT_APP_TOKEN;
const STORAGE_BUCKET = process.env.REACT_APP_STORAGE_BUCKET;
const DID_URL = process.env.REACT_APP_DID_URL;


const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function WebcamVideo() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const handleDataAvailable = useCallback(({ data }) => {
    if (data.size > 0) setRecordedChunks((prev) => prev.concat(data));
  }, []);

  const handleStartCaptureClick = useCallback(async () => {
    setCapturing(true);
    
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const combinedStream = new MediaStream();
    
    // Add video track from webcam stream
    if (webcamRef.current && webcamRef.current.stream) {
      webcamRef.current.stream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
    }
    
    // Add audio track from audio stream
    audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
    
    mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
    mediaRecorderRef.current.start();
  }, [webcamRef, handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, []);

  const handleDownload = useCallback(async () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const file = new File([blob], `${uuidv4()}.webm`, { type: "video/webm" });
      const filename = `${uuidv4()}.mp4`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filename, file);
      if (error) console.error('Error uploading file:', error);
      else {
        const { data: { publicUrl } } = await supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
        console.log("publicURL", publicUrl);

        try {
          const transcript = await fetch(ANALYSIS_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "video": publicUrl,
              "token": TOKEN
            }),
          });
          const firstData = await transcript.json();
          console.log('Response:', firstData.message);;

          const advice = await fetch(REPORT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "message": firstData.message
            }),
          });
          const adviceText = await advice.json();
          console.log('Response:', adviceText.message);
          const responseVideo = await fetch(DID_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "message": adviceText.message
            }),
          });
          const Video= await responseVideo.json();
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = Video.link;
      a.download = Video.link;
      a.click();
      window.URL.revokeObjectURL(Video.link);
      setRecordedChunks([]);
        } catch (error) {
          console.error(error);
        }
      }
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  const videoConstraints = {
    width: 420,
    height: 420,
    facingMode: "user",
  };

  return (
    <div className="Container">
      <Webcam
        height={400}
        width={400}
        audio={false}
        mirrored={true}
        ref={webcamRef}
        videoConstraints={videoConstraints}
      />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop Capture</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Capture</button>
      )}
      {recordedChunks.length > 0 && (
        <button onClick={handleDownload}>Download</button>
      )}
    </div>
  );
}
