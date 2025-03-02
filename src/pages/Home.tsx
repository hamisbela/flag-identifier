import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Flag, Loader2 } from 'lucide-react';
import { analyzeImage } from '../lib/gemini';
import SupportBlock from '../components/SupportBlock';

// Default flag image path
const DEFAULT_IMAGE = "/default-flag.jpg";

// Default analysis for the flag
const DEFAULT_ANALYSIS = `1. Flag Identification:
- Country: United States of America
- Type: National flag
- Adoption Date: June 14, 1777 (original design), July 4, 1960 (current 50-star design)
- Aspect Ratio: 10:19
- Nicknames: "Stars and Stripes", "Old Glory", "The Star-Spangled Banner"

2. Design Elements:
- Colors: Red, White, and Blue
- Symbols: 50 white stars on blue canton representing the 50 states, 13 alternating red and white stripes representing the original 13 colonies
- Pattern: Rectangular, with a blue rectangle in the upper hoist-side corner
- Symbolic Meaning: Stars represent the states in the union, stripes represent the founding colonies, colors represent valor (red), purity and innocence (white), vigilance, perseverance and justice (blue)

3. Historical Context:
- Origin: Based on the "Grand Union Flag" and influenced by the British East India Company flag
- Designer: Unclear for the original, but officially attributed to congressman Francis Hopkinson
- Evolution: Has changed 27 times as stars were added for new states
- Significant Events: Inspired the national anthem after the Battle of Fort McHenry (1814)
- Cultural Impact: One of the most recognizable flags in the world

4. Protocol & Usage:
- Official Status: National flag of the United States
- Display Guidelines: Should not touch the ground, typically flown from sunrise to sunset
- Half-Staff Protocol: By presidential proclamation following significant deaths or tragedies
- Disposal Method: Should be burned respectfully when no longer serviceable
- Pledge of Allegiance: Associated with flag salute in schools and public events

5. Additional Information:
- Flag Day: Celebrated annually on June 14th
- Similar Flags: Liberia, Malaysia, and Chile have somewhat similar designs
- International Recognition: Universally recognized symbol of the United States
- Moon Placement: Six American flags have been placed on the Moon by Apollo missions
- Interesting Facts: The current 50-star design was created by a high school student, Robert G. Heft, as a school project`;

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load default image and analysis without API call
    const loadDefaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(DEFAULT_IMAGE);
        if (!response.ok) {
          throw new Error('Failed to load default image');
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setImage(base64data);
          setAnalysis(DEFAULT_ANALYSIS);
          setLoading(false);
        };
        reader.onerror = () => {
          setError('Failed to load default image');
          setLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error('Error loading default image:', err);
        setError('Failed to load default image');
        setLoading(false);
      }
    };

    loadDefaultContent();
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('Image size should be less than 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setError(null);
      handleAnalyze(base64String);
    };
    reader.onerror = () => {
      setError('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again
    e.target.value = '';
  }, []);

  const handleAnalyze = async (imageData: string) => {
    setLoading(true);
    setError(null);
    const flagPrompt = "Analyze this flag image for educational purposes and provide the following information:\n1. Flag identification (country/entity, type, adoption date, aspect ratio, nicknames)\n2. Design elements (colors, symbols, pattern, symbolic meaning)\n3. Historical context (origin, designer, evolution, significant events, cultural impact)\n4. Protocol and usage (official status, display guidelines, half-staff protocol, disposal method)\n5. Additional information (related celebrations, similar flags, international recognition, interesting facts)\n\nIMPORTANT: This is for educational purposes only.";
    try {
      const result = await analyzeImage(imageData, flagPrompt);
      setAnalysis(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Remove any markdown-style formatting
      const cleanLine = line.replace(/[*_#`]/g, '').trim();
      if (!cleanLine) return null;

      // Format section headers (lines starting with numbers)
      if (/^\d+\./.test(cleanLine)) {
        return (
          <div key={index} className="mt-8 first:mt-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {cleanLine.replace(/^\d+\.\s*/, '')}
            </h3>
          </div>
        );
      }
      
      // Format list items with specific properties
      if (cleanLine.startsWith('-') && cleanLine.includes(':')) {
        const [label, ...valueParts] = cleanLine.substring(1).split(':');
        const value = valueParts.join(':').trim();
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="font-semibold text-gray-800 min-w-[120px]">{label.trim()}:</span>
            <span className="text-gray-700">{value}</span>
          </div>
        );
      }
      
      // Format regular list items
      if (cleanLine.startsWith('-')) {
        return (
          <div key={index} className="flex gap-2 mb-3 ml-4">
            <span className="text-gray-400">•</span>
            <span className="text-gray-700">{cleanLine.substring(1).trim()}</span>
          </div>
        );
      }

      // Regular text
      return (
        <p key={index} className="mb-3 text-gray-700">
          {cleanLine}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <div className="bg-gray-50 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Free Flag Identifier</h1>
          <p className="text-base sm:text-lg text-gray-600">Upload a flag photo for educational vexillology identification and country information</p>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-12">
          <div className="flex flex-col items-center justify-center mb-6">
            <label 
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              Upload Flag Photo
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleImageUpload}
              />
            </label>
            <p className="mt-2 text-sm text-gray-500">PNG, JPG, JPEG or WEBP (MAX. 20MB)</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {loading && !image && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          )}

          {image && (
            <div className="mb-6">
              <div className="relative rounded-lg mb-4 overflow-hidden bg-gray-100">
                <img
                  src={image}
                  alt="Flag preview"
                  className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnalyze(image)}
                  disabled={loading}
                  className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Flag className="-ml-1 mr-2 h-5 w-5" />
                      Identify Flag
                    </>
                  )}
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Another Photo
                </button>
              </div>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-50 rounded-lg p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Flag Analysis Results</h2>
              <div className="text-gray-700">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>

        <SupportBlock />

        <div className="prose max-w-none my-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Free Flag Identifier: Your Educational Guide to Vexillology</h2>
          
          <p>Welcome to our free flag identifier tool, powered by advanced artificial intelligence technology.
             This educational tool helps you learn about different national and regional flags,
             providing essential information about symbolism, history, and cultural significance.</p>

          <h3>How Our Educational Flag Identifier Works</h3>
          <p>Our tool uses AI to analyze flag photos and provide educational information about country
             identification, design elements, and historical context. Simply upload a clear photo of a flag,
             and our AI will help you learn about its origin and symbolism.</p>

          <h3>Key Features of Our Flag Identifier</h3>
          <ul>
            <li>Educational vexillology information</li>
            <li>Detailed design element analysis</li>
            <li>Historical and cultural context</li>
            <li>Flag protocol and usage guidelines</li>
            <li>Country information and interesting facts</li>
            <li>100% free to use</li>
          </ul>

          <h3>Perfect For Learning About:</h3>
          <ul>
            <li>National and regional flags</li>
            <li>Flag symbolism and design elements</li>
            <li>Historical significance of flags</li>
            <li>Geography and international relations</li>
            <li>Cultural representation through vexillology</li>
          </ul>

          <p>Try our free flag identifier today and expand your knowledge of world flags!
             No registration required - just upload a photo and start learning about fascinating flags from around the world.</p>
        </div>

        <SupportBlock />
      </div>
    </div>
  );
}