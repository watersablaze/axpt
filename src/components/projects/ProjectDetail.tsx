'use client';

import styles from '@/styles/ProjectDetail.module.css';
import { useEffect, useState } from 'react';
import ImpactMetrics from './ImpactMetrics';
import Link from 'next/link';

type Project = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  location: string;
  status: string;
  tier: string;
  token: string;
  image: string;
  links: {
    whitepaper?: string;
    dashboard?: string;
  };
  impact?: {
    axgRaised?: number;
    beneficiaries?: number;
    landRestored?: number;
    jobsCreated?: number;
  };
  videoEmbed?: string;
  roadmap?: string[];
};

export default function ProjectDetail({ project }: { project: Project }) {
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={`${styles.container} ${fadeIn ? styles.fadeIn : ''}`}>
      <div className={styles.hero}>
        <img src={project.image} alt={project.title} className={styles.heroImage} />
        <div className={styles.overlay} />
        <div className={styles.heroText}>
          <h1>{project.title}</h1>
          <p className={styles.tagline}>{project.tagline}</p>
          <div className={styles.meta}>
            <span className={styles.token}>Token: {project.token}</span>
            <span className={styles.tier}>Tier: {project.tier}</span>
            <span className={`${styles.status} ${styles[project.status.toLowerCase()]}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <h2>Description</h2>
        <p>{project.description}</p>

        <h3>📍 Location: {project.location}</h3>

        {project.videoEmbed && (
          <div className={styles.videoWrapper}>
            <iframe
              src={project.videoEmbed}
              frameBorder="0"
              allowFullScreen
              title="Project Video"
              className={styles.video}
            />
          </div>
        )}

        <ImpactMetrics impact={project.impact} />

        {project.roadmap && (
          <div className={styles.roadmap}>
            <h3>🛤️ Project Roadmap</h3>
            <ul>
              {project.roadmap.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {project.links?.whitepaper && (
          <a
            className={styles.link}
            href={project.links.whitepaper}
            target="_blank"
            rel="noopener noreferrer"
          >
            📄 View Whitepaper
          </a>
        )}
        <Link className={styles.link} href="/projects">
          ← Back to All Projects
        </Link>
      </div>
    </div>
  );
}
