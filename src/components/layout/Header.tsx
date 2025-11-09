'use client';

import { useEffect, useState } from 'react';
import styles from './Header.module.css';

const sections = ['vision', 'nommo', 'vault', 'contracts'];

export default function Header() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      if (scrollPosition < 200) {
        setActiveSection('');
        document.body.removeAttribute('data-section');
        return;
      }

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el && scrollPosition >= el.offsetTop - 150) {
          setActiveSection(section);
          document.body.setAttribute('data-section', section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h2>The House of Restorative Custodianship and Planetary Exchange</h2>
      </div>
      <nav className={styles.nav}>
        {sections.map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className={activeSection === section ? styles.active : ''}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </a>
        ))}
      </nav>
    </header>
  );
}