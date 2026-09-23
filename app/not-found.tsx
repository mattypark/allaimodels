import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section shell page-top prose">
      <p className="eyebrow">404</p>
      <h1>That model isn&rsquo;t in the index.</h1>
      <p className="prose__lede">
        Either it was never here, or the URL changed. This field renames things
        constantly, so both are likely.
      </p>
      <p>
        Try the <Link href="/labs">labs</Link>, the{' '}
        <Link href="/timeline">release timeline</Link>, or{' '}
        <Link href="/compare">the comparison table</Link>. If a model really is missing,
        the weekly refresh may not have reached it yet — it opens a pull request rather
        than publishing unreviewed.
      </p>
    </section>
  );
}
