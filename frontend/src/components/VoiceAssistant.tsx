import React, { useState, useRef, useEffect } from 'react';
import { Mic } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Click to activate voice assistant');
  const wakeWordRecognitionRef = useRef<any>(null);
  const commandRecognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const wakeWordDetectedRef = useRef(false);
  const navigate = useNavigate();

  // Cleanup on component unmount
  useEffect(() => {
    
    const handleBeforeUnload = () => {
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
      }
      if (commandRecognitionRef.current) {
        commandRecognitionRef.current.stop();
      }
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const startWakeWordDetection = async () => {
    if (wakeWordRecognitionRef.current) {
      return; // Already running
    }
    
    try {
      // Check microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      
      const recognition = new (window as any).webkitSpeechRecognition();
      wakeWordRecognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        if (isProcessingRef.current) return;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const transcript = result[0].transcript.toLowerCase().trim();
            console.log('🎧 Wake word detection heard:', transcript);
            
            if (transcript.includes('stop rudra') || transcript.includes('stop')) {
              console.log('🛑 Stop command detected!');
              if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
              }
              resetToWakeWordDetection();
              return;
            }
            
            if (transcript.includes('hey rudra') && !isProcessingRef.current) {
              console.log('🔥 Wake word "Hey Rudra" detected!');
              wakeWordDetectedRef.current = true;
              isProcessingRef.current = true;
              handleWakeWordDetected();
              return;
            }
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        if (event.error === 'aborted') {
          console.log('🔄 Wake word detection stopped (normal)');
        } else {
          console.error('❌ Wake word detection error:', event.error);
        }
        wakeWordRecognitionRef.current = null;
        if (event.error !== 'aborted' && !isListening) {
          setTimeout(startWakeWordDetection, 2000);
        }
      };
      
      recognition.onend = () => {
        console.log('🔄 Wake word detection ended');
        wakeWordRecognitionRef.current = null;
        if (wakeWordDetectedRef.current) {
          console.log('✅ Wake word detected, not restarting');
        } else {
          console.log('🔄 Wake word not detected, click to try again');
          setStatus('Click to start listening for "Hey Rudra"');
        }
      };
      
      recognition.onstart = () => {
        console.log('🎧 Speech recognition started successfully');
      };
      
      recognition.onspeechstart = () => {
        console.log('🎧 Speech detected');
      };
      
      recognition.onspeechend = () => {
        console.log('🎧 Speech ended');
      };
      
      recognition.start();
      console.log('🎧 Started listening for "Hey Rudra"...');
      
    } catch (error) {
      console.error('❌ Wake word detection error:', error);
      if (error.name === 'NotAllowedError') {
        setStatus('Microphone permission denied. Please allow microphone access.');
      } else {
        setStatus('Wake word detection not supported');
      }
    }
  };

  const handleWakeWordDetected = () => {
    // Stop wake word detection
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.abort();
      wakeWordRecognitionRef.current = null;
    }
    
    setIsListening(true);
    setStatus('Hey! I\'m listening...');
    
    // Speak greeting
    const greeting = "Hey there! I am Rudra, your voice assistant. How can I help you?";
    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.lang = 'en-IN';
    
    utterance.onend = () => {
      if (isProcessingRef.current) {
        startCommandListening();
      }
    };
    
    utterance.onerror = () => {
      if (isProcessingRef.current) {
        startCommandListening();
      }
    };
    
    speechSynthesis.speak(utterance);
  };

  const startCommandListening = () => {
    try {
      setStatus('Listening for your command...');
      
      const recognition = new (window as any).webkitSpeechRecognition();
      commandRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US,hi-IN,mr-IN,te-IN,ta-IN,ml-IN,or-IN';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Command received:', transcript);
        processCommand(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Command recognition error:', event.error);
        setStatus('Could not understand command');
        resetToWakeWordDetection();
      };
      
      recognition.onend = () => {
        if (status === 'Listening for your command...') {
          setStatus('No command detected');
          resetToWakeWordDetection();
        }
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('❌ Command recognition failed:', error);
      resetToWakeWordDetection();
    }
  };

  const resetToWakeWordDetection = () => {
    if (commandRecognitionRef.current) {
      commandRecognitionRef.current.abort();
      commandRecognitionRef.current = null;
    }
    
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.abort();
      wakeWordRecognitionRef.current = null;
    }
    
    wakeWordDetectedRef.current = false;
    isProcessingRef.current = false;
    setIsListening(false);
    setStatus('Listening for "Hey Rudra"...');
    
    // Restart wake word detection
    setTimeout(() => {
      if (!wakeWordRecognitionRef.current) {
        startWakeWordDetection();
      }
    }, 500);
  };



  const processCommand = async (transcript: string) => {
    console.log('🤖 Voice Assistant: Processing command...');
    setStatus('Processing command...');
    
    const text = transcript.toLowerCase();
    let response = "";
    let shouldNavigate = false;
    let navigationPath = '';
    
    // Check for stop/exit commands
    if (text.includes('thank you rudra') || text.includes('stop rudra') || text.includes('goodbye rudra')) {
      // Immediately stop any ongoing speech
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      response = "Thank you! It was nice talking to you. I'll stop listening now. Say 'Hey Rudra' again if you need me.";
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'en-IN';
      utterance.onend = () => {
        setStatus('Stopped. Say "Hey Rudra" to activate.');
        // Stop all recognition completely
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.stop();
          wakeWordRecognitionRef.current = null;
        }
        if (commandRecognitionRef.current) {
          commandRecognitionRef.current.stop();
          commandRecognitionRef.current = null;
        }
        isProcessingRef.current = false;
        setIsListening(false);
        // Restart wake word detection after 2 seconds
        setTimeout(() => {
          if (!isProcessingRef.current) {
            setStatus('Listening for "Hey Rudra"...');
            startWakeWordDetection();
          }
        }, 2000);
      };
      speechSynthesis.speak(utterance);
      return;
    }
    
    // Check for immediate stop commands
    if (text.includes('stop') || text.includes('thank you') || text.includes('thanks') || text.includes('goodbye') || text.includes('stop listening')) {
      // Immediately stop any ongoing speech
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      resetToWakeWordDetection();
      return;
    }
    
    // Navigation commands - check for navigation keywords first
    if (text.includes('navigate') || text.includes('go to') || text.includes('open') || text.includes('please navigate') || text.includes('get to') || text.includes('want to navigate') || text.includes('take me to')) {
      console.log('🧭 Navigation command detected:', text);
      if (text.includes('report') || text.includes('analysis') || text.includes('circular')) {
        console.log('🧭 Reports navigation triggered');
        response = "Navigating to Reports and Analysis section.";
        navigationPath = '/reports';
        shouldNavigate = true;
      } else if (text.includes('dashboard') || text.includes('home')) {
        response = "Navigating to Dashboard.";
        navigationPath = '/';
        shouldNavigate = true;
      } else if (text.includes('atlas') || text.includes('map') || text.includes('spatial') || text.includes('visualization')) {
        response = "Opening FRA Atlas.";
        navigationPath = '/atlas';
        shouldNavigate = true;
      } else if (text.includes('gis') || text.includes('plot') || text.includes('digital')) {
        response = "Opening Digital GIS Plot.";
        navigationPath = '/gis-plot';
        shouldNavigate = true;
      } else if (text.includes('data') || text.includes('management') || text.includes('training') || text.includes('standardization') || text.includes('digitization')) {
        response = "Opening Data Management.";
        navigationPath = '/data';
        shouldNavigate = true;
      } else if (text.includes('decision') || text.includes('support') || text.includes('rules') || text.includes('guidelines')) {
        response = "Opening Decision Support System.";
        navigationPath = '/decisions';
        shouldNavigate = true;
      } else if (text.includes('profile') || text.includes('account')) {
        response = "Opening your Profile.";
        navigationPath = '/profile';
        shouldNavigate = true;
      } else if (text.includes('setting') || text.includes('configuration')) {
        response = "Opening Settings.";
        navigationPath = '/settings';
        shouldNavigate = true;
      } else if (text.includes('notification') || text.includes('alerts')) {
        response = "Opening Notifications.";
        navigationPath = '/notifications';
        shouldNavigate = true;
      } else if (text.includes('contact') || text.includes('help') || text.includes('support') || text.includes('contact us') || text.includes('contact a section')) {
        response = "Opening Contact Us page.";
        navigationPath = '/contact';
        shouldNavigate = true;
      } else {
        response = "I can navigate you to: Dashboard, FRA Atlas, Digital GIS Plot, Data Management, Decision Support, Reports, Profile, Settings, Notifications, or Contact Us. Please specify where you'd like to go.";
      }
    }
    // For all other questions, use Gemini AI
    else {
      try {
        console.log('🤖 Voice Assistant: Asking Gemini AI...');
        setStatus('Asking AI...');
        
        const apiResponse = await fetch(`${process.env.REACT_APP_API_URL}/voice/ask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            question: transcript,
            sessionId: 'voice-session-' + Date.now()
          })
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          response = data.answer;
          console.log('✅ Voice Assistant: Got AI response');
        } else {
          response = "I'm sorry, I couldn't get an answer right now. Please try again.";
        }
      } catch (error) {
        console.error('❌ Voice Assistant: AI request failed:', error);
        response = "I'm having trouble connecting to my AI brain. Please try again.";
      }
    }
    
    setStatus('Rudra speaking...');
    console.log('🔊 Voice Assistant: Speaking response:', response);
    
    // Navigate if needed
    if (shouldNavigate) {
      console.log('🧭 Navigation will occur to:', navigationPath);
      setTimeout(() => {
        console.log('🧭 Voice Assistant: Navigating to:', navigationPath);
        navigate(navigationPath);
      }, 2000);
    }
    
    // Detect language and use appropriate TTS
    const utterance = new SpeechSynthesisUtterance(response);
    
    // Auto-detect language for TTS
    if (/[ऀ-ॿ]/.test(response)) {
      utterance.lang = 'hi-IN'; // Hindi
    } else if (/[ఀ-౿]/.test(response)) {
      utterance.lang = 'te-IN'; // Telugu
    } else if (/[ଅ-୰]/.test(response)) {
      utterance.lang = 'or-IN'; // Odia
    } else if (/[ஂ-௺]/.test(response)) {
      utterance.lang = 'ta-IN'; // Tamil
    } else if (/[ം-ൿ]/.test(response)) {
      utterance.lang = 'ml-IN'; // Malayalam
    } else if (/[ऀ-ॿ]/.test(response)) {
      utterance.lang = 'mr-IN'; // Marathi
    } else {
      utterance.lang = 'en-IN'; // English (Indian accent)
    }
    
    console.log('🔊 Using TTS language:', utterance.lang);
    
    utterance.onend = () => {
      resetToWakeWordDetection();
      console.log('✅ Voice Assistant: Response completed, voice assistant deactivated');
    };
    speechSynthesis.speak(utterance);
  };

  // Auto-start wake word detection on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isListening && !isProcessingRef.current && !wakeWordRecognitionRef.current) {
        setStatus('Listening for "Hey Rudra"...');
        startWakeWordDetection();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleActivate = () => {
    if (!isListening && !isProcessingRef.current && !wakeWordRecognitionRef.current) {
      wakeWordDetectedRef.current = false;
      setStatus('Listening for "Hey Rudra"...');
      startWakeWordDetection();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-50" style={{ marginTop: '100px' }}>
      <div 
        className="bg-white rounded-lg shadow-lg p-4 mb-2 min-w-[200px] cursor-pointer hover:shadow-xl transition-shadow"
        onClick={handleActivate}
      >
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Mic sx={{ 
            fontSize: 20, 
            color: isListening ? '#ef4444' : '#6b7280',
            animation: isListening ? 'pulse 1s infinite' : 'none'
          }} />
          <span className={isListening ? 'text-red-500 font-medium' : ''}>
            🤖 {status}
          </span>
        </div>
        {isListening && (
          <div className="mt-2 text-xs text-center text-gray-500">
            Say "thank you" to stop
          </div>
        )}
        {!isListening && !status.includes('Listening') && (
          <div className="mt-2 text-xs text-center text-blue-500">
            Click to start listening
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;