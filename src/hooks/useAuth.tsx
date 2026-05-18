import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useEffect, useState, createContext, useContext } from "react";

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "AGENT" | "ADMIN";
  brokerage?: string;
  defaultVoiceId?: string;
  maintenanceMode?: boolean;
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
    let unsubscribeUser: (() => void) | null = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged(async (fUser) => {
      // Clean up previous user listener if it exists
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (fUser) {
        try {
          const userDocRef = doc(db, "users", fUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Check for pending invitation
            let invitedBrokerage = "";
            try {
              const invitesRef = collection(db, "invitations");
              const q = query(invitesRef, where("email", "==", fUser.email?.toLowerCase()), where("status", "==", "pending"));
              const inviteSnap = await getDocs(q);
              
              if (!inviteSnap.empty) {
                const inviteData = inviteSnap.docs[0].data();
                invitedBrokerage = inviteData.brokerage;
                
                await updateDoc(doc(db, "invitations", inviteSnap.docs[0].id), { 
                  status: "accepted",
                  acceptedAt: Date.now(),
                  userId: fUser.uid
                });
              }
            } catch (err) {
              console.error("Error checking invitation:", err);
            }

            const appUser: AppUser = {
              id: fUser.uid,
              email: fUser.email || "",
              name: fUser.displayName || "Unknown Agent",
              role: fUser.email?.toLowerCase() === "luc.valade@gmail.com" ? "ADMIN" : "AGENT",
              brokerage: invitedBrokerage,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await setDoc(userDocRef, appUser);
          }
          
          // Set up real-time listener for the user record
          unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setState({ user: docSnap.data() as AppUser, firebaseUser: fUser, loading: false });
            } else {
              setState(prev => ({ ...prev, loading: false }));
            }
          }, (err) => {
            console.error("Error listening to user record:", err);
            setState(prev => ({ ...prev, loading: false }));
          });
        } catch (err) {
          console.error(err);
          setState({ user: null, firebaseUser: fUser, loading: false });
        }
      } else {
        setState({ user: null, firebaseUser: null, loading: false });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signUpWithEmail(email: string, pass: string, name: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(user, { displayName: name });
  // The onAuthStateChanged listener will handle the Firestore document creation
}

export async function loginWithEmail(email: string, pass: string) {
  await signInWithEmailAndPassword(auth, email, pass);
}

export async function logout() {
  await signOut(auth);
}
