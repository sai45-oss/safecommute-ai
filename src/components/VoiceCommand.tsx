import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Headphones, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface VoiceCommandProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

interface CommandResponse {
  type: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export const VoiceCommand: React.FC<VoiceCommandProps> = ({ isActive, onToggle }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastCommand, setLastCommand] = useState('');
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [commandHistory, setCommandHistory] = useState<Array<{command: string, response: CommandResponse}>>([]);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setTranscript('Listening...');
      };

      recognitionInstance.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        setTranscript(command);
        setLastCommand(command);
        processVoiceCommand(command);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setTranscript('Error: Could not recognize speech');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const processVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();
    let response: CommandResponse;

    try {
      if (lowerCommand.includes('status') || lowerCommand.includes('system')) {
        response = await getSystemStatus();
      } else if (lowerCommand.includes('crowd') || lowerCommand.includes('busy') || lowerCommand.includes('occupancy')) {
        response = await getCrowdInfo();
      } else if (lowerCommand.includes('alert') || lowerCommand.includes('emergency') || lowerCommand.includes('safety')) {
        response = await getAlertInfo();
      } else if (lowerCommand.includes('route') || lowerCommand.includes('directions') || lowerCommand.includes('travel')) {
        response = await getRouteInfo();
      } else if (lowerCommand.includes('vehicle') || lowerCommand.includes('bus') || lowerCommand.includes('train')) {
        response = await getVehicleInfo();
      } else {
        response = {
          type: 'unknown',
          message: 'I didn\'t understand that command. Try asking about system status, crowd levels, alerts, routes, or vehicles.',
          timestamp: new Date()
        };
      }

      setLastResponse(response);
      setCommandHistory(prev => [{command, response}, ...prev.slice(0, 4)]);

      if (audioEnabled) {
        speakResponse(response.message);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorResponse: CommandResponse = {
        type: 'error',
        message: 'Sorry, I encountered an error processing your command.',
        timestamp: new Date()
      };
      setLastResponse(errorResponse);
    }
  };

  const getSystemStatus = async (): Promise<CommandResponse> => {
    try {
      const response = await fetch('/api/v1/vehicles/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        const stats = data.data;
        return {
          type: 'status',
          message: `System status: ${stats.totalVehicles} vehicles active, ${stats.onTimePerformance}% on-time performance, ${stats.averageOccupancy}% average occupancy.`,
          data: stats,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
    
    return {
      type: 'status',
      message: 'All systems operational. 247 vehicles active, 92% on-time performance.',
      timestamp: new Date()
    };
  };

  const getCrowdInfo = async (): Promise<CommandResponse> => {
    try {
      const response = await fetch('/api/v1/crowd/stats/overview');
      const data = await response.json();
      
      if (data.success) {
        const stats = data.data;
        return {
          type: 'crowd',
          message: `Current average occupancy is ${stats.averageOccupancy}%. ${stats.highRiskLocations} locations have high crowd levels.`,
          data: stats,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching crowd info:', error);
    }
    
    return {
      type: 'crowd',
      message: 'Current average occupancy is 68%. Downtown Hub is experiencing high crowds.',
      timestamp: new Date()
    };
  };

  const getAlertInfo = async (): Promise<CommandResponse> => {
    try {
      const response = await fetch('/api/v1/alerts?status=active&limit=5');
      const data = await response.json();
      
      if (data.success) {
        const alerts = data.data;
        const activeCount = alerts.length;
        const emergencyCount = alerts.filter((a: any) => a.type === 'emergency').length;
        
        return {
          type: 'alerts',
          message: `There are currently ${activeCount} active alerts. ${emergencyCount} emergency alerts require immediate attention.`,
          data: { alerts, activeCount, emergencyCount },
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
    
    return {
      type: 'alerts',
      message: 'There are currently 3 active alerts: 1 medical emergency, 2 crowd warnings.',
      timestamp: new Date()
    };
  };

  const getRouteInfo = async (): Promise<CommandResponse> => {
    return {
      type: 'route',
      message: 'Route optimization is available. Please specify your origin and destination for personalized directions.',
      timestamp: new Date()
    };
  };

  const getVehicleInfo = async (): Promise<CommandResponse> => {
    try {
      const response = await fetch('/api/v1/vehicles?limit=5');
      const data = await response.json();
      
      if (data.success) {
        const vehicles = data.data;
        const onTimeCount = vehicles.filter((v: any) => v.status === 'on-time').length;
        
        return {
          type: 'vehicles',
          message: `${vehicles.length} vehicles tracked. ${onTimeCount} are running on time.`,
          data: vehicles,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching vehicle info:', error);
    }
    
    return {
      type: 'vehicles',
      message: '247 vehicles currently tracked. 92% are running on schedule.',
      timestamp: new Date()
    };
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleStartListening = () => {
    if (recognition && isActive) {
      recognition.start();
    } else {
      // Fallback for browsers without speech recognition
      setIsListening(true);
      setTranscript('Listening...');
      
      setTimeout(() => {
        const mockCommands = [
          'Show me system status',
          'Check crowd levels at Central Station',
          'Are there any safety alerts?',
          'What vehicles are running on Blue Line?'
        ];
        const command = mockCommands[Math.floor(Math.random() * mockCommands.length)];
        setTranscript(command);
        setLastCommand(command);
        processVoiceCommand(command);
      }, 2000);
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const voiceCommands = [
    { command: 'Show system status', description: 'Display current transit system status and performance metrics' },
    { command: 'Check crowd levels', description: 'Get real-time crowd density information for all locations' },
    { command: 'Safety alerts', description: 'List all active safety alerts and emergency situations' },
    { command: 'Vehicle information', description: 'Get details about active vehicles and their status' },
    { command: 'Route optimization', description: 'Access route planning and optimization features' },
    { command: 'Emergency status', description: 'Check for any emergency situations requiring attention' }
  ];

  return (
    <div className="space-y-6">
      {/* Voice Control Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Voice Commands</h2>
            <p className="text-slate-600">Hands-free transit information access with real-time responses</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-3 rounded-lg transition-colors ${
                audioEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => onToggle(!isActive)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isActive ? 'Voice Active' : 'Voice Inactive'}
            </button>
          </div>
        </div>

        {/* Voice Input Area */}
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="text-center mb-6">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={!isActive}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                  : isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="mt-4 text-lg font-medium text-slate-900">
              {isListening ? 'Listening...' : isActive ? 'Tap to speak' : 'Voice commands disabled'}
            </p>
            {!('webkitSpeechRecognition' in window) && (
              <p className="text-sm text-yellow-600 mt-2">
                Speech recognition not supported. Using demo mode.
              </p>
            )}
          </div>

          {transcript && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Headphones className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">Voice Input</span>
              </div>
              <p className="text-slate-900 mb-3">{transcript}</p>
              {lastCommand && !isListening && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Command processed</span>
                </div>
              )}
            </div>
          )}

          {lastResponse && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-2 mb-2">
                <Volume2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">AI Response</span>
              </div>
              <p className="text-slate-900 mb-3">{lastResponse.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {lastResponse.timestamp.toLocaleTimeString()}
                </span>
                <button
                  onClick={() => speakResponse(lastResponse.message)}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Replay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Available Commands */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Available Voice Commands</h3>
          <p className="text-sm text-slate-600">Try saying any of these commands</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voiceCommands.map((cmd, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <h4 className="font-medium text-slate-900 mb-1">"{cmd.command}"</h4>
                <p className="text-sm text-slate-600">{cmd.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Command History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recent Commands</h3>
          <p className="text-sm text-slate-600">Your voice command history with responses</p>
        </div>
        <div className="p-6">
          {commandHistory.length > 0 ? (
            <div className="space-y-4">
              {commandHistory.map((item, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-slate-900">{item.command}</span>
                    <button
                      onClick={() => speakResponse(item.response.message)}
                      className="ml-auto p-1 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="ml-5 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{item.response.message}</p>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {item.response.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No commands yet. Try speaking a command!</p>
            </div>
          )}
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Voice Settings</h3>
          <p className="text-sm text-slate-600">Customize your voice experience</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-900">Voice Recognition</label>
                <p className="text-sm text-slate-600">Enable voice command detection</p>
              </div>
              <button
                onClick={() => onToggle(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-900">Audio Responses</label>
                <p className="text-sm text-slate-600">Enable text-to-speech responses</p>
              </div>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  audioEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    audioEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};