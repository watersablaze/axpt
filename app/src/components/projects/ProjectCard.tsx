'use client';

import Link from 'next/link';
import styles from '@/styles/ProjectCard.module.css';

type Project = {
  id: string;
  title: string;
  tagline: string;
  location: string;
  status: string;
  image: string;
  links: {
    dashboard: string;
  };
};

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className={styles.card}>
      <img src={project.image} alt={project.title} className={styles.image} />
      <div className={styles.content}>
        <h2>{project.title}</h2>
        <p className={styles.tagline}>{project.tagline}</p>
        <p className={styles.location}>📍 {project.location}</p>
        <span className={`${styles.status} ${styles[project.status.toLowerCase()]}`}>
          {project.status.replace('_', ' ')}
        </span>
        <Link href={project.links.dashboard}>
          <button className={styles.cta}>Explore Project</button>
        </Link>
      </div>
    </div>
  );
}
