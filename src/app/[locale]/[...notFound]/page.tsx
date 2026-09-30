import { notFound } from "next/navigation";

// Keep missing public URLs inside their language's document and recovery links.
export default function MissingPage() { notFound(); }
