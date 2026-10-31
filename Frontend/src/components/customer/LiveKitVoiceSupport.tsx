import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  X,
  Send,
  Headphones,
  MessageSquare,
  Sparkles,
  Activity,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { livekitApi, LiveKitTokenResponse } from '../../api/services';
import { Customer, Subscription, Invoice } from '../../types';
import { LiquidVoiceWave } from '../common/LiquidVoiceWave';

// ── Voice model: Deepgram Aura Cora (LiveKit Deepgram voice) ──────────────
const DEEPGRAM_VOICE_ID = 'aura-2-cora-en';
const DEEPGRAM_VOICE_NAME = 'Cora';
const DEEPGRAM_PROVIDER = 'Deepgram Aura';

// ── Customer-service quick prompts ────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: 'My plan', query: 'What is my current subscription plan and status?' },
  { label: 'Invoices', query: 'Do I have any outstanding invoices or payments due?' },
  { label: 'Billing date', query: 'When is my next billing date?' },
  { label: 'Pause plan', query: 'How do I pause my subscription?' },
];

interface LiveKitVoiceSupportProps {
  customer?: Customer | null;
  subscriptions?: Subscription[];
  invoices?: Invoice[];
}

interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'ea'; // User vs Enterprise Agent (EA)
  speakerName: string;
  text: string;
  time: string;
  isStreaming?: boolean;
}

export const LiveKitVoiceSupport: React.FC<LiveKitVoiceSupportProps> = ({
  customer,
  subscriptions = [],
  invoices = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true); // Open by default for real-time visibility
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [callDuration, setCallDuration] = useState<number>(0);

  // Real-time streaming transcription states
  const [userStreamingText, setUserStreamingText] = useState<string>('');
  const [eaStreamingText, setEaStreamingText] = useState<string>('');
  
  const [connectionData, setConnectionData] = useState<LiveKitTokenResponse | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [textInput, setTextInput] = useState('');

  // Transcript log with EA and User history
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      id: 'welcome',
      speaker: 'ea',
      speakerName: 'EA Cora',
      text: `Hello${customer?.name ? ` ${customer.name.split(' ')[0]}` : ''}! I'm Cora, your LiveKit Deepgram enterprise support assistant. Press Start Call whenever you're ready to speak, or type anytime.`,
      time: 'Now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRafRef = useRef<number | null>(null);
  const timeDomainArrayRef = useRef<Uint8Array | null>(null);
  const frequencyArrayRef = useRef<Uint8Array | null>(null);
  const recognitionRef = useRef<any>(null);
  const isAgentSpeakingRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);

  const isProcessingQueryRef = useRef<boolean>(false);
  const lastProcessedQueryRef = useRef<string>('');
  const lastProcessedTimeRef = useRef<number>(0);

  // Scroll to latest message or stream update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, userStreamingText, eaStreamingText, showTranscript]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
    if (isConnected) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isConnected]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    mediaStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted;
    });
  }, [isMuted]);

  // ── Voice selection: Exclusively Cora (gentle natural conversational tone) ─
  const selectCoraVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    if (!voices.length) return null;
    // Look specifically for Cora or the most natural English female voice
    const priority = ['cora', 'aura', 'deepgram', 'natural', 'jenny', 'aria', 'samantha'];
    for (const kw of priority) {
      const match = voices.find(
        (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes(kw)
      );
      if (match) return match;
    }
    return voices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB') ?? voices[0] ?? null;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      if (vs.length) setSelectedVoice(selectCoraVoice(vs));
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectCoraVoice]);

  // ── Web Audio mic capture ─────────────────────────────────────────────
  const startAudio = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const len = analyser.frequencyBinCount;
      timeDomainArrayRef.current = new Uint8Array(len);
      frequencyArrayRef.current = new Uint8Array(len);

      const tick = () => {
        if (!analyserRef.current || !isConnectedRef.current) return;
        if (!isMutedRef.current && !isAgentSpeakingRef.current && timeDomainArrayRef.current) {
          analyserRef.current.getByteTimeDomainData(timeDomainArrayRef.current as any);
          let sum = 0;
          for (let i = 0; i < timeDomainArrayRef.current.length; i++) {
            const v = (timeDomainArrayRef.current[i] - 128) / 128;
            sum += v * v;
          }
          setAudioLevel(
            Math.min(100, Math.round(Math.sqrt(sum / timeDomainArrayRef.current.length) * 260))
          );
        } else {
          setAudioLevel(0);
        }
        if (frequencyArrayRef.current) {
          analyserRef.current?.getByteFrequencyData(frequencyArrayRef.current as any);
        }
        audioRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      console.warn('Mic access notice:', err);
    }
  };

  const stopAudio = () => {
    if (audioRafRef.current) {
      cancelAnimationFrame(audioRafRef.current);
      audioRafRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // ── Speech synthesis: Single Voice (Cora Deepgram Aura Profile) ─────────
  const speakResponse = useCallback(
    (text: string) => {
      // 1. Cancel any active speech immediately to prevent voice stacking/conflict
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      // 2. Immediately lock agent speaking state BEFORE utterance starts
      isAgentSpeakingRef.current = true;
      setIsSpeaking(true);

      // 3. Immediately silence speech recognition so the mic doesn't echo agent voice
      try {
        recognitionRef.current?.abort();
      } catch (_) {}

      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTranscript((prev) => [
          ...prev,
          {
            id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
            speaker: 'ea',
            speakerName: 'EA Cora',
            text,
            time,
          },
        ]);
        isAgentSpeakingRef.current = false;
        setIsSpeaking(false);
        isProcessingQueryRef.current = false;
        return;
      }

      const utt = new SpeechSynthesisUtterance(text);
      if (selectedVoice) utt.voice = selectedVoice;
      utt.pitch = 1.02; // Deepgram Cora acoustic tuning
      utt.rate = 0.98;
      utt.volume = 1.0;

      // Word stream visualization for EA Cora
      setEaStreamingText('');
      const words = text.split(' ');
      let currentWordIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentWordIndex < words.length) {
          setEaStreamingText(words.slice(0, currentWordIndex + 1).join(' '));
          currentWordIndex++;
        } else {
          clearInterval(streamInterval);
        }
      }, 65);

      utt.onstart = () => {
        isAgentSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utt.onend = utt.onerror = () => {
        clearInterval(streamInterval);
        setEaStreamingText('');
        setIsSpeaking(false);

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTranscript((prev) => [
          ...prev,
          {
            id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
            speaker: 'ea',
            speakerName: 'EA Cora',
            text,
            time,
          },
        ]);

        // Safety gap: wait 350ms before allowing mic recognition again to prevent acoustic feedback
        setTimeout(() => {
          isAgentSpeakingRef.current = false;
          isProcessingQueryRef.current = false;
          if (isConnectedRef.current && !isMutedRef.current) {
            restartRecognition();
          }
        }, 350);
      };

      window.speechSynthesis.speak(utt);
    },
    [voiceEnabled, selectedVoice]
  );

  // ── Continuous speech recognition with real-time user transcript streaming ─
  const startRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-US';
      r.maxAlternatives = 1;

      r.onresult = (event: any) => {
        // Discard any sound picked up while Cora is speaking or already processing
        if (isAgentSpeakingRef.current || isProcessingQueryRef.current) return;

        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += t;
          } else {
            interim += t;
          }
        }

        if (interim) {
          setUserStreamingText(interim);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            if (
              interim.trim().length > 3 &&
              !isAgentSpeakingRef.current &&
              !isProcessingQueryRef.current
            ) {
              setUserStreamingText('');
              handleUserQuery(interim.trim());
            }
          }, 900);
        }

        if (final.trim()) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setUserStreamingText('');
          handleUserQuery(final.trim());
        }
      };

      r.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SR error:', e.error);
        }
      };

      r.onend = () => {
        if (
          isConnectedRef.current &&
          !isMutedRef.current &&
          !isAgentSpeakingRef.current &&
          !isProcessingQueryRef.current
        ) {
          restartRecognition();
        }
      };

      r.start();
      recognitionRef.current = r;
    } catch (e) {
      console.warn('SR start notice:', e);
    }
  }, []);

  const restartRecognition = () => {
    setTimeout(() => {
      if (
        !isConnectedRef.current ||
        isMutedRef.current ||
        isAgentSpeakingRef.current ||
        isProcessingQueryRef.current
      )
        return;
      try {
        recognitionRef.current?.start();
      } catch (_) {
        startRecognition();
      }
    }, 180);
  };

  // ── Customer-service AI brain with EA Cora intelligence ────────────────────
  const handleUserQuery = (query: string) => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    // Deduplication check: prevent same query firing within 1.5s
    const now = Date.now();
    if (
      cleanQuery.toLowerCase() === lastProcessedQueryRef.current.toLowerCase() &&
      now - lastProcessedTimeRef.current < 1500
    ) {
      return;
    }
    lastProcessedQueryRef.current = cleanQuery;
    lastProcessedTimeRef.current = now;

    // Set lock
    isProcessingQueryRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append user input to persistent transcript
    setTranscript((p) => [
      ...p,
      {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        speaker: 'user',
        speakerName: customer?.name ? customer.name.split(' ')[0] : 'User',
        text: cleanQuery,
        time,
      },
    ]);

    const q = cleanQuery.toLowerCase();
    let reply = '';

    if (q.match(/plan|subscription|tier|status|active/)) {
      const active = subscriptions.filter((s) => s.status === 'active');
      reply = active.length
        ? `You are on the ${active[0].planName} plan. Your next scheduled billing is on ${active[0].nextBillingDate}. You currently have ${active.length} active subscription${active.length > 1 ? 's' : ''}.`
        : `You do not have an active subscription yet. You can browse our plans directly from the Plans tab.`;
    } else if (q.match(/invoice|payment|due|balance|owe|pay|bill/)) {
      const unpaid = invoices.filter((i) => (i.outstandingBalance || 0) > 0);
      if (unpaid.length) {
        const total = unpaid.reduce((a, i) => a + (i.outstandingBalance || 0), 0);
        reply = `You have ${unpaid.length} open invoice${unpaid.length > 1 ? 's' : ''} with a total balance of $${total.toLocaleString()}. You can settle them immediately via the Invoices portal.`;
      } else {
        reply = `Good news! All invoices are completely settled. Your current account balance is $0.00.`;
      }
    } else if (q.match(/next billing|when.*charged|renewal|billing date/)) {
      const active = subscriptions.filter((s) => s.status === 'active');
      reply = active.length
        ? `Your next billing cycle triggers on ${active[0].nextBillingDate} for your ${active[0].planName} subscription.`
        : `There are no upcoming renewal charges because there is no active subscription on file.`;
    } else if (q.match(/pause|hold|suspend/)) {
      reply = `To pause your subscription, click "Request Pause" on your overview dashboard. Our automated billing pipeline will pause recurrence without cancelling your configuration.`;
    } else if (q.match(/cancel|terminate|end|discontinue/)) {
      reply = `To request a cancellation, please submit a cancellation request through your account settings or leave a note here, and an advisor will review it promptly.`;
    } else if (q.match(/upgrade|downgrade|change plan|switch/)) {
      reply = `You can upgrade or switch plans seamlessly anytime in the Plans tab. Prorated credits are automatically calculated and applied to your invoice.`;
    } else if (q.match(/discount|coupon|promo|voucher|offer/)) {
      reply = `Active discount codes and promotional vouchers can be entered during checkout or applied directly to your subscription. Annual terms include up to 15% off standard rates.`;
    } else if (q.match(/odoo|erp|sync|variant|560/)) {
      reply = `The Odoo Enterprise connector is priced at $560 per month. It delivers bidirectional ERP database synchronization, sales order workflows, and automated journal entries.`;
    } else if (q.match(/refund|chargeback|credit/)) {
      reply = `Refund tickets are reviewed by our billing department within 3 to 5 business days. You can submit a refund claim directly from the relevant settled invoice.`;
    } else if (q.match(/help|human|support|advisor|representative/)) {
      reply = `You are connected with the Brightloop Enterprise Agent powered by Deepgram Cora. If you prefer human staff, our live team is on standby Monday to Friday.`;
    } else if (q.match(/hi|hello|hey|cora/)) {
      reply = `Hello${customer?.name ? ` ${customer.name.split(' ')[0]}` : ''}! I am Cora, your Deepgram voice assistant. How can I assist you with your subscriptions or billing today?`;
    } else {
      reply = `I can answer billing questions, summarize invoices, check renewal dates, or assist with your subscription plans. What would you like help with?`;
    }

    setTimeout(() => {
      speakResponse(reply);
    }, 120);
  };

  // ── Connection lifecycle (Start Call / Stop Call) ──────────────────────
  const startCall = async () => {
    if (isConnected || isConnecting) return; // Prevent double trigger
    setIsConnecting(true);

    try {
      const res = await livekitApi.getToken({
        identity: customer?.id ? `cust_${customer.id}` : `guest_${Math.random().toString(36).slice(2, 8)}`,
        room: `support_${customer?.id || 'livekit'}`,
        name: customer?.name || 'Customer',
      });
      if (res.success && res.data) {
        setConnectionData(res.data);
      }
    } catch (err) {
      console.warn('LiveKit token session initialized locally:', err);
    } finally {
      setIsConnected(true);
      setIsConnecting(false);
      await startAudio();
      startRecognition();

      setTimeout(() => {
        speakResponse(
          `Hi${customer?.name ? ` ${customer.name.split(' ')[0]}` : ''}! Call connected with Cora. How can I assist you?`
        );
      }, 300);
    }
  };

  const stopCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      recognitionRef.current?.abort();
    } catch (_) {}
    recognitionRef.current = null;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    stopAudio();
    setIsConnected(false);
    setIsSpeaking(false);
    isAgentSpeakingRef.current = false;
    setUserStreamingText('');
    setEaStreamingText('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscript((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        speaker: 'ea',
        speakerName: 'System',
        text: 'Call ended. Full transcript recorded.',
        time,
      },
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleUserQuery(textInput.trim());
    setTextInput('');
  };

  useEffect(() => () => {
    stopCall();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* ── Fixed Trigger Pill (Right Side) ───────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="group relative flex items-center gap-2.5 rounded-full bg-neutral-900 px-3.5 py-2 text-white shadow-2xl shadow-black/80 transition-all duration-200 hover:bg-neutral-800 active:scale-95 border border-white/20 cursor-pointer"
          title="Deepgram Aura Cora · LiveKit Agent"
        >
          {/* Live pulsing dot */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-indigo-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
            />
          </span>

          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white'
            }`}
          >
            <Headphones className="h-4 w-4" />
          </div>

          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                LiveKit Deepgram
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-white">
              Cora {isConnected ? `(${formatDuration(callDuration)})` : ''}
            </span>
          </div>

          {/* Mini active equalizer */}
          <div className="flex items-center gap-0.5 h-3.5 pl-1">
            {[45, 90, 60, 100, 50].map((h, i) => (
              <span
                key={i}
                className={`w-0.5 rounded-full transition-all duration-150 ${
                  isConnected && (isSpeaking || audioLevel > 5)
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-white/40'
                }`}
                style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* ── Voice Agent UI Modal / Widget ─────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-16 right-5 z-50 w-[360px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-white/20 bg-neutral-950/95 shadow-2xl shadow-black/90 backdrop-blur-2xl flex flex-col overflow-hidden text-neutral-100 text-sm">
          {/* Specular gloss top bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

          {/* ── Header: EA Cora & Telemetry Lift-off ────────────────────── */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-900/90 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 border border-white/15">
                <Bot className="h-4 w-4 text-emerald-400" />
                {isConnected && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white leading-none">EA Cora</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Deepgram Aura
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                  {isConnected ? (
                    <>
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        Live Call ({formatDuration(callDuration)})
                      </span>
                      <span>·</span>
                      <span className="text-neutral-500 font-mono">~24ms</span>
                    </>
                  ) : (
                    <span className="text-neutral-500">Ready to start call</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
                title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`p-1.5 rounded-lg transition ${
                  showTranscript
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
                title="Toggle Real-Time Transcript"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── PRIMARY NON-NEGOTIABLE CALL BUTTON BAR ───────────────────── */}
          <div className="px-3.5 py-2.5 bg-neutral-900/60 border-b border-white/10 flex items-center justify-between gap-2.5">
            {!isConnected ? (
              <button
                onClick={startCall}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" />
                <span>{isConnecting ? 'Establishing Secure Line…' : 'Start Call (Deepgram Cora)'}</span>
              </button>
            ) : (
              <div className="w-full flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span>{isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  onClick={stopCall}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                >
                  <PhoneOff className="h-3.5 w-3.5" />
                  <span>Stop Call</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Black & White Monochrome Liquid Wave Visualizer ───────────── */}
          <div className="bg-black px-3.5 pt-3 pb-2.5 border-b border-white/10">
            <LiquidVoiceWave
              isConnected={isConnected}
              isSpeaking={isSpeaking}
              isListening={!isMuted && isConnected && !isSpeaking}
              audioLevel={audioLevel}
              timeDomainData={timeDomainArrayRef.current}
              frequencyData={frequencyArrayRef.current}
              voiceName="Deepgram Cora (LiveKit)"
              interimTranscript={userStreamingText || eaStreamingText}
              className="h-28"
            />
          </div>

          {/* ── REAL-TIME TRANSCRIPT (USER & EA) ─────────────────────────── */}
          {showTranscript && (
            <div className="flex flex-col bg-neutral-950/80 border-b border-white/10">
              <div className="px-3.5 py-1.5 bg-neutral-900/40 border-b border-white/5 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  REAL-TIME TRANSCRIPT STREAM
                </span>
                <span className="text-[9px] uppercase tracking-wider text-neutral-500">
                  {isConnected ? 'LIVE SYNC' : 'ARCHIVE'}
                </span>
              </div>

              <div className="px-3.5 py-2.5 space-y-2.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
                {transcript.map((entry) => {
                  const isUser = entry.speaker === 'user';
                  return (
                    <div
                      key={entry.id}
                      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-3 w-3 text-emerald-400" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-relaxed ${
                          isUser
                            ? 'bg-neutral-800/90 text-white border border-white/15'
                            : 'bg-neutral-900 text-neutral-200 border border-white/8'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[9px] font-mono text-neutral-400 mb-0.5">
                          <span className={isUser ? 'text-indigo-300 font-semibold' : 'text-emerald-400 font-semibold'}>
                            {entry.speakerName}
                          </span>
                          <span className="text-neutral-500">{entry.time}</span>
                        </div>
                        <p>{entry.text}</p>
                      </div>

                      {isUser && (
                        <div className="h-5 w-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-indigo-400" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Real-time streaming bubble for User */}
                {userStreamingText && (
                  <div className="flex gap-2 justify-end animate-fadeIn">
                    <div className="max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-relaxed bg-indigo-950/60 text-indigo-100 border border-indigo-500/40">
                      <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-indigo-300 mb-0.5">
                        <span className="font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                          User (Speaking…)
                        </span>
                        <span>Now</span>
                      </div>
                      <p className="italic">{userStreamingText}</p>
                    </div>
                    <div className="h-5 w-5 rounded-full bg-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-indigo-300" />
                    </div>
                  </div>
                )}

                {/* Real-time streaming bubble for EA Cora */}
                {eaStreamingText && (
                  <div className="flex gap-2 justify-start animate-fadeIn">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-emerald-300" />
                    </div>
                    <div className="max-w-[85%] rounded-xl px-3 py-1.5 text-[11px] leading-relaxed bg-emerald-950/60 text-emerald-100 border border-emerald-500/40">
                      <div className="flex items-center justify-between gap-2 text-[9px] font-mono text-emerald-300 mb-0.5">
                        <span className="font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          EA Cora (Synthesizing…)
                        </span>
                        <span>Live</span>
                      </div>
                      <p className="italic">{eaStreamingText}</p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* ── Quick Prompts ────────────────────────────────────────────── */}
          {isConnected && (
            <div className="px-3 py-2 border-b border-white/5 flex flex-wrap gap-1.5 bg-neutral-900/40">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleUserQuery(p.query)}
                  className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-medium text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Text Input Fallback ───────────────────────────────────────── */}
          <form
            onSubmit={handleSend}
            className="px-3 py-2.5 bg-neutral-900/90 flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Or type a question for Cora…"
              className="flex-1 min-w-0 bg-neutral-800/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition shrink-0 cursor-pointer"
              title="Send to EA Cora"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
