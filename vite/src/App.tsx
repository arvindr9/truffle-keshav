import { useEffect, useState, useRef } from "react";
import "./App.css";

interface AppProps {
  accessToken: string | null;
}

interface QueueItem {
  userName: string;
  message: string;
}

const App: React.FC<AppProps> = ({ accessToken }) => {
  const [userName, setUserName] = useState("");
  const [text, setText] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const textBoxRef = useRef<HTMLInputElement>(null);

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
      setQueue([...queue, { userName, message: text.trim() }]);
      setText("");
    }
  };

  const handleSkip = () => {
    window.speechSynthesis.cancel();
    setQueue((prevQueue) => prevQueue.slice(1));
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
  };

  useEffect(() => {
    if (queue.length > 0 && !isPaused) {
      const currentItem = queue[0];
      const utterance = new SpeechSynthesisUtterance(`${currentItem.userName} said ${currentItem.message}`);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => {
        setQueue((prevQueue) => prevQueue.slice(1));
      };
    }
  }, [queue, isPaused, selectedVoice]);

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
      <div>
        <h2>Queue</h2>
        <ul>
          {queue.map((item, index) => (
            <li key={index}>{item.userName}: {item.message}</li>
          ))}
        </ul>
        {(userName === 'admin' || userName === 'creator') && (
          <div>
            <button onClick={handleSkip}>Skip</button>
            <button onClick={handlePause}>{isPaused ? 'Resume' : 'Pause'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
