'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import styles from './HeroSection.module.css'; // Adjust the path to your CSS file

const GlobeAnimation = () => {
  const globeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const width = globeRef.current.offsetWidth;
    const height = globeRef.current.offsetHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true }); // Transparent background
    renderer.setSize(width, height);
    globeRef.current.appendChild(renderer.domElement);

    // Globe geometry and material
    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      wireframe: true,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Camera Position
    camera.position.z = 15;

    // Animation Loop
    const animate = () => {
      globe.rotation.y += 0.01; // Spin the globe
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup on Component Unmount
    return () => {
      if (globeRef.current) {
        globeRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className={styles.globe} ref={globeRef}></div>;
};

export default GlobeAnimation;