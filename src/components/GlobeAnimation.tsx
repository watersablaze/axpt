'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import styles from './HeroSection.module.css'; // Update this path as needed

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

    // Texture for Globe
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('/earth-texture.jpg'); // Provide the path to the texture file

    // Globe Geometry and Material
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: earthTexture,
      emissive: 0x00ffcc, // Glow effect
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

    // Add Orbiting Currency Symbols
    const fontLoader = new FontLoader();
    fontLoader.load('/font.json', (font) => {
      const symbols = ['$', '€', '¥', '£'];
      const radius = 7; // Distance from globe

      symbols.forEach((symbol, index) => {
        const angle = (index / symbols.length) * Math.PI * 2; // Spread symbols evenly
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        // Create Text Geometry
        const textGeometry = new TextGeometry(symbol, {
          font: font,
          size: 0.5,
          height: 0.2,
        });
        const textMaterial = new THREE.MeshStandardMaterial({
          color: 0xffff00,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(x, 0, z); // Set position on orbit
        textMesh.lookAt(globe.position); // Face the globe
        scene.add(textMesh);

        // Animate Orbit
        let t = 0;
        const animateOrbit = () => {
          t += 0.01; // Increment angle
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
      globe.rotation.y += 0.01; // Spin the globe
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup on Unmount
    return () => {
      if (globeRef.current) {
        globeRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className={styles.globe} ref={globeRef}></div>;
};

export default GlobeAnimation;