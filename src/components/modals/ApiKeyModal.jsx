import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Sparkles, Check, ExternalLink, Cpu } from 'lucide-react';
import { AI_PROVIDERS, getAiConfig, saveAiConfig } from '../../services/enterpriseAi';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [useServerProxy, setUseServerProxy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getAiConfig();
      setProvider(current.provider || 'openai');
      setModel(current.model || 'gpt-4o-mini');
      setApiKey(current.apiKey || '');
      setUseServerProxy(current.useServerProxy || false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProviderObj = AI_PROVIDERS.find(p => p.id === provider) || AI_PROVIDERS[0];

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    const provObj = AI_PROVIDERS.find(p => p.id === newProvider);
    if (provObj && provObj.models[0]) {
      setModel(provObj.models[0]);
    }
  };

  const handleSave = () => {
    saveAiConfig({
      provider,
      model,
      apiKey: apiKey.trim(),
      useServerProxy,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-dark-surface border border-dark-border rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-brand-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Enterprise AI Engine Configuration</h3>
              <p className="text-xs text-slate-400">Configure LLM providers, real-time streaming, and BYOK</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 mb-5">
          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <span className="font-semibold">Direct Browser-to-API (Zero-Knowledge):</span> Your API keys are stored only in your local browser storage. Requests stream directly to the model provider with zero intermediate logging.
          </div>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-slate-300">Select LLM Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  provider === p.id
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-sm'
                    : 'bg-dark-card border-dark-border text-slate-400 hover:text-white'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-slate-300">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white outline-none focus:border-brand-500"
          >
            {currentProviderObj.models.map((m) => (
              <option key={m} value={m} className="bg-dark-surface text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* API Key Input */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between items-center text-xs">
            <label className="font-medium text-slate-300">
              {currentProviderObj.name} API Key
            </label>
            <span className="text-[11px] text-slate-500">
              Leave blank to use Custumu Grounded Engine
            </span>
          </div>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`sk-... (optional for live ${currentProviderObj.name} streaming)`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-dark-card border border-dark-border text-xs text-white placeholder-slate-600 outline-none focus:border-brand-500 font-mono"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-border">
          <span className="text-[11px] text-slate-500">custumu.com/api</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600 text-white text-xs font-semibold shadow-md transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Apply Engine Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
