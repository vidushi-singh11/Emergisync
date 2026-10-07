import React from 'react';
import { Hero } from '../components/sections/Hero';
import { Lifecycle } from '../components/sections/Lifecycle';
import { Network } from '../components/sections/Network';
import { Problem } from '../components/sections/Problem';
import { Architecture } from '../components/sections/Architecture';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const LandingPage = () => {
  return (
    <div className="bg-void-black min-h-screen text-text-primary selection:bg-accent-cyan selection:text-void-black">
      <Navbar />
      <main>
        <Hero />
        <Lifecycle />
        <Network />
        <Problem />
        <Architecture />
      </main>
      <Footer />
    </div>
  );
};
