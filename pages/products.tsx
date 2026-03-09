import { useEffect, useState } from "react";

export default function ProductsPage() {
  const [prices, setPrices] = useState<any[]>([]);

  useEffect(() => {
    async function loadPrices() {
      const res = await fetch("/api/stripe/webhook/prices");
      const data = await res.json();
      setPrices(data);
    }
    loadPrices();
  }, []);

  return (
    <div>
      <h1>Produkte</h1>

      {prices.length === 0 && <p>Lade…</p>}

      <ul>
        {prices.map((price) => (
          <li key={price.id}>
            <strong>{price.product.name}</strong><br />
            {(price.unit_amount / 100).toFixed(2)} €
          </li>
        ))}
      </ul>
    </div>
  );
}
