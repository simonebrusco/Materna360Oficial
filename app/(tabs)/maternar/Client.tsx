'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CardHub from '@/components/maternar/CardHub';
import { track } from '@/app/lib/telemetry';
import { useProfile } from '@/app/hooks/useProfile';
import AppIcon from '@/components/ui/AppIcon';
import { DAILY_MESSAGES } from '@/app/data/dailyMessages';
import { getDailyIndex } from '@/app/lib/dailyMessage';
import { getTimeGreeting } from '@/app/lib/greetings';
import { Reveal } from '@/components/ui/Reveal';
import { ClientOnly } from '@/components/common/ClientOnly';
import { MotivationalFooter } from '@/components/common/MotivationalFooter';

export default function MaternarClient() {
  const { name } = useProfile();
  const [greeting, setGreeting] = useState<string>('');

  useEffect(() => {
    track('nav.click', {
      tab: 'maternar',
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Update greeting based on time
  useEffect(() => {
    const firstName = name ? name.split(' ')[0] : '';
    const timeGreeting = getTimeGreeting(firstName);
    setGreeting(timeGreeting);

    // Update greeting every minute to reflect time changes
    const interval = setInterval(() => {
      const updatedGreeting = getTimeGreeting(firstName);
      setGreeting(updatedGreeting);
    }, 60000);

    return () => clearInterval(interval);
  }, [name]);

  // Daily message reload at midnight
  useEffect(() => {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const delay = Math.max(midnight.getTime() - now.getTime() + 1000, 0);
    const timeoutId = window.setTimeout(() => window.location.reload(), delay);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const firstName = name ? name.split(' ')[0] : '';
  const isProfileIncomplete = !name || name.trim() === '';

  // Get the current daily message
  const dayIndex = getDailyIndex(new Date(), DAILY_MESSAGES.length);
  const dailyMessage = DAILY_MESSAGES[dayIndex];

  return (
    <main
      data-layout="page-template-v1"
      className="bg-white min-h-[100dvh] pb-24"
    >
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        {/* Premium Hero Header - HUB principal */}
        <header className="pt-8 md:pt-10 mb-8 md:mb-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 sp
