export const policyUpdated = "2026-09-25";
export const policyUpdatedLabel = "25 September 2026";

type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  links?: { href: string; label: string }[];
};
export type Policy = {
  title: string;
  heading: string;
  eyebrow: string;
  description: string;
  sections: PolicySection[];
};

export const policies: Record<string, Policy> = {
  terms: {
    title: "Terms of Use", heading: "Terms of use.", eyebrow: "USING THE RIVALRY",
    description: "The terms for using our comparisons and articles on messivsronaldo17.com.",
    sections: [
      { id: "about-these-terms", title: "About these terms", paragraphs: ["These terms apply to The Rivalry at messivsronaldo17.com. By using the website, you agree to these terms. If you do not agree, please stop using the website. The Rivalry is an independent football publication; it is not an official service of either player, any club or any football governing body."] },
      { id: "using-the-content", title: "Using the content", paragraphs: ["You may browse our pages and share links. When quoting our original analysis, identify The Rivalry and link to the relevant page so readers can check the context and cutoff date.", "This permission does not license third-party photographs, trademarks or provider datasets. Their rights remain with their respective owners. Do not republish photographs or substantial portions of protected content without the necessary permission. Nothing here restricts uses permitted by applicable law."], links: [{ href: "/credits", label: "Photography and credits" }] },
      { id: "fair-use-of-the-site", title: "Use the website responsibly", paragraphs: ["Do not attempt to access private admin areas without authorization, bypass security controls, introduce malicious code or deliberately overload the service. Do not misrepresent altered content as an unchanged publication from The Rivalry.", "Please send accurate, relevant information when reporting a correction. Do not include passwords, API keys or personal information that is unnecessary to explain the issue."] },
      { id: "statistics-and-availability", title: "Statistics and availability", paragraphs: ["Statistics depend on match coverage, provider definitions and the publication cutoff shown on each page. Totals may change after a match update or correction. A comparison is not a complete assessment of a player, and a missing figure is not necessarily zero.", "We aim to publish accurate, useful information, but do not promise that every figure will be complete, current or error-free, or that the website will always be available. Check the scope and methodology before relying on a figure."], links: [{ href: "/methodology", label: "Read the counting rules" }, { href: "/updates", label: "Published updates" }] },
      { id: "links-and-responsibility", title: "Links and responsibility", paragraphs: ["External links lead to independently operated websites. Their content and terms are their responsibility. Linking to a source does not imply an endorsement or partnership.", "To the extent permitted by applicable law, The Rivalry is not responsible for loss resulting from reliance on website content or an interruption of service. These terms do not exclude liability or rights that cannot lawfully be excluded."] },
      { id: "changes-and-questions", title: "Changes and questions", paragraphs: ["We may revise these terms as the website changes. The date on this page identifies the current version. Questions about the website, permissions or these terms can be raised using the contact information published on our Contact page."], links: [{ href: "/contact", label: "Contact and corrections" }, { href: "/privacy", label: "Privacy policy" }] },
    ],
  },
  privacy: {
    title: "Privacy Policy", heading: "Privacy policy.", eyebrow: "YOUR PRIVACY",
    description: "What The Rivalry stores, why it is used, and the choices available to visitors.",
    sections: [
      { id: "visiting", title: "Visiting the website", paragraphs: ["The Rivalry publishes football comparisons at messivsronaldo17.com. Public visitors do not need an account. This edition does not run advertising, third-party analytics, newsletter subscriptions or payment collection.", "Our hosting provider, Vercel, receives technical request information needed to deliver and protect the website, which may include an IP address, browser details, requested URL and time of access. Hosting logs are handled according to the provider’s settings and retention practices."] },
      { id: "browser-storage", title: "Preferences and browser storage", paragraphs: ["Your light or dark theme choice is saved in your browser as rivalry-theme. It stays there until you change it, clear site data or your browser removes it. Comparison filters are stored in the URL fragment so that a comparison can be restored or shared.", "On unprefixed pages, we use your browser’s preferred supported language, falling back to English. A link with a language prefix keeps that language. Choosing a language in the menu saves only its language code in the rivalry-locale preference cookie for up to one year. The cookie uses SameSite=Lax and Secure on HTTPS. Clearing it restores automatic browser-language detection.", "Site search matches page titles locally in your browser. We do not send the search text to a search provider. Fonts and player photographs are served with the website; there are no Getty image embeds in this edition."], links: [{ href: "/cookies", label: "Cookies and local storage" }] },
      { id: "contact-and-corrections", title: "Contact and correction reports", paragraphs: ["Correction reports are prepared and displayed in your browser. Preparing a report does not submit it to a server. When an email contact is available and you choose to send a message, your email provider handles delivery.", "A message you send may include your email address, the issue you describe and any details you choose to provide. Those details are used to respond to the request and investigate the issue. Avoid including sensitive information or details about other people that are not needed."], links: [{ href: "/contact", label: "Contact and corrections" }] },
      { id: "administration", title: "Administration and retention", paragraphs: ["Administrator sign-in uses an essential HTTP-only session cookie, rivalry-admin, with an eight-hour lifetime. Server-side session records support authentication. Provider credentials are encrypted on the server and are not returned to public visitors.", "Match records and administrative activity are stored in our database so corrections can be reviewed and publication history can be recovered. These records are retained for the archive’s operation and integrity. An administrator’s session expiry is separate from the retention of audit records and backups."] },
      { id: "your-choices", title: "Your choices and questions", paragraphs: ["You can remove saved preferences through your browser’s site-data controls. Removing the admin cookie signs that browser out. Blocking storage may prevent preferences or administrator sign-in from working, but public comparisons do not require a visitor account.", "Depending on the laws that apply to you, you may have rights to request access, correction or deletion of personal information, or to object to some uses. Use the contact details published on our Contact page for privacy questions. You may also raise a concern with the relevant data protection authority."], links: [{ href: "/contact", label: "Contact information" }] },
      { id: "external-services-and-changes", title: "External websites and changes", paragraphs: ["Links to football sources and photography credits take you to other websites with their own privacy practices. This policy describes the current website; it will need updating if we introduce advertising, analytics or other services that change how information is processed."] },
    ],
  },
  cookies: {
    title: "Cookie Policy", heading: "Cookies & local storage.", eyebrow: "BROWSER PREFERENCES",
    description: "A short inventory of the storage used by this edition of the website.",
    sections: [
      { id: "theme-preference", title: "Your theme preference", paragraphs: ["The rivalry-theme local-storage entry remembers whether you chose the light or dark theme. Local storage is different from a cookie: this preference stays in your browser and is not automatically attached to every request. It has no fixed expiry and can be removed through your browser’s site-data settings."] },
      { id: "language-preference", title: "Your language preference", paragraphs: ["On unprefixed pages, we use your browser’s preferred supported language, falling back to English. A link with a language prefix keeps that language. Choosing a language in the menu saves only its language code in the rivalry-locale preference cookie for up to one year. The cookie uses SameSite=Lax and Secure on HTTPS. Clearing it restores automatic browser-language detection."] },
      { id: "admin-session", title: "Administrator session", paragraphs: ["The rivalry-admin cookie is used only for administrator sign-in. It identifies an authenticated session and expires after eight hours. It is HTTP-only, uses SameSite=Strict, and is marked Secure on the HTTPS production website. It is not an advertising or visitor-tracking cookie."] },
      { id: "other-features", title: "Search, filters and third parties", paragraphs: ["Search runs locally. Comparison filters can appear after the # symbol in a shared URL; those fragments are not sent as part of an HTTP request to the server. Preparing a correction report does not create a tracking cookie.", "This edition does not set advertising or analytics cookies and does not load third-party photo embeds. External websites may use their own cookies after you follow a link to them."] },
      { id: "manage-storage", title: "Managing stored preferences", paragraphs: ["Use your browser’s settings to inspect or remove site data for messivsronaldo17.com. Clearing local storage resets your theme preference. Clearing the admin session cookie signs you out if you are an administrator. If the site introduces additional storage technologies, this inventory will be updated."], links: [{ href: "/privacy", label: "Read the privacy policy" }] },
    ],
  },
  disclaimer: {
    title: "Editorial & Data Disclaimer", heading: "Context matters.", eyebrow: "EDITORIAL & DATA DISCLAIMER",
    description: "How to interpret our figures, photography and relationship to the people in the comparison.",
    sections: [
      { id: "independent-publication", title: "An independent publication", paragraphs: ["The Rivalry is not affiliated with, endorsed by or operated by Lionel Messi, Cristiano Ronaldo, their clubs, national associations, UEFA or FIFA. Names, photographs and competition references identify the subjects being discussed. They do not imply an official relationship."] },
      { id: "coverage-and-cutoffs", title: "Coverage and cutoff dates", paragraphs: ["A statistic is meaningful within its stated competition, date range and counting rules. The website combines a reviewed baseline with published match updates. Some detailed categories have a different cutoff when current provider data is unavailable. The website is not a guaranteed real-time match feed.", "Definitions can differ between providers, especially for assists, appearances and team honours. Overlapping categories should not be added together. Figures and calculations may be corrected as better evidence becomes available."], links: [{ href: "/methodology", label: "Sources and methodology" }, { href: "/updates", label: "Public update log" }] },
      { id: "comparison-and-opinion", title: "Comparison and opinion", paragraphs: ["A star identifies the leader in a particular statistic according to the displayed rules. It is not a judgment of who is the better player overall. Articles provide interpretation and context; readers may reasonably reach different conclusions."] },
      { id: "photographs-and-corrections", title: "Photography and corrections", paragraphs: ["Photographs and third-party material remain the property of their respective rights holders. Credit does not grant visitors permission to reuse those materials. Please use the contact information on the website for a rights concern or a proposed correction."], links: [{ href: "/credits", label: "Photography credits" }, { href: "/contact", label: "Contact and corrections" }] },
    ],
  },
  accessibility: {
    title: "Accessibility Statement", heading: "Football for everyone.", eyebrow: "ACCESSIBILITY",
    description: "How we support accessible browsing, and how to describe a problem when something gets in the way.",
    sections: [
      { id: "our-approach", title: "Our approach", paragraphs: ["We aim to make The Rivalry usable with a keyboard, screen reader and browser zoom, on both large and small screens. Accessibility is an ongoing part of development. This statement is not a claim of independent certification or complete conformance."] },
      { id: "browsing-tools", title: "Tools available on the website", paragraphs: ["A Skip to content link appears when you navigate with the keyboard. Main menus and custom selectors support keyboard interaction. The header includes a light and dark theme switch, and comparison values are provided as text in addition to visual bars.", "Player photographs include text alternatives. Comparison controls have accessible labels, and table headings identify the data. Charts with a data disclosure offer a text-based way to inspect the underlying figures."] },
      { id: "known-limitations", title: "Limitations and testing", paragraphs: ["Dense comparison tables may need horizontal scrolling on small screens. Third-party websites linked as sources have their own interfaces, which we do not control. Automated checks help us find common problems, but do not replace testing by people using assistive technology."] },
      { id: "report-a-barrier", title: "Report an access problem", paragraphs: ["Use the contact information on our Contact page to describe a barrier. Include the page URL, what you were trying to do, the device and browser, and any assistive technology involved. Please leave out private account details. If a contact email is not displayed, the current correction tool can prepare a local report but cannot send it to us."], links: [{ href: "/contact", label: "Contact information" }, { href: "/sitemap", label: "Browse the site map" }] },
    ],
  },
};
