// Set this to the public repository once it exists; the link is hidden while it is empty.
const SOURCE_URL = '';

export function Credit() {
  return (
    <p className="credit">
      Built with React + three.js
      {SOURCE_URL && <> · <a href={SOURCE_URL} target="_blank" rel="noreferrer">source</a></>}
    </p>
  );
}
