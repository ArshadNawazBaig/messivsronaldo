import Image from "next/image";
import { playerPhotoLicense, playerPortraits } from "@/lib/player-artwork";

// Keep the legal attribution exact, including on translated editions.
export function PhotographyCredits() {
  return <div className="prose panel" lang="en">
    <p>The player photographs below are by <strong>{playerPhotoLicense.credit}</strong>, supplied through Wikimedia Commons under <a href={playerPhotoLicense.licenseUrl} rel="license">Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</a>. This license permits commercial use, including on an advertising-supported website, subject to its terms.</p>
    {Object.entries(playerPortraits).map(([id, photo]) => <section className="photo-credit" id={id} key={id}>
      <Image src={photo.src} width={photo.width} height={photo.height} sizes="150px" alt={photo.alt} />
      <div>
        <h2>{photo.name}</h2>
        <p>{photo.description} {photo.date}. Photograph © Bryan Berlin / WikiPortraits.</p>
        <p>{photo.sourceChanges}</p>
        <p>Background removed by The Rivalry. The transparent adaptation is also licensed under CC BY-SA 4.0.</p>
        <p><a href={photo.source}>Wikimedia source and license record</a> · <a href={photo.original}>Uncropped source photograph</a> · <a href={photo.download}>Exact source file used</a></p>
        <p><a href={playerPhotoLicense.licenseUrl} rel="license">CC BY-SA 4.0 license</a></p>
      </div>
    </section>)}
    <h2>Presentation and reuse</h2>
    <p>We retain the original cropped JPEG files alongside transparent versions with their backgrounds removed. Our website and exported artwork may resize, compress or crop their presentation, soften edges and add text or graphics. These presentation changes are by The Rivalry. The photo adaptations and generated posters and social preview artwork incorporating these photographs are available under CC BY-SA 4.0.</p>
    <p>You may share and adapt that artwork, including commercially, provided you retain the photographer and crop credits, link to the sources and license, identify your changes, and license your adaptations under CC BY-SA 4.0 or a compatible license. Retain the embedded credit when sharing a downloaded poster and include a link to this page for the full source record. Do not add restrictions that prevent others from exercising the licensed rights.</p>
    <p>This photo license does not license the website’s unrelated code or editorial content, grant rights to third-party datasets or trademarks, or imply that either player, their teams, the photographer or WikiPortraits endorses this website. Any applicable personality or trademark rights remain separate.</p>
    <h2>Icons and typography</h2>
    <p>Interface icons: Lucide (ISC license). Fonts: Inter and Roboto Condensed, distributed under the SIL Open Font License and hosted locally.</p>
    <p><a href="/images/players/licenses.json">Download the photo source and license record</a></p>
  </div>;
}
