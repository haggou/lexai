import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaStop, FaHome, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import './VoiceAgentPage.css';

const VoiceAgentPage = () => {
    const navigate = useNavigate();

    // States
    const [status, setStatus] = useState('idle'); // idle, listening, speaking, connecting
    const [transcript, setTranscript] = useState("Tap Orb to Start Conversation");
    const [isMuted, setIsMuted] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [billingInfo, setBillingInfo] = useState(null);

    // Refs
    const wsRef = useRef(null);
    const audioContextRef = useRef(null);
    const processorRef = useRef(null);
    const globalStreamRef = useRef(null);
    const audioQueue = useRef([]);
    const isPlayingRef = useRef(false);

    // Visualizer & Speech Refs
    const canvasRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const recognitionRef = useRef(null);

    // Refs
    // ...
    const statusRef = useRef('idle'); // Track status in ref for closures
    const autoStartRef = useRef(false);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    // ...

    // 1. Initialize Audio Context on Mount
    useEffect(() => {
        // Initialize AudioContext immediately to be ready
        // Standardize on 16kHz for Speech AI compatibility
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

        // Setup Visualizer Analyser
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Auto-Connect on load
        connect();

        return () => {
            if (wsRef.current) wsRef.current.close();
            stopRecording();
            if (audioContextRef.current) audioContextRef.current.close();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Queue & Play Audio (Output)
    const playAudioQueue = () => {
        if (!audioContextRef.current || isPlayingRef.current || audioQueue.current.length === 0) return;

        isPlayingRef.current = true;
        const chunk = audioQueue.current.shift();

        // Convert Base64 to ArrayBuffer
        const binaryString = window.atob(chunk);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // PCM 16-bit 24kHz decode
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 16000);
        audioBuffer.getChannelData(0).set(float32Array);

        if (status !== 'speaking') setStatus('speaking');

        // Connect for visualization during playback too? 
        // Ideally we want to visualize what AI is saying too, but for now let's focus on Mic.
        // To visualize output, we'd need to connect source -> analyser -> dest.

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;

        // Connect to Analyser for output visualization
        if (analyserRef.current) {
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            drawVisualizer(); // Ensure loop is running
        } else {
            source.connect(audioContextRef.current.destination);
        }

        source.onended = () => {
            isPlayingRef.current = false;
            // Recursively play next chunk if available
            if (audioQueue.current.length > 0) {
                playAudioQueue();
            } else {
                if (status === 'speaking') setStatus('listening');
            }
        };
        source.start();
    };

    // 3. Connect WebSocket
    const connect = () => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;

        setStatus('connecting');
        setTranscript("Connecting to Legal AI...");

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userId = userInfo ? userInfo._id : 'anonymous'; // Still needed for local checks
        const token = userInfo ? userInfo.token : null;

        let wsUrl = `${protocol}//${window.location.host.split(':')[0]}:3000/live-avatar`;
        if (token) {
            wsUrl += `?token=${token}`;
        }

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("Connected to Live Backend");
            setIsConnected(true);
            setTranscript("Connected. Tap Orb to Speak.");

            // Reset Session Cost
            if (userId !== 'anonymous') {
                setBillingInfo({ sessionCost: 0, balance: userInfo.walletBalance || 0 });
            }

            if (autoStartRef.current) {
                setStatus('listening');
                startRecording();
                autoStartRef.current = false;
            } else {
                setStatus('idle');
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Handle Billing Update
                if (data.type === 'billing') {
                    setBillingInfo(prev => ({
                        sessionCost: (prev?.sessionCost || 0) + data.cost,
                        balance: data.balance
                    }));
                    return; // Skip processing as audio
                }

                if (data.error) {
                    setTranscript(`Error: ${data.error}`);
                    // Don't auto-disconnect on simple errors, but if severe:
                    if (data.error.includes('Balance') || data.error.includes('Auth')) {
                        setStatus('idle');
                        stopRecording();
                    }
                    return;
                }

                // Handle Audio from Gemini
                if (data.serverContent?.modelTurn?.parts) {
                    const parts = data.serverContent.modelTurn.parts;
                    parts.forEach(part => {
                        if (part.inlineData && part.inlineData.data) {
                            audioQueue.current.push(part.inlineData.data);
                            playAudioQueue();
                        }
                    });
                }
            } catch (e) {
                console.error("Parse Error", e);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            console.log("WS Closed", event.code, event.reason);

            // Auto Reconnect if it wasn't a manual close and we were active
            if (status === 'listening' || status === 'speaking') {
                setTranscript("Connection lost. Reconnecting...");
                setTimeout(() => {
                    autoStartRef.current = true; // Auto start mic again
                    connect();
                }, 1000);
            } else {
                setTranscript("Disconnected. Tap to Reconnect.");
                setStatus('idle');
                stopRecording();
            }
        };

        ws.onerror = (e) => {
            console.error("WS Error", e);
            ws.close();
        };

        wsRef.current = ws;
    };

    // --- Visualization Logic ---
    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (status === 'idle') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrameRef.current);
                return;
            }

            animationFrameRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 90; // Match Orb size roughly

            ctx.beginPath();
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 0.6;
                const angle = (i * 2 * Math.PI) / bufferLength;

                // Circular Visualization
                const x = centerX + Math.cos(angle) * (radius + barHeight);
                const y = centerY + Math.sin(angle) * (radius + barHeight);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = status === 'listening' ? '#00ff88' : '#00d2ff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner circle glitch effect
            if (Math.random() > 0.9) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius + Math.random() * 10, 0, 2 * Math.PI);
                ctx.strokeStyle = `rgba(0, 255, 136, ${Math.random() * 0.5})`;
                ctx.stroke();
            }
        };

        draw();
    };

    // 4. Start Recording (Input)
    const startRecording = async () => {
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            globalStreamRef.current = stream;

            setStatus('listening');
            setTranscript("Listening...");

            const source = audioContextRef.current.createMediaStreamSource(stream);

            // Connect to Visualizer
            if (analyserRef.current) source.connect(analyserRef.current);
            drawVisualizer(); // Start Drawing

            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to Int16
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }

                    // Convert to Base64
                    const buffer = pcmData.buffer;
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64 = window.btoa(binary);

                    const msg = {
                        realtimeInput: { mediaChunks: [{ mimeType: "audio/pcm", data: base64 }] }
                    };
                    wsRef.current.send(JSON.stringify(msg));
                }
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
            processorRef.current = processor;

            // --- Realtime Transcription via SpeechRecognition (Parallel) ---
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-IN'; // Default

                recognition.onresult = (e) => {
                    let interim = '';
                    let final = '';
                    for (let i = e.resultIndex; i < e.results.length; ++i) {
                        if (e.results[i].isFinal) {
                            final += e.results[i][0].transcript;
                        } else {
                            interim += e.results[i][0].transcript;
                        }
                    }
                    // Update UI with latest text
                    const displayText = final || interim;
                    if (displayText) setTranscript(displayText);
                };

                recognition.onerror = (e) => console.log("Speech Recog Error", e); // Ignore
                recognition.start();
                recognitionRef.current = recognition;
            }

        } catch (err) {
            console.error("Mic Error", err);
            setTranscript("Microphone Access Denied");
            setStatus('idle');
        }
    };

    const stopRecording = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (globalStreamRef.current) {
            globalStreamRef.current.getTracks().forEach(t => t.stop());
            globalStreamRef.current = null;
        }

        // Stop Speech Recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }

        if (status === 'listening') setStatus('idle');
        setTranscript(isConnected ? "Tap Orb to Speak" : "Tap to Connect");
    };

    // Main Toggle Handler (Simpler Logic)
    const handleOrbClick = () => {
        if (status === 'connecting') return; // Wait

        if (!isConnected) {
            autoStartRef.current = true;
            connect();
            return;
        }

        if (status === 'listening') {
            stopRecording();
        } else if (status === 'speaking') {
            stopRecording();
            audioQueue.current = [];
            isPlayingRef.current = false;
            setStatus('idle');
        } else {
            startRecording();
        }
    };

    return (
        <div className="voice-agent-container">
            <div className="voice-bg-grid"></div>

            {/* Visualizer Canvas Layer */}
            <canvas
                ref={canvasRef}
                width={800}
                height={800}
                style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, pointerEvents: 'none' }}
            />

            {/* Header */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 20 }}>
                <button onClick={() => navigate('/legal-assistant')} className="control-btn" style={{ width: 50, height: 50 }}>
                    <FaHome />
                </button>
            </div>

            {/* Status (Top Right or Center) */}
            <div className={`status-indicator ${status}`}>
                {status === 'connecting' ? 'CONNECTING...' : (
                    status === 'idle' && isConnected ? 'READY' : status.toUpperCase()
                )}
            </div>

            {/* THE ORB - Main Interaction Point */}
            <div className="orb-container" onClick={handleOrbClick} style={{ cursor: 'pointer' }}>
                <div className={`orb ${status} ${!isConnected ? 'disconnected' : ''}`}></div>
            </div>

            <div className="transcript-container">
                <div className="ai-transcript">
                    {transcript}
                </div>
            </div>

            {/* Controls */}
            <div className="controls-container">
                <button
                    className={`control-btn mute ${isMuted ? 'active' : ''}`}
                    onClick={() => setIsMuted(!isMuted)}
                >
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>

                <button
                    className={`control-btn main-mic ${status === 'listening' ? 'active' : ''}`}
                    onClick={handleOrbClick}
                    style={{
                        width: 80, height: 80, fontSize: '2rem',
                        borderColor: status === 'listening' ? '#00ff88' : (isConnected ? 'rgba(255,255,255,0.2)' : '#ff4444')
                    }}
                >
                    {!isConnected ? <FaMicrophone style={{ opacity: 0.5 }} /> : (
                        status === 'listening' ? <FaStop /> : <FaMicrophone />
                    )}
                </button>
            </div>

            {/* Billing Info Overlay */}
            {billingInfo && (
                <div style={{
                    position: 'absolute', bottom: 20, right: 20,
                    background: 'rgba(0,0,0,0.6)', padding: '10px 15px',
                    borderRadius: '8px', border: '1px solid #333',
                    fontSize: '0.9rem', color: '#aaa', display: 'flex', flexDirection: 'column', alignItems: 'flex-end'
                }}>
                    <span style={{ color: '#00d2ff' }}>Session Cost: ₹{billingInfo.sessionCost.toFixed(2)}</span>
                    <span>Balance: ₹{billingInfo.balance.toFixed(2)}</span>
                </div>
            )}
        </div>
    );
};

export default VoiceAgentPage;
