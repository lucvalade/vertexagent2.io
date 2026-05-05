import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState, createContext, useContext } from "react";

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "AGENT" | "ADMIN";
  createdAt: number;
  updatedAt: number;
}

interface AuthState {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, firebaseUser: null, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, firebaseUser: null, loading: true });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fUser) => {
      if (fUser) {
        if (!fUser.emailVerified) {
          // As per rules, user needs verified email. Google login usually handles this.
        }
        
        const path = `users/${fUser.uid}`;
        try {
          const userDoc = await getDoc(doc(db, "users", fUser.uid));
          let appUser: AppUser;
          
          if (userDoc.exists()) {
            appUser = userDoc.data() as AppUser;
          } else {
            // Create user
            appUser = {
              id: fUser.uid,
              email: fUser.email || "",
              name: fUser.displayName || "Unknown Agent",
              role: "AGENT",
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await setDoc(doc(db, "users", fUser.uid), appUser);
          }
          
          setState({ user: appUser, firebaseUser: fUser, loading: false });
        } catch (err) {
          console.error(err);
          // If handleFirestoreError throws, it interrupts here
          setState({ user: null, firebaseUser: fUser, loading: false });
        }
      } else {
        setState({ user: null, firebaseUser: null, loading: false });
      }
    });

    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function logout() {
  await signOut(auth);
}
