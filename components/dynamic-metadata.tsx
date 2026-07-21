"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  authenticatedMetadata,
  guestMetadata,
} from "@/lib/site-metadata";

function setMetaTag(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function applyMetadata(isAuthenticated: boolean) {
  const meta = isAuthenticated ? authenticatedMetadata : guestMetadata;
  const title =
    typeof meta.title === "string" ? meta.title : "Silentra Barbershop";
  const description = meta.description ?? "";

  document.title = title;
  setMetaTag('meta[name="description"]', "name", "description", description);

  const ogTitle =
    typeof meta.openGraph?.title === "string"
      ? meta.openGraph.title
      : title;
  const ogDescription = meta.openGraph?.description ?? description;

  setMetaTag('meta[property="og:title"]', "property", "og:title", ogTitle);
  setMetaTag(
    'meta[property="og:description"]',
    "property",
    "og:description",
    ogDescription,
  );

  const twitterTitle =
    typeof meta.twitter?.title === "string" ? meta.twitter.title : title;
  const twitterDescription = meta.twitter?.description ?? description;

  setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", twitterTitle);
  setMetaTag(
    'meta[name="twitter:description"]',
    "name",
    "twitter:description",
    twitterDescription,
  );
}

export function DynamicMetadata() {
  useEffect(() => {
    const supabase = createClient();

    const syncFromSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      applyMetadata(Boolean(session?.user));
    };

    syncFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((
      _event: AuthChangeEvent,
      session: Session | null,
    ) => {
      applyMetadata(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
