import { FullCoverConstructionView } from "@/components/under-construction";
import { getProfile } from "@/lib/content";

export default function Home() {
  const profile = getProfile();

  return (
    <main className="fullcover-page">
      <FullCoverConstructionView name={profile.name} />
    </main>
  );
}


