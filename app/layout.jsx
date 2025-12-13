import "./globals.css";

export const metadata = {
  title: "THE VOID",
  description: "ARDRA — AI Oracle with human soul.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg" />
        <div className="overlay" />
        {children}
      </body>
    </html>
  );
}
