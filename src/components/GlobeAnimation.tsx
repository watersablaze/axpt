'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import styles from './HeroSection.module.css';

const GlobeAnimation = () => {
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const width = globeRef.current.offsetWidth;
    const height = globeRef.current.offsetHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(width, height);
    globeRef.current.appendChild(renderer.domElement);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      '/textures/globe.transparent.jpg',
      () => console.log('Earth texture loaded successfully'),
      undefined,
      (err) => console.error('Error loading Earth texture', err)
    );

    // Globe Geometry and Material
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: earthTexture, // Apply the Earth texture
      emissive: 0x00ffcc, // Optional glow
      emissiveIntensity: 0.2,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Orbiting Currency Symbols
    const fontLoader = new FontLoader();
    fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
      console.log('Font loaded successfully');
      const symbols = ['$', '€', '¥', '£'];
      const radius = 7;

      symbols.forEach((symbol, index) => {
        const angle = (index / symbols.length) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const textGeometry = new TextGeometry(symbol, {
          font: font,
          size: 0.5,
          height: 0.2,
        });
        const textMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(x, 0, z);
        textMesh.lookAt(globe.position);
        scene.add(textMesh);

        // Orbit Animation
        let t = 0;
        const animateOrbit = () => {
          t += 0.01;
          textMesh.position.x = radius * Math.cos(angle + t);
          textMesh.position.z = radius * Math.sin(angle + t);
          textMesh.lookAt(globe.position);
          requestAnimationFrame(animateOrbit);
        };
        animateOrbit();
      });
    });

    // Camera Position
    camera.position.z = 15;

    // Animation Loop
    const animate = () => {
      globe.rotation.y += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (globeRef.current) {
        globeRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className={styles.globe} ref={globeRef}></div>;
};

export default GlobeAnimation;