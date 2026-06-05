import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useEffect, useState, createContext, useContext } from "react";
import { sendEmail } from "@/lib/api";

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

            // Send 14-day Free Trial Welcome Email
            try {
              const signupDateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
              const expiryDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
              const loginUrl = window.location.origin + "/login";

              await sendEmail({
                to: appUser.email,
                subject: "🚀 Welcome to VertexAgent! Your 14-Day Free Trial starts now",
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="font-size: 48px;">🚀</span>
                        <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 15px 0 5px; tracking-tight: -0.025em; text-transform: uppercase; font-style: italic;">Welcome to VertexAgent</h1>
                        <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0;">Try Free for 14 Days (No Credit Card Required)</p>
                      </div>

                      <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                        Hello <strong>${appUser.name || 'Agent'}</strong>,
                      </p>

                      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                        We are thrilled to welcome you to VertexAgent.io. Your account has been provisioned on our <strong>14-Day Free Trial</strong> tier. This gives you complete access to generate high-fidelity AI-powered talking open houses and remote digital tours!
                      </p>

                      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                        <h3 style="margin-top: 0; color: #1e40af; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; margin-bottom: 12px; font-style: italic;">Trial Account Benefits & Details</h3>
                        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                          <tr style="border-bottom: 1px solid #dbeafe;">
                            <td style="padding: 8px 0; color: #1e40af; font-weight: 600;">Signup Date</td>
                            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${signupDateStr}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #1e40af; font-weight: 600;">Expiry Date</td>
                            <td style="padding: 8px 0; color: #ef4444; font-weight: 700; text-align: right;">${expiryDateStr} (14 Days)</td>
                          </tr>
                        </table>
                      </div>

                      <h3 style="color: #0f172a; font-size: 15px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; font-style: italic;">🔥 What is next?</h3>
                      <ol style="padding-left: 20px; font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 32px;">
                        <li style="margin-bottom: 10px;"><strong>Create a Listing:</strong> Add a property address to quickly import MLS specs or input details manually.</li>
                        <li style="margin-bottom: 10px;"><strong>Configure Sora (AI Assistant):</strong> Choose from our curated natural voices and tailor talking points for the tour.</li>
                        <li style="margin-bottom: 10px;"><strong>Generate the Open House QR:</strong> Print the code to place in the home or deploy touchless visitor sign-ins automatically!</li>
                      </ol>

                      <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: bold; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.2s;">
                          Launch Your Agent Dashboard &rarr;
                        </a>
                      </div>

                      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 25px;" />

                      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 15px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
                        <strong>Friendly Note:</strong> We will send you a trial update email 7 days prior to expiry so you can choose to upgrade smoothly if you are enjoying the AI tours.
                      </div>
                    </div>
                    <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
                      © ${new Date().getFullYear()} <a href="https://www.VertexAgent.io" style="color: #94a3b8; text-decoration: underline;" target="_blank" rel="noopener noreferrer">VertexAgent.io</a>. All rights reserved.<br />
                      If you did not sign up for this account, you can safely ignore this.
                    </p>
                  </div>
                `
              });
              console.log("[useAuth] Welcome Email successfully dispatched to trialist:", appUser.email);
            } catch (err) {
              console.warn("[useAuth] Welcome email skipped/failed during registration:", err);
            }
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
