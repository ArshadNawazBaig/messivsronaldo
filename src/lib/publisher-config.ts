type Environment = Record<string, string | undefined>;
export function publisherConfiguration(env: Environment) {
  const publisherId = env.ADSENSE_PUBLISHER_ID?.trim().replace(/^ca-/, "");
  const adsensePublisherId = publisherId && /^pub-\d{16}$/.test(publisherId) ? publisherId : undefined;
  const editorName = env.EDITOR_NAME?.trim();
  const editorBiography = env.EDITOR_BIO?.trim();
  let editorProfileUrl: string | undefined;
  try {
    const url = new URL(env.EDITOR_PROFILE_URL ?? "");
    if (url.protocol === "https:" && !url.username && !url.password) editorProfileUrl = url.href;
  } catch { /* An optional profile is omitted unless it is a valid public URL. */ }
  return {
    adsensePublisherId,
    // Analytics is optional and never included on the admin document.
    analyticsEnabled: env.VERCEL === "1" && env.WEB_ANALYTICS_ENABLED !== "false",
    contactEmail: env.CONTACT_EMAIL?.trim().match(/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/)?.[0],
    editor: editorName && editorBiography ? { name: editorName, biography: editorBiography, profileUrl: editorProfileUrl } : undefined,
  };
}
