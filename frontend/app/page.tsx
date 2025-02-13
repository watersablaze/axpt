"use client"

import React from 'react';
import Header from "../../components/Header";
import HeroSection from "../../components/HeroSection";
import Footer from "../../components/Footer";
import GoldPrice from "../../components/GoldPrice"; // Keep live gold price


export default function Home() {
  return (
    <main>
      <Header />
      <HeroSection />
      <GoldPrice /> 
      <Footer />
    </main>
  );
}