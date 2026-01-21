
import React, { useState, useCallback } from 'react';
import { ImageSettings, HistoryItem, ImageModel, AspectRatio, ImageSize } from './types';
import { generateImage } from './services/geminiService';
import ControlsPanel from './components/ControlsPanel';
import ImageDisplay from './components/ImageDisplay';
import HistoryPanel from './components/HistoryPanel';
import ApiKeyPrompt from './components/ApiKeyPrompt';

// FIX: Removed the conflicting global declaration for `window.aistudio` to fix TypeScript errors.
// The `aistudio` object is assumed to be provided by the environment.

const App: React.FC = () => {
  const [settings, setSettings] = useState<ImageSettings>({
    prompt: '',
    model: ImageModel.STANDARD,
    aspectRatio: '1:1',
    imageSize: '1K',
    useSearch: false,
    inputImage: null,
  });

  const [currentImage, setCurrentImage] = useState<{ src: string; prompt: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState<boolean>(false);

  const handleSettingsChange = (newSettings: Partial<ImageSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  const handleModelChange = async (model: ImageModel) => {
    if (model === ImageModel.PRO) {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                setShowApiKeyPrompt(true);
                setIsKeyReady(false); // Reset key readiness
            } else {
                setIsKeyReady(true);
            }
        } else {
             // Fallback for environments where aistudio is not present
             console.warn('aistudio object not found. Pro model may not work without an API key.');
             setIsKeyReady(true);
        }
    }
    handleSettingsChange({ model, useSearch: false, imageSize: '1K' });
  }

  const handleApiKeySelect = useCallback(async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // As per guidance, assume success and proceed.
        setIsKeyReady(true);
        setShowApiKeyPrompt(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if ((!settings.prompt.trim() && !settings.inputImage) || isLoading) return;

    if (settings.model === ImageModel.PRO && !isKeyReady) {
        setShowApiKeyPrompt(true);
        return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentImage(null);

    try {
      const result = await generateImage(settings);
      const newImage = { src: result.imageUrl, prompt: settings.prompt };
      setCurrentImage(newImage);
      const newHistoryItem: HistoryItem = {
        id: new Date().toISOString(),
        ...newImage,
      };
      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (e) {
      const err = e as Error;
      if(err.message.includes("Requested entity was not found.")){
          setError("API Key error. Please re-select your Pro model API key.");
          setIsKeyReady(false);
          setShowApiKeyPrompt(true);
      } else {
          setError(`Failed to generate image: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings, isLoading, isKeyReady]);

  const selectHistoryItem = (item: HistoryItem) => {
    setCurrentImage({ src: item.src, prompt: item.prompt });
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col lg:flex-row">
      {showApiKeyPrompt && (
        <ApiKeyPrompt onSelectKey={handleApiKeySelect} onCancel={() => setShowApiKeyPrompt(false)} />
      )}
      
      <ControlsPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onGenerate={handleGenerate}
        isLoading={isLoading}
        onModelChange={handleModelChange}
      />
      
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
        <ImageDisplay
          image={currentImage}
          isLoading={isLoading}
          error={error}
        />
      </main>

      <HistoryPanel
        history={history}
        onSelect={selectHistoryItem}
        />
    </div>
  );
};

export default App;
