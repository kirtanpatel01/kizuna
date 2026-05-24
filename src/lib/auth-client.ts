import { createAuthClient } from "better-auth/react"
import { useState } from "react";

export const authClient = createAuthClient()

export const useGoogleSignIn = () => {
  const [ loading, setLoading ] = useState(false);
  const signIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
      });
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading };
}

export const googleSignIn = async () => {
  await authClient.signIn.social({
    provider: "google",
  });
};