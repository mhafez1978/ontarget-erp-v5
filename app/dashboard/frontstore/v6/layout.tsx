import "./styles.css";

export const metadata = {
  title: "Frontstore V6 — Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="frontstore-v6-root">
      <header className="v6-header">Frontstore V6 — Draft</header>
      <main className="v6-main">{children}</main>
    </div>
  );
}
