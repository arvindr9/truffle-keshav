import { useEffect, useState, useRef } from "react";
import "./App.css";

interface AppProps {
  accessToken: string | null;
}

const App: React.FC<AppProps> = ({ accessToken }) => {
  const [userName, setUserName] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const [text, setText] = useState("");
  const [queue, setQueue] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const textBoxRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!accessToken) {
        return;
      }

      const query = `
        query {
          orgMember {
            name
            roles {
              slug
            }
          }
        }
      `;

      const response = await fetch('https://mothertree.truffle.vip/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': accessToken,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      const orgMember = result.data.orgMember;

      if (orgMember) {
        const roles = orgMember.roles.map((role: { slug: string }) => role.slug);
        setIsCreator(roles.includes('admin') || roles.includes('moderator'));
        setUserName(orgMember.name);
      }
    };

    fetchUserInfo();
  }, [accessToken]);

  useEffect(() => {
    const fetchVoices = () => {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      setVoices(voices);
      if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    // Fetch voices immediately and also set an event listener for when voices change
    fetchVoices();
    window.speechSynthesis.onvoiceschanged = fetchVoices;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[\p{Emoji}\u200D]+/gu, ''); // Remove emojis
    if (filteredValue.length <= 100) {
      setText(filteredValue);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voice = voices.find((v) => v.name === e.target.value);
    setSelectedVoice(voice || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      setQueue([...queue, text.trim()]);
      setText("");
    }
  };

  const handleSkip = () => {
    if (synthRef.current) {
      synthRef.current.onend = null; // Remove the onend event listener
      window.speechSynthesis.cancel(); // Cancel the current speech synthesis
      setQueue((prevQueue) => prevQueue.slice(1)); // Remove the current text from the queue
    }
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      window.speechSynthesis.pause();
    } else {
      window.speechSynthesis.resume();
    }
  };

  const speakText = (text: string) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.onend = () => {
      setQueue((prevQueue) => prevQueue.slice(1));
    };
    synth.speak(utterance);
    synthRef.current = utterance;
  };

  useEffect(() => {
    if (!isPaused && queue.length > 0 && !window.speechSynthesis.speaking) {
      speakText(queue[0]);
    }
  }, [queue, isPaused]);

  return (
    <div>
      <h1>Hello, {userName}</h1>
      <form onSubmit={handleSubmit}>
        <select onChange={handleVoiceChange} value={selectedVoice?.name || ''}>
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type your message"
          ref={textBoxRef}
        />
        <span>{text.length}/100</span>
        <button type="submit">Submit</button>
      </form>
      {isCreator && (
        <div>
          <h2>Queue</h2>
          <ul>
            {queue.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
          <button onClick={handleSkip}>Skip</button>
          <button onClick={handlePause}>{isPaused ? 'Resume' : 'Pause'}</button>
        </div>
      )}
    </div>
  );
};

export default App;
