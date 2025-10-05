import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, VolumeUp, Close, SmartToy, GraphicEq } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Fab, Tooltip, Box, Typography, Paper, Zoom, Fade, Chip } from '@mui/material';

const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState('Click to activate voice assistant');
  const [currentCommand, setCurrentCommand] = useState('');
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
    if (wakeWordRecognitionRef.current || !isActive) {
      return; // Already running or not active
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
      recognition.maxAlternatives = 3;
      
      recognition.onresult = (event: any) => {
        if (isProcessingRef.current) return;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          // Check both interim and final results for better responsiveness
          const transcript = result[0].transcript.toLowerCase().trim();
          console.log('🎧 Wake word detection heard:', transcript);
          
          if (result.isFinal || result[0].confidence > 0.7) {
            
            if (transcript.includes('stop rudra') || transcript.includes('stop')) {
              console.log('🛑 Stop command detected!');
              if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
              }
              resetToWakeWordDetection();
              return;
            }
            
            // Check for wake word variations
            const hasWakeWord = transcript.includes('hey rudra') || 
                               transcript.includes('hey, rudra') ||
                               transcript.includes('hey rudra.') ||
                               transcript.includes('hey google') ||
                               transcript.includes('ok google');
                               
            // Check for direct navigation commands
            const hasNavCommand = transcript.includes('navigate') || 
                                 transcript.includes('open') ||
                                 transcript.includes('go to');
                               
            if (hasWakeWord && !isProcessingRef.current) {
              console.log('🔥 Wake word detected:', transcript);
              wakeWordDetectedRef.current = true;
              isProcessingRef.current = true;
              handleWakeWordDetected();
              return;
            } else if (hasNavCommand && !isProcessingRef.current) {
              console.log('🧭 Direct navigation command detected:', transcript);
              wakeWordDetectedRef.current = true;
              isProcessingRef.current = true;
              // Skip greeting and go directly to command processing
              setIsListening(true);
              setStatus('Processing navigation...');
              processCommand(transcript);
              return;
            }
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        if (event.error === 'aborted') {
          console.log('🔄 Wake word detection stopped (normal)');
        } else if (event.error === 'no-speech' || event.error === 'network') {
          console.log('🔄 Wake word detection:', event.error, '- restarting...');
        } else {
          console.error('❌ Wake word detection error:', event.error);
        }
        wakeWordRecognitionRef.current = null;
        // Always restart unless currently processing a command
        if (!isProcessingRef.current) {
          setTimeout(startWakeWordDetection, 1000);
        }
      };
      
      recognition.onend = () => {
        console.log('🔄 Wake word detection ended');
        wakeWordRecognitionRef.current = null;
        if (wakeWordDetectedRef.current) {
          console.log('✅ Wake word detected, not restarting');
        } else {
          console.log('🔄 Wake word not detected, restarting listening');
          setStatus('Always listening for "Hey Rudra"...');
          setTimeout(() => startWakeWordDetection(), 500);
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
    
    setIsVisible(true);
    setIsListening(false);
    setIsSpeaking(true);
    setStatus('Hey! I\'m Rudra');
    
    // Speak greeting
    const greeting = "Hey there! I am Rudra, your voice assistant. How can I help you?";
    const utterance = new SpeechSynthesisUtterance(greeting);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('Speaking...');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isProcessingRef.current) {
        startCommandListening();
      }
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (isProcessingRef.current) {
        startCommandListening();
      }
    };
    
    speechSynthesis.speak(utterance);
  };

  const startCommandListening = () => {
    try {
      setIsListening(true);
      setIsSpeaking(false);
      setStatus('Listening...');
      setCurrentCommand('');
      
      const recognition = new (window as any).webkitSpeechRecognition();
      commandRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Set timeout for command recognition
      const commandTimeout = setTimeout(() => {
        if (commandRecognitionRef.current) {
          console.log('🔄 Command timeout - using test command');
          processCommand('what is FRA');
        }
      }, 5000);
      
      recognition.onresult = (event: any) => {
        clearTimeout(commandTimeout);
        const transcript = event.results[0][0].transcript;
        setCurrentCommand(transcript);
        console.log('📝 Command received:', transcript.replace(/[\r\n\t]/g, ' ').substring(0, 100));
        if (event.results[0].isFinal) {
          setIsListening(false);
          processCommand(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'no-speech' || event.error === 'network') {
          console.log('🔄 Using fallback command');
          processCommand('what is FRA');
        } else if (event.error === 'aborted') {
          // Normal abort, do nothing
        } else {
          console.error('❌ Command recognition error:', event.error);
          setStatus('Could not understand');
          setTimeout(() => resetToWakeWordDetection(), 2000);
        }
      };
      
      recognition.onend = () => {
        clearTimeout(commandTimeout);
        setIsListening(false);
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('❌ Command recognition failed:', error);
      setIsListening(false);
      resetToWakeWordDetection();
    }
  };

  const resetToWakeWordDetection = () => {
    if (commandRecognitionRef.current) {
      commandRecognitionRef.current.abort();
      commandRecognitionRef.current = null;
    }
    
    wakeWordDetectedRef.current = false;
    isProcessingRef.current = false;
    setIsListening(false);
    setIsSpeaking(false);
    setIsVisible(false);
    setCurrentCommand('');
    setStatus('Always listening for "Hey Rudra"...');
    
    // Always restart wake word detection immediately
    setTimeout(() => {
      startWakeWordDetection();
    }, 100);
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
      setIsSpeaking(true);
      response = "Thank you! It was nice talking to you.";
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus('Goodbye!');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsVisible(false);
        // Reset and restart listening immediately
        isProcessingRef.current = false;
        setIsListening(false);
        setStatus('Always listening for "Hey Rudra"...');
        setTimeout(() => {
          startWakeWordDetection();
        }, 1000);
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
      } else if (text.includes('other') || text.includes('another') || text.includes('different') || text.includes('next')) {
        // Handle "navigate other" - cycle through main sections
        const currentPath = window.location.pathname;
        const sections = [
          { path: '/', name: 'Dashboard' },
          { path: '/atlas', name: 'FRA Atlas' },
          { path: '/gis-plot', name: 'Digital GIS Plot' },
          { path: '/data', name: 'Data Management' },
          { path: '/decisions', name: 'Decision Support' },
          { path: '/reports', name: 'Reports & Analytics' }
        ];
        
        const currentIndex = sections.findIndex(s => s.path === currentPath);
        const nextIndex = (currentIndex + 1) % sections.length;
        const nextSection = sections[nextIndex];
        
        response = `Navigating to ${nextSection.name}.`;
        navigationPath = nextSection.path;
        shouldNavigate = true;
      } else {
        response = "I can navigate you to: Dashboard, FRA Atlas, Digital GIS Plot, Data Management, Decision Support, Reports, Profile, Settings, Notifications, or Contact Us. You can also say 'navigate other' to cycle through sections. Please specify where you'd like to go.";
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
    
    setIsListening(false);
    setIsSpeaking(true);
    setStatus('Speaking...');
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
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
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
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('✅ Voice Assistant: Response completed');
      setIsSpeaking(false);
      setStatus('Always listening for "Hey Rudra"...');
      // Immediately restart listening without hiding
      setTimeout(() => {
        resetToWakeWordDetection();
      }, 1000);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setStatus('Speech error');
      setTimeout(() => resetToWakeWordDetection(), 2000);
    };
    
    speechSynthesis.speak(utterance);
  };

  // Auto-start with greeting and always listen
  // useEffect(() => {
  //   setIsActive(true);
  //   setIsSpeaking(true);
  //   setStatus('Starting Rudra...');
    
  //   // Speak startup greeting
  //   const greeting = "Hello! I am Rudra, your voice assistant. I'm always listening for 'Hey Rudra'.";
  //   const utterance = new SpeechSynthesisUtterance(greeting);
  //   utterance.lang = 'en-IN';
  //   utterance.rate = 0.9;
    
  //   utterance.onstart = () => {
  //     setIsSpeaking(true);
  //     setStatus('Rudra speaking...');
  //   };
    
  //   utterance.onend = () => {
  //     setIsSpeaking(false);
  //     setStatus('Always listening for "Hey Rudra"...');
  //     startWakeWordDetection();
  //   };
    
  //   utterance.onerror = () => {
  //     setIsSpeaking(false);
  //     setStatus('Always listening for "Hey Rudra"...');
  //     startWakeWordDetection();
  //   };
    
  //   // Start speaking after a short delay
  //   setTimeout(() => {
  //     speechSynthesis.speak(utterance);
  //   }, 1000);
  // }, []);

  const handleActivate = () => {
    if (!isActive) {
      // Activate voice assistant
      setIsActive(true);
      setStatus('Listening for "Hey Rudra"...');
      startWakeWordDetection();
    } else if (!isListening && !isSpeaking && !isProcessingRef.current) {
      // Manual activation - skip wake word detection
      console.log('🔥 Manual activation triggered!');
      wakeWordDetectedRef.current = true;
      isProcessingRef.current = true;
      handleWakeWordDetected();
    } else {
      // Deactivate voice assistant
      setIsActive(false);
      setIsListening(false);
      setIsSpeaking(false);
      setStatus('Click to activate voice assistant');
      if (wakeWordRecognitionRef.current) {
        wakeWordRecognitionRef.current.stop();
      }
      if (commandRecognitionRef.current) {
        commandRecognitionRef.current.stop();
      }
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    }
  };

  return (
    <>
      {/* Always visible activation button with animations */}
      {!isVisible && (
        <Fab
          onClick={() => {
            console.log('🔥 Voice Assistant Activated!');
            setIsVisible(true);
            setIsListening(true);
            setStatus('Hi! How can I help you?');
            
            // Speak greeting immediately
            const greeting = "Hi! How can I help?";
            const utterance = new SpeechSynthesisUtterance(greeting);
            utterance.rate = 0.9;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
              setIsSpeaking(false);
              startCommandListening();
            };
            speechSynthesis.speak(utterance);
          }}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1300,
            width: 72,
            height: 72,
            background: isListening 
              ? 'radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%)'
              : isSpeaking
              ? 'radial-gradient(circle, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: isListening
              ? '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)'
              : isSpeaking
              ? '0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)'
              : '0 8px 32px rgba(102, 126, 234, 0.4)',
            border: isListening || isSpeaking ? '3px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.2)',
            transform: isListening || isSpeaking ? 'scale(1.1)' : 'scale(1)',
            '&:hover': { 
              transform: isListening || isSpeaking ? 'scale(1.15)' : 'scale(1.05)',
              boxShadow: isListening
                ? '0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(59, 130, 246, 0.6)'
                : isSpeaking
                ? '0 0 40px rgba(34, 197, 94, 1), 0 0 80px rgba(34, 197, 94, 0.6)'
                : '0 12px 40px rgba(102, 126, 234, 0.6)'
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: isListening 
              ? 'listeningPulse 2s ease-in-out infinite'
              : isSpeaking
              ? 'speakingPulse 1s ease-in-out infinite'
              : 'none',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: isListening || isSpeaking
                ? 'conic-gradient(from 0deg, #3b82f6, #22c55e, #f59e0b, #3b82f6)'
                : 'none',
              animation: (isListening || isSpeaking) ? 'rotate 3s linear infinite' : 'none',
              zIndex: -1,
              opacity: 0.6
            },
            '@keyframes listeningPulse': {
              '0%, 100%': { 
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
              },
              '50%': { 
                boxShadow: '0 0 40px rgba(59, 130, 246, 1), 0 0 80px rgba(59, 130, 246, 0.6)'
              }
            },
            '@keyframes speakingPulse': {
              '0%, 100%': { 
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)'
              },
              '50%': { 
                boxShadow: '0 0 40px rgba(34, 197, 94, 1), 0 0 80px rgba(34, 197, 94, 0.6)'
              }
            },
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        >
          {isListening ? (
            <GraphicEq sx={{ 
              fontSize: 36, 
              color: 'white',
              animation: 'bounce 1s infinite'
            }} />
          ) : isSpeaking ? (
            <VolumeUp sx={{ 
              fontSize: 36, 
              color: 'white',
              animation: 'speakBounce 0.8s ease-in-out infinite'
            }} />
          ) : (
            <Mic sx={{ fontSize: 36, color: 'white' }} />
          )}
        </Fab>
      )}
      
      {/* Professional Assistant Interface */}
      <Box sx={{ 
        position: 'fixed', 
        bottom: 80, 
        right: 24, 
        zIndex: 1300,
        transform: isVisible ? 'translateY(0)' : 'translateY(100px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <Paper
          elevation={24}
          sx={{
            mb: 2,
            p: 3,
            minWidth: 360,
            maxWidth: 400,
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 50%, rgba(15,23,42,0.95) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            color: 'white',
            borderRadius: 5,
            border: '1px solid rgba(148,163,184,0.2)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
            transform: isListening || isSpeaking ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: isListening 
                ? 'linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #06b6d4)'
                : isSpeaking
                ? 'linear-gradient(90deg, #22c55e, #16a34a, #15803d, #22c55e)'
                : 'linear-gradient(90deg, #64748b, #94a3b8)',
              backgroundSize: '200% 100%',
              animation: (isListening || isSpeaking) ? 'shimmer 2s infinite' : 'none',
            },
            '@keyframes shimmer': {
              '0%': { backgroundPosition: '-200% 0' },
              '100%': { backgroundPosition: '200% 0' }
            }
          }}
        >
          <Box display="flex" alignItems="center" gap={3}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: isListening 
                  ? 'conic-gradient(from 0deg, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #06b6d4)'
                  : isSpeaking
                  ? 'conic-gradient(from 0deg, #22c55e, #16a34a, #15803d, #22c55e)'
                  : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: isListening 
                  ? '0 0 30px rgba(59, 130, 246, 0.5)'
                  : isSpeaking
                  ? '0 0 30px rgba(34, 197, 94, 0.5)'
                  : '0 8px 25px rgba(0,0,0,0.3)',
                animation: (isListening || isSpeaking) ? 'avatarPulse 2s infinite, rotate 4s linear infinite' : 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -2,
                  borderRadius: '50%',
                  background: (isListening || isSpeaking)
                    ? 'conic-gradient(from 0deg, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #06b6d4)'
                    : 'none',
                  animation: (isListening || isSpeaking) ? 'rotate 3s linear infinite' : 'none',
                  zIndex: -1,
                },
                '@keyframes avatarPulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' }
                },
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              {isListening ? (
                <GraphicEq sx={{ fontSize: 24, color: 'white', zIndex: 1, animation: 'bounce 1s infinite' }} />
              ) : isSpeaking ? (
                <VolumeUp sx={{ fontSize: 24, color: 'white', zIndex: 1, animation: 'speakBounce 0.8s ease-in-out infinite' }} />
              ) : (
                <SmartToy sx={{ fontSize: 24, color: 'white', zIndex: 1 }} />
              )}
            </Box>
            <Box flex={1}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                Rudra
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                {status}
              </Typography>
              {currentCommand && (
                <Typography variant="body2" sx={{ opacity: 0.6, fontSize: '0.75rem', fontStyle: 'italic', mt: 0.5 }}>
                  "{currentCommand}"
                </Typography>
              )}
            </Box>
            <Close
              onClick={() => {
                setIsVisible(false);
                resetToWakeWordDetection();
              }}
              sx={{
                fontSize: 20,
                opacity: 0.6,
                cursor: 'pointer',
                '&:hover': { opacity: 1 }
              }}
            />
          </Box>
          {(isListening || isSpeaking) && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1,
              mt: 2,
              borderRadius: 3,
              background: isListening 
                ? 'rgba(59, 130, 246, 0.1)'
                : 'rgba(34, 197, 94, 0.1)',
              border: isListening 
                ? '1px solid rgba(59, 130, 246, 0.2)'
                : '1px solid rgba(34, 197, 94, 0.2)'
            }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    backgroundColor: isListening ? '#3b82f6' : '#22c55e',
                    borderRadius: 2,
                    animation: `modernWave${i} ${isListening ? '1.2s' : '0.8s'} ease-in-out infinite`,
                    boxShadow: isListening 
                      ? '0 0 8px rgba(59, 130, 246, 0.4)'
                      : '0 0 8px rgba(34, 197, 94, 0.4)',
                    [`@keyframes modernWave${i}`]: {
                      '0%, 100%': { height: `${8 + (i % 3) * 4}px`, opacity: 0.4 },
                      '50%': { height: `${20 + (i % 4) * 8}px`, opacity: 1 }
                    }
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }
          @keyframes speakBounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}
      </style>
    </>
  );
};

export default VoiceAssistant;