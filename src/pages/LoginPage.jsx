import { useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { Flame, LockKeyhole, Sparkles, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Brand from "../components/ui/Brand";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LoginContent() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSuccess(credentialResponse) {
    setError("");

    const idToken = credentialResponse?.credential;

    if (!idToken) {
      setError("Google sign-in did not return an ID token. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        // Backend should set an HttpOnly session cookie.
        credentials: "include",
        body: JSON.stringify({ credential: idToken }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Google sign-in failed. Please try again.",
        );
      }
      localStorage.setItem("user", JSON.stringify(data));

      // Navigate only after the backend accepts the Google identity.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="p-5 sm:p-8">
        <Brand />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-12">
        <div className="mb-8 flex justify-center">
          <div className="relative grid size-36 place-items-center rounded-[2.5rem] bg-sage">
            <div className="grid size-24 place-items-center rounded-[2rem] bg-forest text-white shadow-xl shadow-green-950/15">
              <Sparkles size={45} strokeWidth={1.6} />
            </div>

            <span className="absolute -right-2 top-2 grid size-12 place-items-center rounded-2xl bg-gold text-[#4D3B16]">
              <Flame size={26} />
            </span>

            <span className="absolute -bottom-2 -left-2 grid size-10 place-items-center rounded-xl bg-peach text-[#7D5140]">
              <Star size={21} />
            </span>
          </div>
        </div>

        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#65806A]">
            Your daily language adventure
          </p>

          <h1 className="text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl">
            A little practice.
            <br />
            <span className="text-[#56805A]">A lot of progress.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-muted">
            Speak a little every day. Build confidence, grow your streak, and
            make every word count.
          </p>
        </div>

        <div className="flex min-h-12 w-full justify-center">
          {loading ? (
            <div
              className="flex items-center gap-3 text-sm font-semibold text-muted"
              role="status"
            >
              <span className="size-5 animate-spin rounded-full border-2 border-sage border-t-forest" />
              Signing you in...
            </div>
          ) : GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError(
                  "Google sign-in was cancelled or failed. Please try again.",
                );
              }}
              text="continue_with"
              shape="pill"
              theme="outline"
              size="large"
              width="320"
              useOneTap={false}
            />
          ) : (
            <p className="text-center text-sm text-red-700">
              Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in
              your frontend .env file.
            </p>
          )}
        </div>

        {/* {GOOGLE_CLIENT_ID && (
          <p className="mt-3 text-center text-xs leading-5 text-muted">
            If Google reports that this origin is not allowed, add{" "}
            <span className="font-semibold">{window.location.origin}</span>{" "}
            to the OAuth client's Authorized JavaScript origins in Google Cloud
            Console.
          </p>
        )} */}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-9 flex items-center justify-center gap-2 text-xs font-medium text-muted">
          <LockKeyhole size={14} />
          Your learning journey, your pace.
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  if (!GOOGLE_CLIENT_ID) {
    return <LoginContent />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginContent />
    </GoogleOAuthProvider>
  );
}
