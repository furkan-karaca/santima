// Motion for Santima. One grammar: exponential ease-out from states the CSS
// already holds, scroll-scrubbed where the page measures, never bouncy.
// Everything is visible without this script; reduced motion gets a still page.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { refreshPublished } from "./live-data";

declare global {
  interface Window {
    __motionReady?: boolean;
  }
}

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const EASE = "expo.out";
const INK = "#0d1b2a";
const ACCENT = "#415a77";
const HAZE = "#6b7c92";

const $ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  scope.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));

window.__motionReady = true;

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const plain = document.body.classList.contains("is-plain");
const header = $("[data-header]");

/* Header: transparent over the hero, solid after it, tucked away while reading down. */
function initHeader(lenis?: Lenis) {
  if (!header) return;
  const hero = $("[data-hero]");
  let lastY = window.scrollY;

  // Turn solid just before the hero's copy reaches the header, so text never
  // slides under a transparent bar.
  let solidAt = 0;
  const measure = () => {
    const copy = $(".hero__copy");
    solidAt = copy ? copy.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 16 : 0;
  };
  measure();
  window.addEventListener("resize", measure, { passive: true });

  const update = (y: number) => {
    const threshold = hero ? Math.max(0, solidAt) : 0;
    header.classList.toggle("is-solid", plain || y > threshold);
    const goingDown = y > lastY;
    const menuOpen = root.classList.contains("menu-open");
    header.classList.toggle("is-hidden", !menuOpen && goingDown && y > window.innerHeight * 0.9);
    lastY = y;
  };

  if (lenis) lenis.on("scroll", ({ scroll }: { scroll: number }) => update(scroll));
  else window.addEventListener("scroll", () => update(window.scrollY), { passive: true });
  update(window.scrollY);
}

function initStill() {
  root.classList.remove("motion");
  initHeader();
  void refreshPublished();
}

function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // In-page anchors glide instead of jumping, clearing the fixed header.
  document.addEventListener("click", (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = $(id);
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: -(header?.offsetHeight ?? 0) + 1, duration: 1.6 });
    history.replaceState(null, "", id);
  });

  const menu = $<HTMLDialogElement>("[data-menu]");
  $("[data-menu-open]")?.addEventListener("click", () => lenis.stop());
  menu?.addEventListener("close", () => lenis.start());

  return lenis;
}

/* The first viewport: the photograph settles out of a clipped frame, the headline rises line by line. */
function introHero() {
  const media = $("[data-hero-media]");
  const photo = media?.querySelector<HTMLElement>(".hero__photo");
  const img = media?.querySelector<HTMLImageElement>("img");
  const title = $("[data-hero-title]");
  const fades = $$("[data-hero-fade]");
  const wordmark = $(".site-header .wordmark");
  if (!media || !title) return;

  const tl = gsap.timeline({ defaults: { ease: EASE } });
  tl.to(media, { clipPath: "inset(0% 0% 0% 0%)", duration: 2 }, 0);
  if (img) tl.fromTo(img, { scale: 1.24 }, { scale: 1, duration: 2.6 }, 0);
  if (wordmark) tl.from(wordmark, { letterSpacing: "0.7em", opacity: 0, duration: 1.8 }, 0.25);

  const split = SplitText.create(title, { type: "lines", mask: "lines" });
  gsap.set(title, { opacity: 1 });
  tl.from(split.lines, { yPercent: 110, duration: 1.5, stagger: 0.12, onComplete: () => split.revert() }, 0.55);
  tl.fromTo(fades, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.12 }, 1.05);

  // Once settled, the photograph drifts slower than the page.
  if (photo) {
    gsap.to(photo, {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: "[data-hero]", start: "top top", end: "bottom top", scrub: true },
    });
  }
}

/* The statement inks itself in as it is read; «вашу» ends in the accent. */
function inkStatement() {
  $$("[data-ink]").forEach((el) => {
    const split = SplitText.create(el, { type: "words" });
    gsap.fromTo(
      split.words,
      { color: HAZE },
      {
        color: (_i: number, word: Element) => (word.closest("em") ? ACCENT : INK),
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 42%", scrub: true },
      },
    );
  });
}

/* Quiet reveals for body copy and controls. */
function reveals() {
  // Visible from the start; entering only settles the last few pixels.
  ScrollTrigger.batch("[data-reveal]", {
    start: "top 92%",
    once: true,
    onEnter: (batch) => gsap.from(batch, { y: 18, duration: 1.2, ease: EASE, stagger: 0.08 }),
  });
}

/* The signature: a centimetre tape runs under a fixed needle as the steps pass. */
function measureProcess(mm: gsap.MatchMedia) {
  const section = $("[data-process]");
  const track = $("[data-process-track]");
  const tape = $("[data-tape]");
  const readout = $("[data-cm]");
  if (!section || !track || !tape || !readout) return;

  const ticks = tape.children;
  const tickWidth = () => (ticks.length > 1 ? (ticks[1] as HTMLElement).offsetLeft - (ticks[0] as HTMLElement).offsetLeft : 24);
  const totalCm = ticks.length - 1;
  const tapeShift = () => -(tickWidth() * totalCm);
  const show = (p: number) => {
    readout.textContent = String(Math.round(p * totalCm));
  };

  mm.add("(min-width: 60rem)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance() + window.innerHeight * 0.25}`,
        pin: true,
        scrub: 0.9,
        invalidateOnRefresh: true,
        onUpdate: (self) => show(self.progress),
      },
    });
    tl.to(track, { x: () => -distance(), ease: "none" }, 0).to(tape, { x: tapeShift, ease: "none" }, 0);

    $$(".step", track).forEach((step) => {
      const photo = step.querySelector(".photo");
      if (!photo) return;
      gsap.fromTo(
        photo,
        { clipPath: "inset(12% 0% 12% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: step,
            containerAnimation: tl,
            start: "left 95%",
            end: "left 55%",
            scrub: true,
          },
        },
      );
    });
  });

  mm.add("(max-width: 59.99rem)", () => {
    gsap.to(tape, {
      x: tapeShift,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        end: "bottom 60%",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => show(self.progress),
      },
    });
    $$(".step .photo", track).forEach((photo) => {
      gsap.fromTo(
        photo,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: EASE, scrollTrigger: { trigger: photo, start: "top 88%", once: true } },
      );
    });
  });
}

/* Work photographs open from the bottom edge, then drift inside their frames. */
function gallery() {
  $$("[data-work-frame]:not([data-bound])").forEach((frame) => {
    frame.setAttribute("data-bound", "");
    gsap.to(frame, {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.7,
      ease: EASE,
      scrollTrigger: { trigger: frame, start: "top 88%", once: true },
    });
    const img = frame.querySelector("img");
    if (img) {
      gsap.fromTo(
        img,
        { yPercent: -6, scale: 1.14 },
        { yPercent: 6, scale: 1.14, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } },
      );
    }
  });

  $$("[data-parallax-frame]").forEach((frame) => {
    const img = frame.querySelector("img");
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -7, scale: 1.14 },
      { yPercent: 7, scale: 1.14, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } },
    );
  });
}

/* Slots fill in order: taken first, then the free ones in the accent. */
function slots() {
  const wrap = $("[data-slots]");
  if (!wrap) return;
  gsap.from($$("[data-slot]", wrap), {
    opacity: 0,
    scale: 0.6,
    duration: 0.9,
    ease: EASE,
    stagger: 0.035,
    scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
  });
}

/* The closing button leans toward the pointer. */
function magnetic() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  $$("[data-magnetic]").forEach((el) => {
    const toX = gsap.quickTo(el, "x", { duration: 0.7, ease: EASE });
    const toY = gsap.quickTo(el, "y", { duration: 0.7, ease: EASE });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      toX((e.clientX - (r.left + r.width / 2)) * 0.22);
      toY((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener("pointerleave", () => {
      toX(0);
      toY(0);
    });
  });
}

function initMotion() {
  const lenis = initSmoothScroll();
  initHeader(lenis);
  const mm = gsap.matchMedia();

  const start = () => {
    void refreshPublished();
    introHero();
    inkStatement();
    reveals();
    measureProcess(mm);
    gallery();
    slots();
    magnetic();
  };

  // Works and slots published from the CRM after this build replace the
  // built-in ones; new frames get the same reveal as the originals.
  document.addEventListener("santima:content", () => {
    gallery();
    ScrollTrigger.refresh();
  });

  // Split text only after the real faces are in, so line breaks are final;
  // never hold the first viewport hostage to a slow font.
  let started = false;
  const once = () => {
    if (started) return;
    started = true;
    start();
  };
  document.fonts.ready.then(once).catch(once);
  window.setTimeout(once, 1200);
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

try {
  if (reduce || plain) initStill();
  else initMotion();
} catch (error) {
  console.error(error);
  initStill();
}
