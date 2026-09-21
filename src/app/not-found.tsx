import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() { return <div className="page-container error-page"><span>404</span><h1>A little wide of the mark.</h1><p>That page isn’t in the lineup. Explore our sourced comparisons from the overview.</p><Link href="/" className="primary-button"><ArrowLeft size={16} />Back to the overview</Link></div>; }
