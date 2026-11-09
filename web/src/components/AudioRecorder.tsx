import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

// Records through MediaRecorder with the Opus codec at a low bitrate —
// opus is already a compressed, voice-tuned codec, so a ~24kbps target
// keeps multi-minute voice notes small without extra server-side work.
const RECORDER_OPTIONS: MediaRecorderOptions = {
  mimeType: "audio/webm;codecs=opus",
  audioBitsPerSecond: 24_000,
};

export function AudioRecorder({ onRecorded }: { onRecorded: (file: File) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const supported = MediaRecorder.isTypeSupported(RECORDER_OPTIONS.mimeType!);
    const recorder = new MediaRecorder(stream, supported ? RECORDER_OPTIONS : undefined);
    chunks.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type });
      onRecorded(file);
    };
    recorder.start();
    mediaRecorder.current = recorder;
    setRecording(true);
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop() {
    mediaRecorder.current?.stop();
    mediaRecorder.current = null;
    clearInterval(timer.current);
    setRecording(false);
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <button
      onClick={recording ? stop : start}
      className={`flex items-center gap-1.5 text-sm px-2 py-1.5 rounded-lg hover-surface ${recording ? "text-red-500" : ""}`}
      title={recording ? "Stop recording" : "Record a voice note"}
    >
      {recording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />}
      {recording ? `${mm}:${ss}` : "Voice note"}
    </button>
  );
}
