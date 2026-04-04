import React, { useState } from 'react';
import { Briefcase, Building, Scale, Loader2 } from 'lucide-react';
import { uploadDataset } from '../../api/upload';
import type { UploadResponse } from '../../types/audit';

interface DemoSelectorProps {
  onUploadSuccess: (data: UploadResponse) => void;
}

export const DemoSelector: React.FC<DemoSelectorProps> = ({ onUploadSuccess }) => {
  const [loadingCard, setLoadingCard] = useState<string | null>(null);

  const handleDemoClick = async (type: string, filename: string) => {
    setLoadingCard(type);
    try {
      const response = await fetch(`/fixtures/${filename}`);
      if (!response.ok) throw new Error("Failed to fetch fixture");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'text/csv' });
      
      const data = await uploadDataset(file);
      onUploadSuccess(data);
    } catch (err) {
      console.error("Failed to load demo dataset", err);
      alert("Failed to load demo dataset. Ensure fixtures are in public/fixtures/.");
    } finally {
      setLoadingCard(null);
    }
  };

  const demos = [
    { id: 'hiring', title: 'Hiring (Adult Income)', icon: Briefcase, file: 'adult_income_sample.csv', desc: 'Predicts income >$50K based on census data.' },
    { id: 'lending', title: 'Lending (German Credit)', icon: Building, file: 'german_credit_sample.csv', desc: 'Predicts credit risk based on financial attributes.' },
    { id: 'justice', title: 'Criminal Justice (COMPAS)', icon: Scale, file: 'compas_sample.csv', desc: 'Predicts recidivism risk using defendant profiles.' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {demos.map((demo) => (
        <button
          key={demo.id}
          onClick={() => handleDemoClick(demo.id, demo.file)}
          disabled={loadingCard !== null}
          className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 hover:-translate-y-1"
        >
          {loadingCard === demo.id ? (
            <Loader2 className="w-10 h-10 text-blue-500 mb-4 animate-spin" />
          ) : (
            <demo.icon className="w-10 h-10 text-blue-500 mb-4" />
          )}
          <h3 className="font-semibold text-lg text-gray-900 mb-2">{demo.title}</h3>
          <p className="text-sm text-gray-500 text-center">{demo.desc}</p>
        </button>
      ))}
    </div>
  );
};
