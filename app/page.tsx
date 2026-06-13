export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center space-y-4">
        <h1
          className="text-6xl font-black tracking-tight"
          style={{ color: "#F5A623", fontFamily: "Heebo, sans-serif" }}
        >
          Mango Realty
        </h1>
        <p
          className="text-xl"
          style={{ color: "#FFF8F0", fontFamily: "Assistant, sans-serif" }}
        >
          נדל&quot;ן יוקרה באזורי הביקוש
        </p>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          האתר בבנייה — בקרוב
        </p>
      </div>
    </main>
  );
}
