/* ==========================================================================
   AetherCatalog Web Speech API & NLP Voice Engine Module
   ========================================================================== */

import { AIClient } from './ai.js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Spoken numbers to digits converter helper
const SPOKEN_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100, thousand: 1000, lakh: 100000, million: 1000000
};

function parseSpokenNumber(str) {
  const clean = str.toLowerCase().replace(/[₹\$,]/g, '').trim();
  
  if (!isNaN(clean) && clean !== '') {
    return parseFloat(clean);
  }
  
  const words = clean.split(/\s+/);
  let total = 0;
  let currentVal = 0;
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    
    if (SPOKEN_NUMBERS[w] !== undefined) {
      const num = SPOKEN_NUMBERS[w];
      if (num === 100) {
        currentVal = (currentVal || 1) * 100;
      } else if (num === 1000 || num === 100000 || num === 1000000) {
        currentVal = (currentVal || 1) * num;
        total += currentVal;
        currentVal = 0;
      } else {
        currentVal += num;
      }
    }
  }
  
  total += currentVal;
  return total > 0 ? total : null;
}

export const VoiceEngine = {
  recognition: null,
  isListening: false,
  ttsActive: false, // Turned off voice feedback by default as requested
  selectedVoice: null,
  
  init() {
    if (!SpeechRecognition) {
      console.warn('Web Speech API (SpeechRecognition) is not supported in this browser.');
      return false;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN'; // Optimized for Indian English accent
    
    this.ttsActive = false; // Stay completely silent
    return true;
  },

  // Speech feedback deactivated
  speak(text, callback) {
    if (callback) callback();
  },

  // Triggers one-shot microphone listen
  listenOnce(onResult, onEnd, onError) {
    if (!this.recognition) {
      if (onError) onError('Speech recognition not supported in this browser.');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      return;
    }

    this.isListening = true;
    
    // Update mic glow to active state immediately
    const micGlow = document.getElementById('hf-mic-glow');
    if (micGlow) micGlow.className = 'voice-indicator-glow listening';

    this.recognition.onstart = () => {};

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({
          final: finalTranscript,
          interim: interimTranscript,
          isFinal: finalTranscript !== ''
        });
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      const glow = document.getElementById('hf-mic-glow');
      if (glow) glow.className = 'voice-indicator-glow';
      if (onError) onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      const glow = document.getElementById('hf-mic-glow');
      if (glow) glow.className = 'voice-indicator-glow';
      
      if (onEnd) onEnd();
      
      // Auto-restart for HandsFreeWizard if appropriate
      const wizard = VoiceEngine.HandsFreeWizard;
      if (wizard.currentState === wizard.states.DICTATE || wizard.currentState === wizard.states.CONFIRM) {
        if (!wizard.pendingTimeout && !VoiceEngine.isListening && !wizard.manualTypingActive) {
          setTimeout(() => {
            if (wizard.currentState === wizard.states.DICTATE || wizard.currentState === wizard.states.CONFIRM) {
              if (!wizard.pendingTimeout && !VoiceEngine.isListening && !wizard.manualTypingActive) {
                wizard.restartListeningForCurrentState();
              }
            }
          }, 300);
        }
      }
    };

    this.recognition.start();
  },

  // Conversational Parser: extracts structured attributes (local fallback)
  parseConversationalSentence(sentence) {
    const clean = sentence.toLowerCase().trim();
    const result = {};
    const numRegex = /\d+/g;
    const matches = clean.match(numRegex);
    if (matches && matches.length > 0) {
      result.value = parseFloat(matches[0]);
    }
    return result;
  },

  // Step-by-Step Hands-Free Intake Wizard Controller (Silent Mode)
  HandsFreeWizard: {
    states: {
      IDLE: 'IDLE',
      IMAGE: 'IMAGE',
      DICTATE: 'DICTATE',
      CONFIRM: 'CONFIRM'
    },
    currentState: 'IDLE',
    capturedData: {},
    imageBackup: null,
    
    // UI callbacks bound during activation
    onStateChange: null,
    onSpeechPrompt: null,
    onSpeechTranscript: null,
    onComplete: null,

    // Step attributes to collect one by one
    fields: [
      { key: 'name', label: 'Asset Name', prompt: 'State the Asset Name (e.g. MacBook Pro)' },
      { key: 'category', label: 'Category', prompt: 'State the Category (e.g. Electronics, Office Gear)' },
      { key: 'value', label: 'Estimated Value (₹)', prompt: 'State the Value in Rupees (e.g. 50000)', parser: parseSpokenNumber },
      { key: 'manufacturer', label: 'Manufacturer', prompt: 'State the Manufacturer (e.g. Apple, Dell)' },
      { key: 'model', label: 'Model Number', prompt: 'State the Model Number (e.g. A2991)' },
      { key: 'condition', label: 'Condition', prompt: 'State the Condition (Excellent, Good, Fair, Poor)' },
      { key: 'status', label: 'Status', prompt: 'State the Status (In Service, Storage, Maintenance)' },
      { key: 'location', label: 'Location', prompt: 'State the Location (e.g. Room 3)' },
      { key: 'serial', label: 'Serial / Asset Tag', prompt: 'State the Serial or Asset Tag' },
      { key: 'tags', label: 'Tags', prompt: 'State the Tags (comma separated)', parser: (t) => t.split(',').map(x => x.trim()) },
      { key: 'notes', label: 'Asset Notes', prompt: 'State any Asset Notes' }
    ],
    currentFieldIndex: 0,
    pendingTimeout: null,
    manualTypingActive: false,

    clearPending() {
      if (this.pendingTimeout) {
        clearTimeout(this.pendingTimeout);
        this.pendingTimeout = null;
      }
    },

    start(callbacks) {
      this.clearPending();
      this.manualTypingActive = false;
      this.onStateChange = callbacks.onStateChange;
      this.onSpeechPrompt = callbacks.onSpeechPrompt;
      this.onSpeechTranscript = callbacks.onSpeechTranscript;
      this.onComplete = callbacks.onComplete;
      
      this.capturedData = {
        name: '',
        category: '',
        value: '',
        manufacturer: '',
        model: '',
        condition: 'Good',
        status: 'In Service',
        location: 'Main Storage',
        serial: '',
        tags: [],
        notes: '',
        image: null
      };
      this.currentFieldIndex = 0;
      this.imageBackup = null;

      this.transitionTo(this.states.IMAGE);
    },

    stop() {
      this.clearPending();
      this.manualTypingActive = false;
      this.currentState = this.states.IDLE;
      if (VoiceEngine.isListening && VoiceEngine.recognition) {
        VoiceEngine.recognition.stop();
      }
      if (this.onStateChange) this.onStateChange(this.states.IDLE);
    },

    transitionTo(nextState) {
      this.clearPending();
      this.currentState = nextState;
      if (this.onStateChange) this.onStateChange(nextState);

      switch (nextState) {
        case this.states.IMAGE:
          this.promptUser("Step 1: Upload a picture of the asset, or press Enter / click Skip.", () => {});
          break;
          
        case this.states.DICTATE:
          const field = this.fields[this.currentFieldIndex];
          const displayPrompt = `Step 2: ${field.prompt}`;
          
          this.promptAndListen(
            displayPrompt,
            (speech) => {
              const clean = speech.replace(/[\.\?\!\s]+$/, '').trim();
              const lower = clean.toLowerCase();
              
              if (lower === 'skip' || lower === 'default' || !clean) {
                this.onSpeechTranscript("Skipped", true);
              } else {
                this.onSpeechTranscript(clean, true);
                if (field.parser) {
                  const val = field.parser(clean);
                  this.capturedData[field.key] = val !== null ? val : clean;
                } else {
                  this.capturedData[field.key] = clean;
                }
              }
              
              this.pendingTimeout = setTimeout(() => this.nextField(), 1000);
            }
          );
          break;
          
        case this.states.CONFIRM:
          this.promptAndListen(
            "Step 3: Review the details. Press Enter or say 'Save' to save. Say 'Cancel' to abort.",
            (speech) => {
              const clean = speech.toLowerCase().replace(/[\.\?\!\s]+$/, '').trim();
              if (clean.includes('save') || clean.includes('commit') || clean.includes('yes') || clean.includes('store')) {
                if (this.onComplete) this.onComplete(this.capturedData);
                this.pendingTimeout = setTimeout(() => this.stop(), 1500);
              } else if (clean.includes('cancel') || clean.includes('no') || clean.includes('abort') || clean.includes('stop')) {
                this.pendingTimeout = setTimeout(() => this.stop(), 1000);
              }
            }
          );
          break;
      }
    },

    // Advances to the next field in sequence
    nextField() {
      this.clearPending();
      this.currentFieldIndex++;
      if (this.currentFieldIndex < this.fields.length) {
        this.transitionTo(this.states.DICTATE);
      } else {
        this.transitionTo(this.states.CONFIRM);
      }
    },

    // Skips the current field in dictation state
    skipField() {
      if (this.currentState === this.states.DICTATE) {
        this.clearPending();
        this.onSpeechTranscript("Skipped", true);
        this.nextField();
      }
    },

    previousField() {
      this.clearPending();
      if (this.currentState === this.states.CONFIRM) {
        this.currentFieldIndex = this.fields.length - 1;
        this.transitionTo(this.states.DICTATE);
      } else if (this.currentFieldIndex > 0) {
        this.currentFieldIndex--;
        this.transitionTo(this.states.DICTATE);
      } else {
        this.transitionTo(this.states.IMAGE);
      }
    },

    restartListeningForCurrentState() {
      if (this.currentState === this.states.DICTATE) {
        const field = this.fields[this.currentFieldIndex];
        this.onSpeechTranscript("Listening...", false);
        
        const micGlow = document.getElementById('hf-mic-glow');
        if (micGlow) micGlow.className = 'voice-indicator-glow listening';

        VoiceEngine.listenOnce(
          (result) => {
            if (result.final) {
              const clean = result.final.replace(/[\.\?\!\s]+$/, '').trim();
              const lower = clean.toLowerCase();
              if (lower === 'skip' || lower === 'default' || !clean) {
                this.onSpeechTranscript("Skipped", true);
              } else {
                this.onSpeechTranscript(clean, true);
                if (field.parser) {
                  const val = field.parser(clean);
                  this.capturedData[field.key] = val !== null ? val : clean;
                } else {
                  this.capturedData[field.key] = clean;
                }
              }
              this.pendingTimeout = setTimeout(() => this.nextField(), 1000);
            } else if (result.interim) {
              this.onSpeechTranscript(result.interim, false);
            }
          },
          () => {},
          (err) => {
            console.error("Auto-restart mic err:", err);
          }
        );
      } else if (this.currentState === this.states.CONFIRM) {
        this.onSpeechTranscript("Listening...", false);
        VoiceEngine.listenOnce(
          (result) => {
            if (result.final) {
              const clean = result.final.toLowerCase().replace(/[\.\?\!\s]+$/, '').trim();
              if (clean.includes('save') || clean.includes('commit') || clean.includes('yes') || clean.includes('store')) {
                if (this.onComplete) this.onComplete(this.capturedData);
                this.pendingTimeout = setTimeout(() => this.stop(), 1500);
              } else if (clean.includes('cancel') || clean.includes('no') || clean.includes('abort') || clean.includes('stop')) {
                this.pendingTimeout = setTimeout(() => this.stop(), 1000);
              }
            }
          },
          () => {},
          (err) => {
            console.error("Auto-restart mic confirm err:", err);
          }
        );
      }
    },

    // Speaks prompt (bypassed) and triggers microphone listening
    promptAndListen(promptText, onSuccess) {
      if (this.onSpeechPrompt) this.onSpeechPrompt(promptText);
      
      VoiceEngine.speak(promptText, () => {
        setTimeout(() => {
          if (this.currentState === this.states.IDLE) return;
          
          this.onSpeechTranscript("Listening...", false);
          
          VoiceEngine.listenOnce(
            (result) => {
              if (result.final) {
                onSuccess(result.final);
              } else if (result.interim) {
                this.onSpeechTranscript(result.interim, false);
              }
            },
            () => {},
            (err) => {
              console.error(err);
            }
          );
        }, 100);
      });
    },

    // One-way prompt display (no voice output)
    promptUser(text, callback) {
      if (this.onSpeechPrompt) this.onSpeechPrompt(text);
      if (callback) callback();
    },

    // Feed image uploaded into state machine to trigger step 2
    feedImage(base64Image) {
      if (this.currentState === this.states.IMAGE) {
        this.imageBackup = base64Image;
        this.capturedData.image = base64Image;
        this.transitionTo(this.states.DICTATE);
      }
    },

    // Skip photo upload step manually
    skipImage() {
      if (this.currentState === this.states.IMAGE) {
        this.imageBackup = null;
        this.capturedData.image = null;
        this.transitionTo(this.states.DICTATE);
      }
    }
  }
};
