import Image from "next/image";
import Link from "next/link";

// ─── MEDIA HELPERS ─────────────────────────────────────────────────────────
//
// `video` / `track` fields accept EITHER a full URL or a bare ID:
//   YouTube:  "https://www.youtube.com/watch?v=ABC123"  |  "https://youtu.be/ABC123"  |  "ABC123"
//   Spotify:  "https://open.spotify.com/track/XYZ?si=.." |  "XYZ"
// Leave them as "" to show a placeholder until you paste the real link.

function ytId(input: string): string {
  if (!input) return "";
  if (!/[/.]/.test(input)) return input; // already a bare id
  const m = input.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : input;
}

function spotifyId(input: string): string {
  if (!input) return "";
  if (!/[/.]/.test(input)) return input;
  const m = input.match(/track\/([A-Za-z0-9]+)/);
  return m ? m[1] : input;
}

function YouTube({ video, title }: { video: string; title: string }) {
  const id = ytId(video);
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
      {id ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-gray-300">
          Add a YouTube link for &ldquo;{title}&rdquo;
        </div>
      )}
    </div>
  );
}

function Spotify({ track, title }: { track: string; title: string }) {
  const id = spotifyId(track);
  return id ? (
    <iframe
      className="w-full rounded-lg"
      style={{ border: 0 }}
      src={`https://open.spotify.com/embed/track/${id}?utm_source=generator`}
      height={152}
      loading="lazy"
      title={title}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    />
  ) : (
    <div className="flex h-[152px] items-center justify-center rounded-lg bg-gray-100 px-3 text-center text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-300">
      Add a Spotify track link for &ldquo;{title}&rdquo;
    </div>
  );
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const adorable = [
  { video: "https://www.youtube.com/watch?v=C5jS1gNWcAA&t=37s", title: "Puppies Playing", desc: "Watch adorable puppies create music with their playful antics" },
  { video: "https://www.youtube.com/watch?v=obNvRR2pux8", title: "Cats & Classical", desc: "Feline friends enjoying classical melodies" },
  { video: "https://www.youtube.com/watch?v=8rSH8-pbHZ0", title: "Birds Singing Along", desc: "Melodic birds creating natural harmonies" },
];

const harmonyVideo = "https://www.youtube.com/watch?v=iucW5evsuLE&t=5s"; 

const special = [
  { video: "https://www.youtube.com/watch?v=flUk-CDzV38", title: "Arctic Adventures", desc: "Polar bears playing in the snow with ambient music" },
  { video: "https://www.youtube.com/watch?v=QpkByzZpUbw", title: "Safari Sounds", desc: "African wildlife with natural soundscapes" },
  { video: "https://www.youtube.com/watch?v=B8FWGSjcgaI", title: "Rescue Stories", desc: "Heartwarming animal rescue and adoption tales" },
];

const tunes = [
  { track: "https://open.spotify.com/track/49fOxBc8o4a9cNwvglo1zN?go=1&sp_cid=159920746837894a9d8595f457c112fc&intent=1&nd=1&dlsi=e44137b6b8fc4efa", title: "Crying Wolf", subtitle: "Wildlife Sounds" },
  { track: "https://open.spotify.com/track/74GeIYnKynMtgqOV1BzjfL?go=1&sp_cid=159920746837894a9d8595f457c112fc&intent=1&nd=1&dlsi=a7e063cf0fe744a7", title: "Roars", subtitle: "Big Cat Symphony" },
  { track: "https://open.spotify.com/track/4EA5ge8hgE6OySXrVqrjxn?go=1&sp_cid=159920746837894a9d8595f457c112fc&intent=1&nd=1&dlsi=88b128ce3e6e4f61", title: "Cat Me", subtitle: "Feline Melodies" },
  { track: "https://open.spotify.com/track/6QvzZe7cI3MShQDorCavxA?go=1&sp_cid=159920746837894a9d8595f457c112fc&intent=1&nd=1&dlsi=02617f3c41bc4faa", title: "Rouva", subtitle: "Canine Chorus" },
];

const artists = [
  { img: "/images/animal/image 278.png", name: "Peter Graham", role: "Parrot Vocals" },
  { img: "/images/animal/image 279 (1).png", name: "Doug Carroll", role: "Canine Beats" },
  { img: "/images/animal/image 280 (1).png", name: "Jean C Sophie", role: "Ocean Sounds" },
  { img: "/images/animal/image 281 (1).png", name: "Hayley Hoffman", role: "Small Pet Symphony" },
  { img: "/images/animal/image 282 (1).png", name: "Sound Effects Library", role: "Nature Collection" },
  { img: "/images/animal/image 283 (1).png", name: "Dog Soothing", role: "Relaxation Tunes" },
];

const news = [
  { img: "/images/animal/Background.png", title: "New effects of music on animals", excerpt: "Latest studies show how different genres affect animal behavior and wellbeing...", date: "March 15, 2025", read: "3 min read" },
  { img: "/images/animal/image 284.png", title: "The Ways Animals React When We Play Music", excerpt: "Exploring the fascinating responses of different species to musical stimulation...", date: "March 12, 2025", read: "5 min read" },
  { img: "/images/animal/image 286.png", title: "Cockatiels found to dance with music", excerpt: "Recent research reveals how cockatiels naturally synchronize their movements to beats...", date: "March 10, 2025", read: "4 min read" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="font-extrabold text-[#0e8f74] text-[clamp(1.4rem,3.5vw,2rem)] dark:text-[#34d39e]">{title}</h2>
      <span className="mx-auto mt-2 block h-1 w-16 rounded-full bg-[#f5c518]" />
      {sub && <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

function AnimalsAndMusic() {
  return (
    <main className="bg-white font-sans dark:bg-gray-900">
      {/* ─── Announcement bar ─── */}
      <div className="bg-gradient-to-r from-[#17a06a] to-[#0e8f74] px-4 py-3 text-center text-sm font-semibold text-white">
        Welcome to the Animals &amp; Music Channel!
      </div>

  
{/* ─── Hero banner ─── */}
<section className="relative isolate flex min-h-[480px] items-start justify-center overflow-hidden bg-gradient-to-r from-[#e6007e] to-[#c4007a] px-4 pt-16 pb-40 text-center text-white sm:min-h-[560px] sm:px-6 sm:pt-20">
  {/* Animal collage — background layer */}
  <Image
    src="/images/animal/envato-labs-image-edit (10) (1).png"
    alt=""
    fill
    priority
    sizes="100vw"
    className="-z-10 object-cover object-bottom"
  />

  {/* Content on top */}
  <div className="relative max-w-3xl">
    <h1 className="font-extrabold text-[clamp(1.6rem,4vw,2.5rem)]">
      Where Your Love For Animals Meets The Rhythm Of Music
    </h1>
    <p className="mt-2 text-sm text-white/90">Discover The Unique Bond Between Animals And Music</p>

    <Link href="/plans" className="mt-7 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#e6007e] shadow-md transition-opacity hover:opacity-90">
      View All Plans
    </Link>
  </div>
</section>

      {/* ─── Adorable Animal Moments ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <Heading title="Adorable Animal Moments" sub="Heartwarming Videos Of Animals Doing What They Do Best - Being Cute, Playful, And Full Of Life" />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {adorable.map((v) => (
              <div key={v.title} className="overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <YouTube video={v.video} title={v.title} />
                <div className="p-2 pt-4">
                  <h3 className="font-bold text-gray-800 dark:text-white">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Animals In Harmony ─── */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-extrabold text-[#0e8f74] text-[clamp(1.4rem,3.5vw,2rem)] dark:text-[#34d39e]">Animals In Harmony</h2>
            <span className="mt-2 block h-1 w-16 rounded-full bg-[#f5c518]" />
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Discover Videos Featuring Animals That Sing, Dance, And Connect To The Beat. From Parrots That Talk To
              Dogs That Dance, From Birds That Whistle To Cats That Purr.
            </p>
            <Link href="" className="mt-6 inline-block rounded-full border border-[#0e8f74] px-6 py-2.5 text-sm font-semibold text-[#0e8f74] transition-colors hover:bg-[#0e8f74] hover:text-white dark:border-[#34d39e] dark:text-[#34d39e]">
              Explore Our Pets
            </Link>
          </div>
          <YouTube video={harmonyVideo} title="Animals in Harmony" />
        </div>
      </section>

      {/* ─── Special Moments Shared ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <Heading title="Special Moments Shared" sub="From Teaching And Fun Videos Of Animals And Their Owners Sharing Special Moments Together, To Rescue Stories And Adoption." />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {special.map((v) => (
              <div key={v.title} className="overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <YouTube video={v.video} title={v.title} />
                <div className="p-2 pt-4">
                  <h3 className="font-bold text-gray-800 dark:text-white">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tunes with a Tail (Spotify) ─── */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <Heading title="Tunes with a Tail" sub="Explore a curated collection of songs and music videos that highlight animals. Whether it's a dog barking in rhythm or a cat playing the piano, these tunes are sure to make you smile and brighten your day." />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {tunes.map((t) => (
              <div key={t.title} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white">{t.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.subtitle}</p>
                <div className="mt-3">
                  <Spotify track={t.track} title={t.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Popular Artists ─── */}
      <section className="bg-white px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <Heading title="Popular Artists" />
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {artists.map((a) => (
              <div key={a.name} className="flex flex-col items-center rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                  <Image src={a.img} alt={a.name} fill sizes="64px" className="object-cover" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-800 dark:text-white">{a.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{a.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Animal & Music News ─── */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 md:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          <Heading title="Animal & Music News" sub="Stay up-to-date with the latest animal content and music from trending animal videos to heartwarming stories, we bring you the best of both worlds." />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
              <article key={n.title} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="relative aspect-[16/10] bg-gray-300 dark:bg-gray-700">
                  <Image src={n.img} alt={n.title} fill sizes="(max-width:1024px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 dark:text-white">{n.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{n.excerpt}</p>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{n.date} &bull; {n.read}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// Exported both ways so either default or named import works.
export default AnimalsAndMusic;
export { AnimalsAndMusic };