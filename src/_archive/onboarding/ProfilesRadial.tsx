'use client';

import React, { useState } from 'react';
import styles from './ProfilesRadial.module.css';

// Contributor role definitions
const contributorProfiles = [
  { title: 'Broker', description: 'Facilitate meaningful exchanges between aligned participants.' },
  { title: 'Investor', description: 'Fuel visionary initiatives and access capital with justice orientation.' },
  { title: 'Cultural Steward', description: 'Transmit cultural wisdom through sovereignty and innovation.' },
  { title: 'Fund Manager', description: 'Oversee ethical allocation and flow of pooled capital.' },
  { title: 'Proprietor', description: 'Offer land, resources, or IP in exchange for regenerative partnership.' },
  { title: 'Creative Producer', description: 'Birth narrative, media, and works that anchor AXPT’s story.' },
  { title: 'Supplier / Distributor', description: 'Power logistics and sacred commerce within a circular economy.' },
  { title: 'Project Manager', description: 'Steer transformative endeavors from vision to execution.' },
];

export default function ProfilesRadial() {
  const defaultMessage =
    'Review the surrounding profile anchors.\nYou will select one during your upgrade process.';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={styles.container}>
      {/* Header Title */}
      <div className={styles.header}>
        <h2>Contributor Profiles</h2>
      </div>

      {/* Radial Layout */}
      <div className={styles.radialLayout}>
        {/* Center Orb with Description */}
        <div
          className={`${styles.centerText} ${
            hoveredIndex !== null ? styles.centerGlow : ''
          }`}
        >
          <p>
            {hoveredIndex !== null
              ? contributorProfiles[hoveredIndex].description
              : defaultMessage}
          </p>
        </div>

        {/* Profile Petal Cards */}
        {contributorProfiles.map((profile, index) => {
          const isHovered = hoveredIndex === index;
          const isOtherHovered = hoveredIndex !== null && !isHovered;

          return (
            <div
              key={index}
              className={`${styles.card} ${styles[`pos${index}`]} ${
                isHovered
                  ? styles.cardHover
                  : isOtherHovered
                  ? styles.cardDim
                  : ''
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ animationDelay: `${0.1 * (index + 1)}s` }}
            >
              <h3>{profile.title}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}