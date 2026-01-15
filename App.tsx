import React, { useState, useCallback } from 'react';
import { CompareSlider } from './components/CompareSlider';
import { ChatInterface } from './components/ChatInterface';
import { generateRoomStyle, editRoomImage, sendChatMessage } from './services/geminiService';
import { AppState, DesignStyle, ChatMessage } from './types';

// Simple loading spinner
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentDesign, setCurrentDesign] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setOriginalImage(result);
        setCurrentDesign(result); // Initially, current design is the original
        setAppState(AppState.EDITOR);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Style Generation
  const handleStyleSelect = async (style: DesignStyle) => {
    if (!originalImage || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const generatedImage = await generateRoomStyle(originalImage, style);
      setCurrentDesign(generatedImage);
    } catch (error) {
      alert("Failed to generate style. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Specific Edit (Nano Banana feature)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDesign || !editPrompt.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // We edit the CURRENT design, allowing for iterative changes
      const editedImage = await editRoomImage(currentDesign, editPrompt);
      setCurrentDesign(editedImage);
      setEditPrompt('');
    } catch (error) {
      alert("Failed to edit image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Chat Message
  const handleSendMessage = async (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(msg => ({ role: msg.role, text: msg.text }));
      const responseText = await sendChatMessage(history, text);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              RoomReimagine AI
            </h1>
          </div>
          {appState === AppState.EDITOR && (
             <button 
              onClick={() => {
                setAppState(AppState.UPLOAD);
                setOriginalImage(null);
                setCurrentDesign(null);
                setChatMessages([]);
              }}
              className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
             >
               Start Over
             </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === AppState.UPLOAD ? (
          /* Upload View */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-xl w-full">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
                Redesign your space in seconds.
              </h2>
              <p className="text-lg text-gray-500 mb-8">
                Upload a photo of your room and let our AI generate stunning new interior designs in various styles.
              </p>
              
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 bg-white transition-all group-hover:border-indigo-500 group-hover:shadow-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <span className="text-indigo-600 font-semibold text-lg">Click to upload a photo</span>
                    <span className="text-gray-400 mt-2 text-sm">JPG, PNG up to 10MB</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 justify-center">
                 <img src="https://picsum.photos/100/100?random=1" className="w-20 h-20 rounded-lg object-cover opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" alt="demo 1" />
                 <img src="https://picsum.photos/100/100?random=2" className="w-20 h-20 rounded-lg object-cover opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" alt="demo 2" />
                 <img src="https://picsum.photos/100/100?random=3" className="w-20 h-20 rounded-lg object-cover opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" alt="demo 3" />
              </div>
            </div>
          </div>
        ) : (
          /* Editor View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Editor & Visuals (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Compare Slider */}
              <div className="relative">
                {originalImage && currentDesign && (
                   <CompareSlider beforeImage={originalImage} afterImage={currentDesign} />
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-20 text-white">
                    <Spinner />
                    <p className="mt-3 font-medium animate-pulse">Designing your room...</p>
                  </div>
                )}
              </div>

              {/* Style Selector Carousel */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Reimagine Style</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {Object.values(DesignStyle).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleStyleSelect(style)}
                      disabled={isProcessing}
                      className="flex-shrink-0 px-4 py-2 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-sm font-medium text-gray-700 hover:text-indigo-700 transition-all whitespace-nowrap disabled:opacity-50"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Edit Input (Nano Banana) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500">
                     <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
                   </svg>
                   Magic Edit
                 </h3>
                 <form onSubmit={handleEditSubmit} className="flex gap-2">
                   <input 
                    type="text" 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g. 'Make the rug blue', 'Add a retro filter', 'Remove the lamp'"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isProcessing}
                   />
                   <button 
                    type="submit"
                    disabled={isProcessing || !editPrompt.trim()}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
                   >
                     {isProcessing ? 'Editing...' : 'Edit'}
                   </button>
                 </form>
                 <p className="text-xs text-gray-400 mt-2">Powered by Gemini 2.5 Flash Image. Use natural language to refine details.</p>
              </div>

            </div>

            {/* Right Column: Chat (4 cols) */}
            <div className="lg:col-span-4 h-[600px] lg:h-auto sticky top-20">
               <ChatInterface 
                 messages={chatMessages} 
                 onSendMessage={handleSendMessage}
                 isLoading={isChatLoading} 
               />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
