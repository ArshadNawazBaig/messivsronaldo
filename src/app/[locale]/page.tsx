import { PageContext } from '@/components/page-context';
import { getI18n } from '@/lib/i18n/server';
import Link from '@/components/localized-link';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { ComparisonGuide } from '@/components/comparison-guide';
import { Comparison, ExploreCards } from '@/components/comparison';
import { AwardChart } from '@/components/award-chart';
import { EditorialCards } from '@/components/editorial';
import { CurrentHighlights } from '@/components/expanded-details';
import { getPublishedData } from '@/lib/server-data';
import { pageMetadata } from '@/lib/site';
import { RecordAnswers } from '@/components/record-answers';
import { buildRecordAnswers } from '@/lib/record-answers';
import { ToolCards } from '@/components/tool-cards';
import { getPublishedArticles } from '@/lib/blog/server';
import { homeTitle } from '@/lib/home-content';
import styles from './home.module.css';
export async function generateMetadata() {
  const { t } = await getI18n();
  const { snapshotLabel } = await getPublishedData();
  return pageMetadata(
    homeTitle,
    t(
      'Compare Messi vs Ronaldo career goals, assists, trophies and scoring rates. Explore club, World Cup and Champions League records. Data through {0}.',
      { 0: t(snapshotLabel) },
    ),
    '/',
  );
}
export default async function Home() {
  const { t, locale } = await getI18n();
  const hasPeakArticle = (await getPublishedArticles(locale)).some(article => article.slug === "messi-2012-vs-ronaldo-2013-goals");
  const data = await getPublishedData();
  return (
    <div className={`page-container home-page ${styles.home}`}>
      <PageContext
        path="/"
        title={t(homeTitle)}
        players={['messi', 'ronaldo']}
        mainEntityId="#comparison-dataset"
        breadcrumbs={[]}
      />
      <div className={styles.edition}>
        <span>{t('FOOTBALL / PLAYER COMPARISON')}</span>
        <Link href="/updates" className={styles.updated}>
          <span>{t('Last updated')} <time dateTime={data.lastUpdatedAt}>{t(data.lastUpdatedLabel)}</time></span>
        </Link>
      </div>
      <section className={`page-intro ${styles.intro}`} id="page-introduction">
        <div>
          <h1>
            {t('Messi ')}
            <span className="title-vs">{t('vs')}</span>
            {t(' Ronaldo')}
          </h1>
          <p>
            {t(
              'Career and competition records for Lionel Messi and Cristiano Ronaldo.',
            )}
          </p>
        </div>
        <Link className={styles.methodology} href="/methodology">
          {t('How we count ')}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </section>
      <Comparison homepage />
      <nav className="comparison-reading" aria-label={t('More comparisons')}>
        <Link href="/international">{t('International goals and assists')}</Link>
        <Link href="/penalties">{t('Penalty goals and conversion')}</Link>
        {hasPeakArticle && <Link href="/insights/messi-2012-vs-ronaldo-2013-goals">{t('Peak calendar years')}</Link>}
      </nav>
      <div className={styles.section} id="home-explore">
        <ExploreCards />
      </div>
      <div className={styles.section}>
        <div className="section-title-row">
          <h2>{t('2026 highlights')}</h2>
          <Link href="/2026" className="text-link">{t('2026 stats')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <CurrentHighlights />
      </div>
      <div className={styles.section} id="home-awards"><AwardChart /></div>
      <div className={styles.section} id="home-tools"><ToolCards compact /></div>
      <div className={styles.section} id="home-reading"><EditorialCards limit={3} /></div>
      <RecordAnswers answers={buildRecordAnswers(data, t)} compact />
      <ComparisonGuide />
      <section className={styles.trust}>
        <div>
          <span className="section-kicker">{t('ABOUT THE DATA')}</span>
          <h2>{t('Sources & methodology')}</h2>
          <p>
            {t(
              'Every statistic links to its source. Counting rules, coverage dates and corrections are public.',
            )}
          </p>
        </div>
        <div className={styles.trustLinks}>
          <Link href="/methodology">{t('Sources & methodology ')}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link href="/updates">{t('Public update log')}<ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
      <div className={styles.backToData}>
        <a href="#comparison">
          {t('Back to the comparison ')}
          <ArrowUp size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
