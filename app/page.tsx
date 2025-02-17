"use client"

import React from 'react';
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import Footer from "../components/Footer";
import GoldPrice from "./dashboard/GoldPrice"; // Keep live gold price


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