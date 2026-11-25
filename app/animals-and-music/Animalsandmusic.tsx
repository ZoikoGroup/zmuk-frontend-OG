"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PlayCircle, X } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  image: string;
  youtubeId: string;
}

interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  tracksLabel: string;
  image: string;
  spotifyTrackId: string;
}

interface ReadingItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  meta: string;
  image?: string;
}

interface CreatorItem {
  id: string;
  name: string;
  specialty: string;
  image: string;
  bio: string;
}

const FEATURED_VIDEOS: VideoItem[] = [
  {
    id: "dogs-day-out",
    title: "A Dog's Day Out",
    subtitle: "Play, explore and enjoy the great outdoors.",
    duration: "4:26",
    image: "/images/animals-and-music/featured-dogs-day-out.png",
    youtubeId: "C5jS1gNWcAA",
  },
  {
    id: "rhythms-of-the-wild",
    title: "Rhythms of the Wild",
    subtitle: "The natural sounds of Africa.",
    duration: "5:17",
    image: "/images/animals-and-music/featured-rhythms-wild.png",
    youtubeId: "QpkByzZpUbw",
  },
  {
    id: "cats-at-the-keyboard",
    title: "Cats at the Keyboard",
    subtitle: "A relaxed moment with a musical twist.",
    duration: "3:05",
    image: "/images/animals-and-music/featured-cats-keyboard.png",
    youtubeId: "obNvRR2pux8",
  },
  {
    id: "birdsong-symphony",
    title: "Birdsong Symphony",
    subtitle: "Nature's everyday musicians.",
    duration: "2:48",
    image: "/images/animals-and-music/featured-birdsong-symphony.png",
    youtubeId: "8rSH8-pbHZ0",
  },
];

const SHORT_VIDEOS: VideoItem[] = [
  {
    id: "golden-puppy",
    title: "Playful Golden Puppy",
    subtitle: "Bright outdoor puppy energy set to cheerful acoustic strums.",
    duration: "0:45",
    image: "/images/animals-and-music/short-golden-puppy.png",
    youtubeId: "C5jS1gNWcAA",
  },
  {
    id: "tabby-kitten",
    title: "Curious Tabby Kitten Stretch",
    subtitle: "A curious tabby paws along with soft piano chords.",
    duration: "0:32",
    image: "/images/animals-and-music/short-tabby-kitten.png",
    youtubeId: "obNvRR2pux8",
  },
  {
    id: "macaw-melody",
    title: "Blue and Gold Macaw Melody",
    subtitle: "Vibrant feathers and unmistakable avian rhythm.",
    duration: "0:58",
    image: "/images/animals-and-music/short-macaw-melody.png",
    youtubeId: "8rSH8-pbHZ0",
  },
  {
    id: "meadow-rabbit",
    title: "Meadow Rabbit Ears Listening",
    subtitle: "Quiet meadow breezes and gentle acoustic melodies.",
    duration: "0:36",
    image: "/images/animals-and-music/short-meadow-rabbit.png",
    youtubeId: "iucW5evsuLE",
  },
];

const PLAYLISTS: PlaylistItem[] = [
  {
    id: "pet-playtime-beats",
    title: "Pet Playtime Beats",
    description: "Upbeat tracks for active pets and happy moments.",
    tracksLabel: "18 tracks",
    image: "/images/animals-and-music/playlist-pet-playtime.png",
    spotifyTrackId: "6QvzZe7cI3MShQDorCavxA",
  },
  {
    id: "calm-companions",
    title: "Calm Companions",
    description:
      "Soothing ambient instrumentals designed to help pets unwind.",
    tracksLabel: "32 tracks",
    image: "/images/animals-and-music/playlist-calm-companions.png",
    spotifyTrackId: "4EA5ge8hgE6OySXrVqrjxn",
  },
  {
    id: "wildlife-soundscapes",
    title: "Wildlife Soundscapes",
    description:
      "Woodland choruses, rainfall and natural acoustic recordings.",
    tracksLabel: "28 tracks",
    image: "/images/animals-and-music/playlist-wildlife-soundscapes.png",
    spotifyTrackId: "49fOxBc8o4a9cNwvglo1zN",
  },
  {
    id: "natures-orchestra",
    title: "Nature's Orchestra",
    description:
      "Classical melodies woven alongside songbird Dawn choruses.",
    tracksLabel: "24 tracks",
    image: "/images/animals-and-music/playlist-natures-orchestra.png",
    spotifyTrackId: "74GeIYnKynMtgqOV1BzjfL",
  },
];

const HARMONY_MAIN_VIDEO: VideoItem = {
  id: "dolphins-ocean-harmony",
  title: "Ocean Harmony",
  subtitle: "Dolphins gliding through sunlit ocean waters with calm accompaniment.",
  duration: "5:37",
  image: "/images/animals-and-music/harmony-dolphins-main.png",
  youtubeId: "iucW5evsuLE",
};

const HARMONY_SIDE_VIDEOS: VideoItem[] = [
  {
    id: "ocean-harmony-thumb",
    title: "Ocean Harmony",
    subtitle: "Calm ocean waves paired with gentle ambient instrumentation.",
    duration: "4:12",
    image: "/images/animals-and-music/harmony-ocean-thumb.png",
    youtubeId: "iucW5evsuLE",
  },
  {
    id: "wildlife-classical",
    title: "Wildlife & Classical",
    subtitle: "Untamed landscapes scored by timeless orchestral classics.",
    duration: "6:14",
    image: "/images/animals-and-music/harmony-wildlife-thumb.png",
    youtubeId: "flUk-CDzV38",
  },
  {
    id: "pets-musical-world",
    title: "A Pet's Musical World",
    subtitle: "Seeing how everyday companion animals react to live melody.",
    duration: "4:08",
    image: "/images/animals-and-music/harmony-pets-world-thumb.png",
    youtubeId: "obNvRR2pux8",
  },
];

const SPECIAL_STORIES: ReadingItem[] = [
  {
    id: "second-chance",
    title: "A Second Chance",
    summary:
      "The heart-warming rescue story of a dog who found a forever home.",
    body: "When Barnaby arrived at a community shelter after months on the move, gentle acoustic guitar sessions helped soothe his nerves while volunteers worked patiently to build trust. Today, he greets every morning with a wagging tail alongside his adoptive family.",
    meta: "5 min read",
    image: "/images/animals-and-music/story-second-chance.png",
  },
  {
    id: "wildlife-focus",
    title: "Wildlife in Focus",
    summary: "Stunning moments from the natural world around us.",
    body: "From misty highland ridges at dawn to quiet UK woodlands, field recordists and wildlife photographers capture how seasonal bird calls and natural rhythms weave together across our ecosystems.",
    meta: "4 min read",
    image: "/images/animals-and-music/story-wildlife-focus.png",
  },
  {
    id: "power-companionship",
    title: "The Power of Companionship",
    summary: "How pets bring joy, comfort and balance.",
    body: "Spending mindful time outdoors or relaxing to soft music with a loyal companion lowers daily stress and strengthens everyday wellbeing for families across the UK.",
    meta: "4 min read",
    image: "/images/animals-and-music/story-companionship.png",
  },
];

const RESCUE_BAILEY_VIDEO: VideoItem = {
  id: "bailey-rescue",
  title: "From Shelter to Forever Home",
  subtitle: "Meet Bailey and see how adoption changed his life.",
  duration: "3:36",
  image: "/images/animals-and-music/rescue-bailey.png",
  youtubeId: "B8FWGSjcgaI",
};

const DISCOVER_TOPICS: ReadingItem[] = [
  {
    id: "animal-behaviour",
    title: "Animal behaviour",
    summary: "Understanding vocalisations, curiosity and play cues.",
    body: "Animals rely on subtle shifts in posture, ear position and vocal cadence to communicate comfort, alertness and social bonding.",
    meta: "Guide",
  },
  {
    id: "music-and-animals",
    title: "Music and animals",
    summary: "Why slower tempos calm shelter dogs and songbirds respond to pitch.",
    body: "Studies show mellow piano and strings can reduce restlessness in kennels, while cockatiels and parrots actively match rhythmic phrases.",
    meta: "Research",
  },
  {
    id: "wildlife-and-nature",
    title: "Wildlife and nature",
    summary: "Acoustic biodiversity across British coasts, meadows and woodlands.",
    body: "Listening closely to dawn choruses and marine soundscapes helps conservationists monitor thriving habitats across the UK.",
    meta: "Feature",
  },
  {
    id: "facts-and-guides",
    title: "Facts and guides",
    summary: "Practical tips for calm travel, pet routines and sensory care.",
    body: "Simple routines—from calming playlists during fireworks to vet-approved travel prep—help keep pets relaxed year-round.",
    meta: "Quick Read",
  },
];

const CREATORS: CreatorItem[] = [
  {
    id: "peter-graham",
    name: "Peter Graham",
    specialty: "Parrot Vocals",
    image: "/images/animals-and-music/creator-peter-graham.png",
    bio: "Acoustic guitarist and bird lover recording playful duet improvisations alongside rescued parrots.",
  },
  {
    id: "hayley-hoffman",
    name: "Hayley Hoffman",
    specialty: "Pet Symphony",
    image: "/images/animals-and-music/creator-hayley-hoffman.png",
    bio: "Composer crafting gentle chamber arrangements tailored to help anxious pets feel settled at home.",
  },
  {
    id: "doug-carroll",
    name: "Doug Carroll",
    specialty: "Canine Beats",
    image: "/images/animals-and-music/creator-doug-carroll.png",
    bio: "Sound designer blending park walks and playful bark rhythms into upbeat feel-good playlists.",
  },
  {
    id: "jean-c-sophie",
    name: "Jean C. Sophie",
    specialty: "Ocean Sounds",
    image: "/images/animals-and-music/creator-jean-sophie.png",
    bio: "Marine bioacoustics storyteller sharing coastal field recordings and whale song documentaries.",
  },
];

const NEWS_ITEMS: ReadingItem[] = [
  {
    id: "respond-to-music",
    title: "The surprising ways animals respond to music",
    summary:
      "Researchers continue to uncover how tempo and tone influence animal calm and curiosity.",
    body: "Recent observations across shelters and wildlife sanctuaries reveal that gentle classical and acoustic music encourages restfulness in dogs and curious vocal interplay among songbirds.",
    meta: "15 Mar 2025 • 3 min read",
    image: "/images/animals-and-music/news-whale-music.png",
  },
  {
    id: "birds-and-song",
    title: "Nature's greatest performers: birds and their songs",
    summary: "Exploring the vocal precision of rainforest and garden songbirds.",
    body: "From tropical scarlet macaws to garden blackbirds, avian vocalists compose intricate melodic variations to establish territory and strengthen social bonds.",
    meta: "10 Mar 2025 • 4 min read",
    image: "/images/animals-and-music/news-scarlet-macaw.png",
  },
];

export default function AnimalsAndMusic() {
  const [featuredOffset, setFeaturedOffset] = useState<number>(0);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistItem>(
    PLAYLISTS[0]
  );
  const [activeHarmonyVideo, setActiveHarmonyVideo] =
    useState<VideoItem>(HARMONY_MAIN_VIDEO);

  const [videoModal, setVideoModal] = useState<VideoItem | null>(null);
  const [spotifyModal, setSpotifyModal] = useState<PlaylistItem | null>(null);
  const [readingModal, setReadingModal] = useState<ReadingItem | null>(null);
  const [creatorModal, setCreatorModal] = useState<CreatorItem | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);

  const [shareName, setShareName] = useState<string>("");
  const [shareTitle, setShareTitle] = useState<string>("");
  const [shareNotes, setShareNotes] = useState<string>("");
  const [shareSubmitted, setShareSubmitted] = useState<boolean>(false);

  const visibleFeatured = useMemo(() => {
    const count = FEATURED_VIDEOS.length;
    return Array.from({ length: count }, (_, idx) => {
      return FEATURED_VIDEOS[(featuredOffset + idx + count) % count];
    });
  }, [featuredOffset]);

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShareSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      {/* Section 1: Hero Banner */}
      <section className="relative overflow-hidden bg-[#1e1024]">
        <img
          src="/images/animals-and-music/hero-banner.png"
          alt="Animals wearing headphones enjoying music"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right md:object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a0b1d]/85 via-[#2e0c25]/55 to-transparent lg:via-[#2e0c25]/25"
        />

        <div className="relative mx-auto max-w-[1280px] px-6 py-8 md:py-10">
          <div className="max-w-[662px]">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.96px] text-white/92">
              THE ANIMAL &amp; MUSIC LOVING NETWORK
            </p>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.1] tracking-[-0.8px] text-white sm:text-[40px]">
              Where your love of animals meets the rhythm of music.
            </h1>
            <p className="mt-3 max-w-[480px] text-[15.5px] font-medium leading-[1.45] text-white/94">
              Watch, listen, learn and share heart-warming stories, music and
              moments from the animal world.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setVideoModal(FEATURED_VIDEOS[0])}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-white/90 bg-[#c90058] px-[22px] py-2.5 text-[14px] font-bold text-white shadow-[0px_6px_9px_rgba(0,0,0,0.24)] transition hover:bg-[#a90049]"
              >
                <PlayCircle
                  className="h-[17px] w-[17px] text-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Watch now</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("community-section")}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-white/85 bg-[#053b39]/45 px-[22px] py-2.5 text-[14px] font-bold text-white backdrop-blur-[6px] transition hover:bg-[#053b39]/65"
              >
                <span>Explore the community</span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Category Navigation Strip */}
      <nav
        aria-label="Animals and Music content categories"
        className="border-b border-[#e2e8f0] bg-white py-3"
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-2.5 px-4 sm:grid-cols-3 md:grid-cols-5 md:px-6">
          {[
            {
              icon: "▶",
              title: "Watch",
              sub: "Videos & shows",
              target: "watch-section",
            },
            {
              icon: "♫",
              title: "Listen",
              sub: "Playlists & sounds",
              target: "listen-section",
            },
            {
              icon: "📖",
              title: "Read",
              sub: "Stories & features",
              target: "read-section",
            },
            {
              icon: "🎓",
              title: "Learn",
              sub: "Discover & explore",
              target: "learn-section",
            },
            {
              icon: "👥",
              title: "Community",
              sub: "Share & connect",
              target: "community-section",
            },
          ].map((tab, idx, arr) => (
            <button
              key={tab.title}
              type="button"
              onClick={() => scrollToSection(tab.target)}
              className={`flex cursor-pointer items-center justify-center gap-2.5 px-2.5 py-1.5 text-left transition hover:opacity-80 ${
                idx < arr.length - 1 ? "md:border-r md:border-[#e2e8f0]" : ""
              }`}
            >
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#fff1f5] text-[16px] text-[#c90058]">
                {tab.icon}
              </span>
              <span>
                <span className="block text-[14px] font-extrabold leading-tight text-[#0f172a]">
                  {tab.title}
                </span>
                <span className="block text-[11.5px] leading-tight text-[#475569]">
                  {tab.sub}
                </span>
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
        {/* Section 3: Featured Today */}
        <section id="watch-section">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div>
                <h2 className="text-[22px] font-extrabold text-[#0f172a]">
                  Featured Today
                </h2>
                <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
              </div>
              <p className="text-[13px] text-[#475569]">
                Our hand-picked videos, playlists and stories from the world of
                animals and music.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVideoModal(FEATURED_VIDEOS[0])}
              className="cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
            >
              View all featured ›
            </button>
          </div>

          <div className="relative mt-3.5">
            <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
              {visibleFeatured.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVideoModal(item)}
                  aria-label={`Play featured video: ${item.title}, ${item.duration}`}
                  className="group relative h-[175px] w-full cursor-pointer overflow-hidden rounded-[14px] bg-[#1e293b] text-left shadow-[0px_3px_14px_rgba(5,59,57,0.06)]"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/10 via-black/20 to-black/80 p-3">
                    <span className="inline-block w-fit rounded-[6px] bg-[#0f172a]/80 px-2 py-0.5 text-[11px] font-extrabold text-white">
                      {item.duration}
                    </span>

                    <div className="pr-2">
                      <h3 className="text-[14.5px] font-extrabold leading-snug text-white">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[11.5px] text-white/88">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute top-[55px] left-1/2 flex h-[44px] w-[44px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#c90058]/92 text-[15px] text-white shadow-[0px_4px_14px_rgba(0,0,0,0.3)] transition group-hover:scale-105"
                  >
                    ▶
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setFeaturedOffset(
                  (prev) =>
                    (prev - 1 + FEATURED_VIDEOS.length) %
                    FEATURED_VIDEOS.length
                )
              }
              aria-label="Previous featured videos"
              className="absolute top-1/2 -left-3 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#cbd5e1] bg-white text-[#0f172a] shadow-[0px_4px_6px_rgba(0,0,0,0.14)] transition hover:border-[#c90058] md:flex"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() =>
                setFeaturedOffset((prev) => (prev + 1) % FEATURED_VIDEOS.length)
              }
              aria-label="Next featured videos"
              className="absolute top-1/2 -right-3 hidden h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#cbd5e1] bg-white text-[#0f172a] shadow-[0px_4px_6px_rgba(0,0,0,0.14)] transition hover:border-[#c90058] md:flex"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Section 4: Quick Paws + Tunes with a Tail */}
        <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          {/* Quick Paws – Short Videos */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.06)]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div>
                  <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                    Quick Paws – Short Videos
                  </h2>
                  <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
                </div>
                <p className="text-[13px] text-[#475569]">
                  Bite-sized animal moments that make you smile.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVideoModal(SHORT_VIDEOS[0])}
              className="mt-2 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
            >
              View more ›
            </button>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {SHORT_VIDEOS.map((short) => (
                <button
                  key={short.id}
                  type="button"
                  onClick={() => setVideoModal(short)}
                  aria-label={`Play short video: ${short.title}, ${short.duration}`}
                  className="group relative h-[168px] cursor-pointer overflow-hidden rounded-[12px] bg-[#0f172a]"
                >
                  <img
                    src={short.image}
                    alt={short.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute bottom-7 left-1/2 flex h-[34px] w-[34px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-[#c90058]/92 text-[12px] text-white"
                  >
                    ▶
                  </span>
                  <span className="absolute right-1.5 bottom-1.5 rounded-[5px] bg-[#0f172a]/82 px-1.5 py-[2px] text-[10.5px] font-extrabold text-white">
                    {short.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tunes with a Tail */}
          <div
            id="listen-section"
            className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.06)]"
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div>
                <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                  Tunes with a Tail
                </h2>
                <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#064f46]" />
              </div>
              <p className="text-[13px] text-[#475569]">
                Curated playlists and audio collections inspired by animals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSpotifyModal(activePlaylist)}
              className="mt-2 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
            >
              Browse playlists ›
            </button>

            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-[1.35fr_1fr]">
              {/* Highlighted Playlist Card */}
              <div
                className="flex min-h-[166px] items-center gap-3 rounded-[14px] p-3.5"
                style={{
                  backgroundImage:
                    "linear-gradient(152deg, rgb(39, 23, 16) 0%, rgb(75, 42, 25) 100%)",
                }}
              >
                <div className="relative h-[112px] w-[96px] shrink-0 overflow-hidden rounded-[10px]">
                  <img
                    src={activePlaylist.image}
                    alt={activePlaylist.title}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setSpotifyModal(activePlaylist)}
                    aria-label={`Play ${activePlaylist.title}`}
                    className="absolute bottom-2 left-1.5 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#c90058]/92 text-[12px] text-white"
                  >
                    ▶
                  </button>
                </div>

                <div>
                  <h3 className="text-[16px] font-extrabold leading-tight text-white">
                    {activePlaylist.title}
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-snug text-white/86">
                    {activePlaylist.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSpotifyModal(activePlaylist)}
                    className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/25 bg-[#111827] px-3 py-1 text-[11px] font-bold text-white transition hover:border-white/50"
                  >
                    <span className="text-[12px] text-[#1db954]" aria-hidden="true">
                      ●
                    </span>
                    <span>Listen on Spotify</span>
                  </button>
                </div>
              </div>

              {/* 3 Secondary Playlist Rows */}
              <div className="flex flex-col justify-between gap-2">
                {PLAYLISTS.slice(1).map((pl) => {
                  const isActive = activePlaylist.id === pl.id;
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => {
                        setActivePlaylist(pl);
                        setSpotifyModal(pl);
                      }}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-2 py-1.5 text-left transition ${
                        isActive
                          ? "border-[#c90058] bg-[#fff1f5]"
                          : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#cbd5e1]"
                      }`}
                    >
                      <img
                        src={pl.image}
                        alt={pl.title}
                        className="h-[36px] w-[44px] shrink-0 rounded-[7px] object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="truncate text-[12px] font-extrabold text-[#0f172a]">
                          {pl.title}
                        </h4>
                        <p className="text-[10.5px] text-[#475569]">
                          {pl.tracksLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Animals in Harmony + Special Moments Shared */}
        <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          {/* Animals in Harmony */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.06)]">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div>
                <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                  Animals in Harmony
                </h2>
                <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
              </div>
              <p className="text-[13px] text-[#475569]">
                Videos where animals, sound and nature come together.
              </p>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-[1.66fr_1fr]">
              <button
                type="button"
                onClick={() => setVideoModal(activeHarmonyVideo)}
                aria-label={`Play featured video: ${activeHarmonyVideo.title}`}
                className="group relative min-h-[260px] cursor-pointer overflow-hidden rounded-[14px] bg-[#0c4a6e] sm:h-[432px]"
              >
                <img
                  src={activeHarmonyVideo.image}
                  alt={activeHarmonyVideo.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 flex h-[44px] w-[44px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#c90058]/92 text-[16px] text-white shadow-[0px_4px_14px_rgba(0,0,0,0.3)] transition group-hover:scale-105"
                >
                  ▶
                </span>
                <span className="absolute bottom-2.5 left-2.5 rounded-[6px] bg-[#0f172a]/82 px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {activeHarmonyVideo.duration}
                </span>
              </button>

              <div className="flex flex-col justify-between gap-2.5">
                {HARMONY_SIDE_VIDEOS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveHarmonyVideo(item);
                      setVideoModal(item);
                    }}
                    className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-2 py-2 text-left transition hover:border-[#fecdd3]"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-[70px] w-[70px] shrink-0 rounded-[7px] object-cover"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[12px] font-extrabold leading-tight text-[#0f172a]">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-[#475569]">
                        {item.duration}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Moments Shared */}
          <div
            id="read-section"
            className="flex flex-col justify-between rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0px_3px_7px_rgba(5,59,57,0.06)]"
          >
            <div>
              <div>
                <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                  Special Moments Shared
                </h2>
                <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#064f46]" />
              </div>
              <p className="mt-3 text-[13px] text-[#475569]">
                Real stories, rescues and the special bond between people and
                animals.
              </p>
              <button
                type="button"
                onClick={() => setReadingModal(SPECIAL_STORIES[0])}
                className="mt-5 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                More stories ›
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SPECIAL_STORIES.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => setReadingModal(story)}
                  className="flex h-full cursor-pointer flex-col overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white text-left transition hover:border-[#fecdd3]"
                >
                  <img
                    src={story.image}
                    alt={story.title}
                    className="h-[146px] w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between p-2.5">
                    <div>
                      <h3 className="text-[12.5px] font-extrabold leading-snug text-[#0f172a]">
                        {story.title}
                      </h3>
                      <p className="mt-1 text-[11px] leading-[1.3] text-[#475569]">
                        {story.summary}
                      </p>
                    </div>
                    <span className="mt-2.5 text-[10.5px] font-bold text-[#64748b]">
                      {story.meta}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Pawsitive Stories + Discover & Learn */}
        <section className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
          {/* Pawsitive Stories – Rescue & Adoption */}
          <div className="flex flex-col justify-between rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0px_3px_7px_rgba(5,59,57,0.06)]">
            <div>
              <div>
                <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                  Pawsitive Stories – Rescue &amp; Adoption
                </h2>
                <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
              </div>
              <p className="mt-2.5 text-[13px] text-[#475569]">
                Inspiring rescue journeys, adoption stories and practical
                advice.
              </p>
              <button
                type="button"
                onClick={() => setVideoModal(RESCUE_BAILEY_VIDEO)}
                className="mt-2 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                View all ›
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 items-center gap-3.5 sm:grid-cols-[1.35fr_1fr]">
              <button
                type="button"
                onClick={() => setVideoModal(RESCUE_BAILEY_VIDEO)}
                className="group flex cursor-pointer items-center gap-3 rounded-[12px] border border-[#e2e8f0] bg-[#f8fafc] p-2 text-left transition hover:border-[#fecdd3]"
              >
                <div className="relative h-[158px] w-[140px] shrink-0 overflow-hidden rounded-[9px]">
                  <img
                    src={RESCUE_BAILEY_VIDEO.image}
                    alt={RESCUE_BAILEY_VIDEO.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 right-2 flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#c90058]/92 text-[12px] text-white"
                  >
                    ▶
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-[5px] bg-[#0f172a]/82 px-1.5 py-[2px] text-[10.5px] font-extrabold text-white">
                    {RESCUE_BAILEY_VIDEO.duration}
                  </span>
                </div>

                <div>
                  <h3 className="text-[14.5px] font-extrabold leading-tight text-[#0f172a]">
                    {RESCUE_BAILEY_VIDEO.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] leading-snug text-[#475569]">
                    {RESCUE_BAILEY_VIDEO.subtitle}
                  </p>
                </div>
              </button>

              <ul className="space-y-3.5 pl-1">
                {[
                  "Adoption stories",
                  "Rescue highlights",
                  "Responsible pet ownership",
                  "Tips from pet experts",
                ].map((label) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="text-[12px] font-extrabold text-[#c90058]">
                      ✓
                    </span>
                    <span className="text-[12px] font-bold text-[#0f172a]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Discover & Learn */}
          <div
            id="learn-section"
            className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-6 shadow-[0px_3px_7px_rgba(5,59,57,0.06)]"
          >
            <div>
              <h2 className="text-[19px] font-extrabold text-[#0f172a]">
                Discover &amp; Learn
              </h2>
              <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#064f46]" />
              <p className="mt-2.5 text-[13px] text-[#475569]">
                Fascinating insights into animal behaviour, sounds and the role
                of music in their world.
              </p>
              <button
                type="button"
                onClick={() => setReadingModal(DISCOVER_TOPICS[0])}
                className="mt-2 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                Explore more ›
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-[248px_1fr]">
              <div className="h-[294px] overflow-hidden rounded-[12px]">
                <img
                  src="/images/animals-and-music/learn-barn-owl.png"
                  alt="Close-up portrait of a barn owl"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between gap-2.5">
                {DISCOVER_TOPICS.map((topic, idx) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setReadingModal(topic)}
                    className="flex h-[63px] cursor-pointer items-center gap-2.5 rounded-[9px] border border-[#e2e8f0] bg-[#f8fafc] px-3 text-left transition hover:border-[#fecdd3]"
                  >
                    <span className="text-[14px]" aria-hidden="true">
                      {idx === 0
                        ? "🐾"
                        : idx === 1
                          ? "♫"
                          : idx === 2
                            ? "🌍"
                            : "📖"}
                    </span>
                    <span className="text-[12px] font-bold text-[#0f172a]">
                      {topic.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Creators + News + Share Your Moment */}
        <section
          id="community-section"
          className="grid grid-cols-1 gap-4 lg:grid-cols-[1.53fr_1.33fr_1fr]"
        >
          {/* Featured Creators & Artists */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.06)]">
            <div>
              <h2 className="text-[18px] font-extrabold text-[#0f172a]">
                Featured Creators &amp; Artists
              </h2>
              <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
              <p className="mt-2.5 text-[13px] text-[#475569]">
                Meet animal lovers, musicians and storytellers from our
                community.
              </p>
              <button
                type="button"
                onClick={() => setCreatorModal(CREATORS[0])}
                className="mt-2 inline-block cursor-pointer text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                See all creators ›
              </button>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {CREATORS.map((creator) => (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => setCreatorModal(creator)}
                  className="flex cursor-pointer flex-col items-center text-center transition hover:opacity-85"
                >
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className="h-[74px] w-[74px] rounded-full border-[2.5px] border-[#ffe4ed] object-cover"
                  />
                  <span className="mt-1.5 text-[12px] font-extrabold text-[#0f172a]">
                    {creator.name}
                  </span>
                  <span className="text-[10.5px] text-[#475569]">
                    {creator.specialty}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Animal & Music News */}
          <div className="rounded-[16px] border border-[#e2e8f0] bg-white px-5 py-[18px] shadow-[0px_3px_7px_rgba(5,59,57,0.06)]">
            <div>
              <h2 className="text-[18px] font-extrabold text-[#0f172a]">
                Animal &amp; Music News
              </h2>
              <span className="mt-0.5 block h-[3px] w-[44px] rounded-[2px] bg-[#c90058]" />
              <p className="mt-2.5 text-[13px] text-[#475569]">
                The latest stories, trends and features from the animal world.
              </p>
              <Link
                href="/news"
                className="mt-2 inline-block text-[13px] font-extrabold text-[#c90058] hover:underline"
              >
                More news ›
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {NEWS_ITEMS.map((news) => (
                <button
                  key={news.id}
                  type="button"
                  onClick={() => setReadingModal(news)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] p-[7px] text-left transition hover:border-[#fecdd3]"
                >
                  <img
                    src={news.image}
                    alt={news.title}
                    className="h-[48px] w-[68px] shrink-0 rounded-[7px] object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="text-[12px] font-extrabold leading-snug text-[#0f172a]">
                      {news.title}
                    </h3>
                    <p className="mt-0.5 text-[10.5px] text-[#64748b]">
                      {news.meta}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Share Your Moment */}
          <div
            className="flex flex-col justify-between rounded-[16px] border border-[#fecdd3] px-[18px] py-6"
            style={{
              backgroundImage:
                "linear-gradient(157deg, rgb(255, 241, 245) 8.5%, rgb(255, 255, 255) 91.5%)",
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px]" aria-hidden="true">
                  📷
                </span>
                <h2 className="text-[17px] font-extrabold text-[#0f172a]">
                  Share Your Moment
                </h2>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">
                Got a great video, photo or story to share? Be part of the
                Zoiko community.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShareSubmitted(false);
                setShareModalOpen(true);
              }}
              className="mt-6 flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#c90058] px-4 text-[13px] font-extrabold text-white transition hover:bg-[#a90049]"
            >
              <span>Upload your content</span>
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        {/* Section 8: Bottom Split Banner */}
        <section className="grid grid-cols-1 overflow-hidden rounded-[18px] border border-[#e2e8f0] bg-white shadow-[0px_3px_14px_rgba(5,59,57,0.06)] lg:grid-cols-[2.64fr_1fr]">
          <div
            className="flex flex-wrap items-center justify-between gap-4 px-[26px] py-[22px]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(156, 7, 68, 0.88) 0%, rgba(201, 0, 88, 0.85) 55%, rgba(99, 31, 72, 0.885) 77.5%, rgba(5, 59, 57, 0.92) 100%)",
            }}
          >
            <h2 className="text-[26px] font-extrabold leading-[1.15] text-white">
              A community
              <br />
              with heart.
            </h2>

            <span
              aria-hidden="true"
              className="hidden h-[40px] w-px bg-white/35 sm:inline-block"
            />

            <p className="max-w-[240px] text-[13px] leading-[1.35] text-white/94">
              Celebrating animals, music and the positive impact they have on
              people and communities.
            </p>

            <button
              type="button"
              onClick={() => {
                setShareSubmitted(false);
                setShareModalOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-white bg-white/14 px-[18px] py-[9px] text-[13px] font-bold text-white transition hover:bg-white/25"
            >
              <span>Get involved</span>
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="flex flex-col justify-center bg-white px-5 py-[18px]">
            <h3 className="text-[16.5px] font-extrabold leading-tight text-[#053b39]">
              Explore Zoiko Mobile plans
            </h3>
            <p className="mt-1 text-[12px] text-[#475569]">
              Flexible, great-value plans designed around you.
            </p>
            <Link
              href="/plans"
              className="mt-2 inline-block text-[13px] font-extrabold text-[#c90058] hover:underline"
            >
              View our plans ›
            </Link>
          </div>
        </section>
      </main>

      {/* Modal: YouTube Video Player */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          onClick={() => setVideoModal(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
              <div>
                <h3 className="text-[17px] font-extrabold text-[#0f172a]">
                  {videoModal.title}
                </h3>
                <p className="text-[12.5px] text-[#475569]">
                  {videoModal.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVideoModal(null)}
                aria-label="Close video player"
                className="cursor-pointer rounded-full p-1.5 text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${videoModal.youtubeId}?autoplay=1`}
                title={videoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Spotify Track Player */}
      {spotifyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          onClick={() => setSpotifyModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                  {spotifyModal.title}
                </h3>
                <p className="text-[12.5px] text-[#475569]">
                  {spotifyModal.description} ({spotifyModal.tracksLabel})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSpotifyModal(null)}
                aria-label="Close audio player"
                className="cursor-pointer rounded-full p-1.5 text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <iframe
                className="w-full rounded-xl"
                style={{ border: 0 }}
                src={`https://open.spotify.com/embed/track/${spotifyModal.spotifyTrackId}?utm_source=generator`}
                height={152}
                title={spotifyModal.title}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Story / Guide / News Reader */}
      {readingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setReadingModal(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {readingModal.image && (
              <img
                src={readingModal.image}
                alt={readingModal.title}
                className="h-52 w-full object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#c90058]">
                    {readingModal.meta}
                  </span>
                  <h3 className="mt-1 text-[20px] font-extrabold text-[#0f172a]">
                    {readingModal.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReadingModal(null)}
                  aria-label="Close reader"
                  className="cursor-pointer rounded-full p-1 text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#334155]">
                {readingModal.body}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Creator Spotlight */}
      {creatorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setCreatorModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={creatorModal.image}
                  alt={creatorModal.name}
                  className="h-14 w-14 rounded-full border-2 border-[#ffe4ed] object-cover"
                />
                <div>
                  <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                    {creatorModal.name}
                  </h3>
                  <p className="text-[12.5px] font-bold text-[#c90058]">
                    {creatorModal.specialty}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatorModal(null)}
                aria-label="Close creator modal"
                className="cursor-pointer rounded-full p-1 text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-[#334155]">
              {creatorModal.bio}
            </p>
          </div>
        </div>
      )}

      {/* Modal: Share Your Moment Community Form */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[18px] font-extrabold text-[#0f172a]">
                Share Your Moment
              </h3>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close upload modal"
                className="cursor-pointer rounded-full p-1 text-[#64748b] hover:bg-[#f1f5f9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {shareSubmitted ? (
              <div className="mt-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-[13px] text-[#15803d]">
                <p className="font-extrabold">Thank you for sharing!</p>
                <p className="mt-1">
                  Your Animals &amp; Music moment has been received by our
                  community team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleShareSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a]">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    value={shareName}
                    onChange={(e) => setShareName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="mt-1 w-full rounded-[10px] border border-[#cbd5e1] px-3 py-2 text-[13px] outline-none focus:border-[#c90058]"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a]">
                    Moment title
                  </label>
                  <input
                    type="text"
                    required
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                    placeholder="Morning walk soundtrack"
                    className="mt-1 w-full rounded-[10px] border border-[#cbd5e1] px-3 py-2 text-[13px] outline-none focus:border-[#c90058]"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a]">
                    Tell us about it
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    placeholder="Share a quick story or video link..."
                    className="mt-1 w-full rounded-[10px] border border-[#cbd5e1] px-3 py-2 text-[13px] outline-none focus:border-[#c90058]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-full bg-[#c90058] py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#a90049]"
                >
                  Submit moment ›
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
