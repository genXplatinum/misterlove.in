import './Prose.css';

/**
 * Renders authored long-form HTML.
 *
 * The markup comes from src/data/writing/*.js, which is generated at build
 * time by scripts/import-writing.mjs from files in this repo — it is our own
 * static content, never user input or a network response, and the importer
 * strips scripts, inline styles and any class outside its allow-list. Prose.css
 * themes the resulting vocabulary.
 */
export default function Prose({ html, className = '', as: Tag = 'div' }) {
  return (
    <Tag
      className={`prose ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
