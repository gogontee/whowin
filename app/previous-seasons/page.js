// app/previous-seasons/page.js
import Catalogue from "../../components/Catalogue";

export const metadata = {
  title: "Previous Seasons · Who Wins",
  description:
    "Browse previous seasons — photos and videos from Who Wins.",
};

export default function PreviousSeasons() {
  return (
    <>

      <main className="min-h-screen bg-black text-white px-4 pt-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Previous Seasons
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Contents from our past seasons.
            </p>
          </header>

          <Catalogue />
        </div>
      </main>
    </>
  );
}