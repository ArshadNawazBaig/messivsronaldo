"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="page-container error-page"><span>!</span><h1>A brief interruption.</h1><p>We couldn’t load this comparison. Try again in a moment.</p><button className="primary-button" onClick={reset}>Try again</button></div>; }
