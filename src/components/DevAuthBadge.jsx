// src/components/DevAuthBadge.jsx
import { useAuth } from "./context/AuthContext";

export default function DevAuthBadge() {
  const { user, profile, loading } = useAuth();
  return (
    <div className="fixed bottom-3 right-3 z-50 text-xs px-2 py-1 rounded bg-black/80 text-white">
      {loading ? "loading..." :
        user ? `uid:${user.uid.slice(0,6)} role:${profile?.role || "-"}` : "guest"}
    </div>
  );
}
