const SOURCE_URL = 'https://github.com/ttebify/smart-fan';

export function Credit() {
  return (
    <p className="credit">
      Built with React + three.js
      {SOURCE_URL && <> · <a href={SOURCE_URL} target="_blank" rel="noreferrer">source</a></>}
    </p>
  );
}
