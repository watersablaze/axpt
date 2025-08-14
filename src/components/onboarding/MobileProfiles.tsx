'use client';

import { useState } from 'react';

const roles = [
  {
    name: 'Investor',
    description: 'Provides capital and visionary backing for sacred, sustainable ventures.',
  },
  {
    name: 'Project Manager',
    description: 'Orchestrates logistics, timelines, and team coordination for on-ground projects.',
  },
  {
    name: 'Broker',
    description: 'Connects assets, negotiates deals, and enables value exchange across borders.',
  },
  {
    name: 'Cultural Steward',
    description: 'Protects indigenous knowledge, practices, and rituals at the core of each project.',
  },
  {
    name: 'Supplier / Distributor',
    description: 'Channels goods, herbs, or commodities through decentralized trade routes.',
  },
  {
    name: 'Creative Producer',
    description: 'Develops narrative, media, and symbolic layers of the ecosystem’s expression.',
  },
  {
    name: 'Fund Manager',
    description: 'Oversees financial flow, transparency, and return-to-impact strategies.',
  },
  {
    name: 'Proprietor',
    description: 'Holds land or business infrastructure in alignment with ancestral values.',
  },
];

export default function MobileProfiles() {
  const [openRole, setOpenRole] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setOpenRole(prev => (prev === role ? null : role));
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <h2 className="text-center text-base font-semibold text-slate-400 mb-4">
        Choose Your Profile
      </h2>

      {roles.map(({ name, description }) => {
        const isOpen = openRole === name;

        return (
          <div key={name} className="mb-4">
            <button
              onClick={() => toggleRole(name)}
              className={`w-full text-left px-5 py-3 rounded-lg border transition-colors duration-200 font-medium
                ${isOpen
                  ? 'bg-sky-700 text-sky-100 border-sky-400 shadow-md'
                  : 'bg-slate-900 text-slate-100 border-slate-600 hover:bg-slate-800'}`}
            >
              {name}
            </button>

            {isOpen && (
              <div className="text-sm text-slate-300 px-5 py-3 rounded-b-lg bg-slate-950 border-l-4 border-cyan-400 mt-1 transition-opacity duration-300">
                {description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}