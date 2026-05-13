import {
  LandingCTA,
  LandingDatabases,
  LandingFAQ,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingNav,
  LandingSecurity,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-[#08090a] text-[#f7f8f8] [color-scheme:dark]">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingSecurity />
        <LandingDatabases />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
