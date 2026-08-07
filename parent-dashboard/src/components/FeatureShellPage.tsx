import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface FeatureShellPageProps {
  title: string;
  description: string;
  onBackToHome: () => void;
}

export const FeatureShellPage: React.FC<FeatureShellPageProps> = ({
  title,
  description,
  onBackToHome
}) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
          <span>Status: Not implemented in this release yet</span>
        </div>

        <div className="pt-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home Overview</span>
          </button>
        </div>
      </div>
    </div>
  );
};
