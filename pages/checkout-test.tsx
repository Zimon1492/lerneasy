import CheckoutButton from "../src/components/CheckoutButton";

//
//  Page zum Austesten der Component: CheckoutButton
//  

export default function CheckoutTestPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Checkout Test</h1>

      <p>Dies ist eine Testseite, um den Stripe Checkout (mode=setup) zu testen.</p>

      <CheckoutButton
        teacherId="4ca6f040-08e9-48c0-8a46-d3c4438684c6"
        studentName="Max Mustermann"
        studentEmail="max@example.com"
        start={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()}
        end={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()}
        priceCents={3000}
      />
    </div>
  );
}