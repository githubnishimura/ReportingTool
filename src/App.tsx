/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  RotateCcw, 
  CheckCircle2, 
  ChevronDown, 
  Mail, 
  Smartphone, 
  Download,
  Info,
  Building2,
  User,
  Calendar,
  FileText
} from 'lucide-react';

// --- Types ---
type Company = '三和ソリューション' | '千手Soft';
type Name = '○○○○' | '西村 宏功';

interface AppState {
  company: Company;
  name: Name;
  customName: string;
  month: number;
  includeWorkRecord: boolean;
  includeTransportExpenses: boolean;
}

const STORAGE_KEY = 'monthly_report_settings';

export default function App() {
  // --- State ---
  const [state, setState] = useState<AppState>(() => {
    const defaultState: AppState = {
      company: '三和ソリューション',
      name: '○○○○',
      customName: '',
      month: new Date().getMonth() + 1,
      includeWorkRecord: false,
      includeTransportExpenses: true,
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge saved state with defaults to handle new properties
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved state', e);
      }
    }
    return defaultState;
  });

  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // --- PWA Installation Logic ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('SW registration failed:', err);
      });
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  // --- Derived Data ---
  const activeName = useMemo(() => {
    if (state.name === '○○○○') {
      return state.customName || '○○○○';
    }
    return state.name;
  }, [state.name, state.customName]);

  const subject = useMemo(() => {
    return `(${state.company}　${activeName})　${state.month}月度月末報告`;
  }, [state.company, activeName, state.month]);

  const attachmentsSentence = useMemo(() => {
    const items = [];
    if (state.includeWorkRecord) items.push('勤務表');
    if (state.includeTransportExpenses) items.push('交通費');

    if (items.length === 0) {
      return 'ご依頼いただいた書類を送ります。';
    }
    return `${items.join('・')}の明細を送ります。`;
  }, [state.includeWorkRecord, state.includeTransportExpenses]);

  const body = useMemo(() => {
    return `総務　ご担当者様

お疲れ様です。${activeName}です。
${attachmentsSentence}

どうぞよろしくお願いいたします。

__
${activeName}`;
  }, [activeName, attachmentsSentence]);

  // --- Handlers ---
  const recipient = useMemo(() => {
    return state.company === '三和ソリューション' ? 'soumu@kbsanhe.co.jp' : 'soumu@senjusoft.co.jp';
  }, [state.company]);

  const handleMailto = () => {
    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleCopy = async () => {
    const fullText = `宛先：${recipient}\n件名：${subject}\n\n本文：\n${body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('入力内容を初期状態に戻しますか？')) {
      setState({
        company: '三和ソリューション',
        name: '○○○○',
        customName: '',
        month: new Date().getMonth() + 1,
        includeWorkRecord: false,
        includeTransportExpenses: true,
      });
    }
  };

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Mail className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">月末報告作成</h1>
        </div>
        <button 
          onClick={handleReset}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="リセット"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8">
        {/* Install Banner */}
        <AnimatePresence>
          {showInstallBanner && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="text-blue-600 w-5 h-5" />
                <p className="text-sm font-medium text-blue-900">ホーム画面に追加してアプリとして利用</p>
              </div>
              <button 
                onClick={handleInstall}
                className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="space-y-4">
            {/* Company Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3 h-3" /> 会社
              </label>
              <div className="relative">
                <select 
                  value={state.company}
                  onChange={(e) => setState(s => ({ ...s, company: e.target.value as Company }))}
                  className="w-full appearance-none bg-gray-50 border-none rounded-xl px-4 py-3.5 pr-10 text-base focus:ring-2 focus:ring-black transition-all"
                >
                  <option value="三和ソリューション">三和ソリューション</option>
                  <option value="千手Soft">千手Soft</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Name Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3" /> 名前
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <select 
                    value={state.name}
                    onChange={(e) => setState(s => ({ ...s, name: e.target.value as Name }))}
                    className="w-full appearance-none bg-gray-50 border-none rounded-xl px-4 py-3.5 pr-10 text-base focus:ring-2 focus:ring-black transition-all"
                  >
                    <option value="○○○○">○○○○ (自由入力)</option>
                    <option value="西村 宏功">西村 宏功</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                <AnimatePresence>
                  {state.name === '○○○○' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="お名前を入力してください"
                        value={state.customName}
                        onChange={(e) => setState(s => ({ ...s, customName: e.target.value }))}
                        className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-blue-300"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Month Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-3 h-3" /> 対象月
              </label>
              <div className="relative">
                <select 
                  value={state.month}
                  onChange={(e) => setState(s => ({ ...s, month: parseInt(e.target.value) }))}
                  className="w-full appearance-none bg-gray-50 border-none rounded-xl px-4 py-3.5 pr-10 text-base focus:ring-2 focus:ring-black transition-all"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> 提出物
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setState(s => ({ ...s, includeTransportExpenses: !s.includeTransportExpenses }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl transition-all border-2 ${
                    state.includeTransportExpenses 
                      ? 'bg-black border-black text-white' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    state.includeTransportExpenses ? 'bg-white border-white' : 'bg-white border-gray-300'
                  }`}>
                    {state.includeTransportExpenses && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <span className="text-sm font-medium">交通費</span>
                </button>

                <button 
                  onClick={() => setState(s => ({ ...s, includeWorkRecord: !s.includeWorkRecord }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl transition-all border-2 ${
                    state.includeWorkRecord 
                      ? 'bg-black border-black text-white' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    state.includeWorkRecord ? 'bg-white border-white' : 'bg-white border-gray-300'
                  }`}>
                    {state.includeWorkRecord && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <span className="text-sm font-medium">勤務表</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Preview Card */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> プレビュー
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Preview
            </div>
          </div>
          
          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
            {/* Recipient Line */}
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</p>
              <p className="text-sm font-semibold text-blue-600">
                {recipient}
              </p>
            </div>
            {/* Subject Line */}
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject</p>
              <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                {subject}
              </p>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Message Body</p>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                {body}
              </div>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <div className="bg-gray-100/50 rounded-2xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            「メールを作成」ボタンでメールアプリが起動します。起動しない場合は「コピー」をご利用ください。
          </p>
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex flex-col items-center gap-3 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleMailto}
          className="pointer-events-auto w-full max-w-md h-16 rounded-2xl flex items-center justify-center gap-3 shadow-2xl bg-black text-white font-bold text-lg"
        >
          <Mail className="w-6 h-6" />
          <span>メールを作成</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCopy}
          className={`pointer-events-auto w-full max-w-md h-12 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${
            copied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-600 border-gray-100'
          } border font-bold text-sm`}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>コピーしました</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>内容をコピー</span>
            </>
          )}
        </motion.button>
      </div>

      {/* PWA iOS Instructions (Simplified) */}
      <footer className="max-w-md mx-auto px-6 pb-12 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
          © 2026 Monthly Report Tool
        </p>
      </footer>
    </div>
  );
}
