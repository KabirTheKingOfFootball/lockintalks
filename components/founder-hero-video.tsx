"use client";

import Image from "next/image";
import { Mic2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function FounderHeroVideo() {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || videoFailed) {
      return;
    }

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    if (video.readyState >= 2) {
      tryPlay();
      return;
    }

    video.addEventListener("canplay", tryPlay, { once: true });

    return () => {
      video.removeEventListener("canplay", tryPlay);
    };
  }, [videoFailed]);

  return (
    <figure className="founder-video-card">
      <figcaption className="founder-video-label">
        <Mic2 size={14} aria-hidden="true" />
        <span>Meet The Founder</span>
      </figcaption>
      <div className="founder-video-frame">
        {videoFailed ? (
          <Image
            src="/lockintalks-advertisement-poster.png"
            alt="LockInTalks online speaking competitions poster with cash prizes and a student speaker"
            fill
            priority
            sizes="(min-width: 1024px) 560px, 92vw"
            className="founder-video-media"
          />
        ) : (
          <video
            ref={videoRef}
            className="founder-video-media"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/lockintalks-advertisement-poster.png"
            controls={false}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            onError={() => setVideoFailed(true)}
            aria-label="Kabir introducing LockInTalks"
          >
            <source src="/lockintalks-founder-video.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <p className="founder-video-copy">
        Built by Kabir, a 13-year-old state-level football player who created LockInTalks to help students build confidence through speaking competitions.
      </p>
    </figure>
  );
}
