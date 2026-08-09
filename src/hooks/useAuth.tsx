import { auth, db, handleFirestoreError, OperationType } from "@/lib/firebase";
import { User as FirebaseUser, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, addDoc } from "firebase/firestore";
import { useEffect, useState, createContext, useContext } from "react";
import { sendEmail } from "@/lib/api";

async function seedSampleDummyDataForNewUser(userId: string, userEmail: string) {
  try {
    // 1. Dummy Listing
    await addDoc(collection(db, "listings"), {
      userId: userId,
      agentId: userId,
      userEmail: userEmail,
      title: "123 Demo Luxury Lane [SAMPLE / DEMO DATA]",
      address: "123 Demo Luxury Lane, Beverly Hills, CA 90210",
      price: "$2,850,000",
      beds: 4,
      baths: 4.5,
      sqft: "3,850",
      description: "[SAMPLE / DEMO DATA] Modern architectural estate featuring open-concept living, panoramic canyon views, chef's kitchen with quartz island, and smart home Sora audio integration.",
      isDummyData: true,
      demoLabel: "[SAMPLE / DEMO DATA]",
      status: "Active",
      createdAt: Date.now()
    });

    // 2. Dummy Open House Event
    await addDoc(collection(db, "openHouseEvents"), {
      agentId: userId,
      listingAddress: "123 Demo Luxury Lane, Beverly Hills, CA 90210",
      eventName: "Weekend Open House Showcase [SAMPLE / DEMO DATA]",
      eventDate: new Date().toISOString().split('T')[0],
      startTime: "13:00",
      endTime: "16:00",
      eventMode: "Hybrid",
      aiTourLinked: true,
      mortgageQuestion: true,
      status: "scheduled",
      isDummyData: true,
      demoLabel: "[SAMPLE / DEMO DATA]",
      createdAt: Date.now()
    });

    // 3. Dummy Lead
    await addDoc(collection(db, "leads"), {
      agentId: userId,
      name: "Jane Smith [SAMPLE / DEMO LEAD]",
      email: "jane.smith.demo@example.com",
      phone: "(555) 234-5678",
      listingAddress: "123 Demo Luxury Lane, Beverly Hills, CA 90210",
      mortgageConsent: true,
      isVerified: true,
      confidenceScore: "high",
      occupation: "Senior Designer",
      employer: "Tech Design Co",
      isDummyData: true,
      demoLabel: "[SAMPLE / DEMO DATA]",
      createdAt: Date.now()
    });

    console.log("[useAuth] Successfully seeded initial sample dummy data for new user:", userId);
  } catch (err) {
    console.error("Failed to seed sample dummy data:", err);
  }
}

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "AGENT" | "ADMIN";
  brokerage?: string;
  brokerage_id?: string;
  team_id?: string;
  assigned_agent_id?: string;
  defaultVoiceId?: string;
  maintenanceMode?: boolean;
  createdAt: number;
  updatedAt: number;
  hasReadOnboarding?: boolean;
  onboardingReadAt?: number;
  hasDownloadedOnboardingPdf?: boolean;
  onboardingDownloadedAt?: number;
  accountType?: "agent" | "team_admin" | "brokerage_admin" | "lender" | "compliance_admin" | "platform_admin";
  subscriptionStatus?: "active" | "past_due" | "canceled";
  subscriptionPlan?: "free" | "pro" | string;
  integrations?: Record<string, any>;
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

            const savedPlan = typeof window !== "undefined" ? localStorage.getItem("selected_signup_plan") || "free" : "free";
            let targetType: "agent" | "team_admin" | "brokerage_admin" | "lender" | "compliance_admin" | "platform_admin" = "agent";
            let targetPlan = "free";

            if (savedPlan === "pro") {
              targetType = "agent";
              targetPlan = "pro";
            } else if (savedPlan === "team") {
              targetType = "team_admin";
              targetPlan = "pro";
            } else if (savedPlan === "brokerage") {
              targetType = "brokerage_admin";
              targetPlan = "elite";
            } else if (savedPlan === "lender") {
              targetType = "lender";
              targetPlan = "pro";
            }

            if (typeof window !== "undefined") {
              localStorage.removeItem("selected_signup_plan");
            }

            const appUser: AppUser = {
              id: fUser.uid,
              email: fUser.email || "",
              name: fUser.displayName || "Unknown Agent",
              role: fUser.email?.toLowerCase() === "luc.valade@gmail.com" ? "ADMIN" : "AGENT",
              brokerage: invitedBrokerage,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              accountType: targetType,
              subscriptionStatus: "active",
              subscriptionPlan: targetPlan
            };
            await setDoc(userDocRef, appUser);

            // Seed sample dummy data for new user account
            await seedSampleDummyDataForNewUser(fUser.uid, fUser.email || "");

            // Send 14-day Free Trial Welcome Email
            try {
              const signupDateStr = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
              const expiryDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
              const loginUrl = window.location.origin + "/login";

              await sendEmail({
                to: appUser.email,
                subject: "🚀 Welcome to AI Open House Connect! Your 14-Day Free Trial starts now",
                html: `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1e293b; background-color: #f8fafc;">
                    <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <span style="font-size: 48px;">🚀</span>
                        <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 15px 0 5px; tracking-tight: -0.025em; text-transform: uppercase; font-style: italic;">Welcome to <span style="font-weight: 900; color: #000000;">AI Open House Connect</span></h1>
                        <p style="color: #64748b; font-size: 14px; font-weight: 500; margin: 0;">Try Free for 14 Days (No Credit Card Required)</p>
                      </div>

                      <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                        Hello <strong>${appUser.name || 'Agent'}</strong>,
                      </p>

                      <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                        Welcome to <strong style="font-weight: 800; color: #000000;">AI Open House Connect</strong>. Your 14-Day Free Trial is now active, unlocking AI-powered talking open houses, remote digital tours, and instant access to every active property’s interactive Touchless Sign-In form and AI Walkthrough Voice Tour, with dynamic codes you can print or scan right away
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
                      © ${new Date().getFullYear()} <a href="https://www.aiopenhouseconnect.com" style="color: #94a3b8; text-decoration: underline;" target="_blank" rel="noopener noreferrer">aiopenhouseconnect.com</a>. All rights reserved.<br />
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
              const fallbackUser: AppUser = {
                id: fUser.uid,
                email: fUser.email || "",
                name: fUser.displayName || "Agent",
                role: fUser.email?.toLowerCase() === "luc.valade@gmail.com" ? "ADMIN" : "AGENT",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                accountType: "agent",
                subscriptionStatus: "active",
                subscriptionPlan: "free"
              };
              setState({ user: fallbackUser, firebaseUser: fUser, loading: false });
            }
          }, (err) => {
            console.warn("[useAuth] Listener error (offline/quota), falling back to local user profile:", err);
            const fallbackUser: AppUser = {
              id: fUser.uid,
              email: fUser.email || "",
              name: fUser.displayName || "Agent",
              role: fUser.email?.toLowerCase() === "luc.valade@gmail.com" ? "ADMIN" : "AGENT",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              accountType: "agent",
              subscriptionStatus: "active",
              subscriptionPlan: "free"
            };
            setState({ user: fallbackUser, firebaseUser: fUser, loading: false });
          });
        } catch (err) {
          console.warn("[useAuth] Failed to load Firestore user doc (offline/quota), using fallback user:", err);
          const fallbackUser: AppUser = {
            id: fUser.uid,
            email: fUser.email || "",
            name: fUser.displayName || "Agent",
            role: fUser.email?.toLowerCase() === "luc.valade@gmail.com" ? "ADMIN" : "AGENT",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            accountType: "agent",
            subscriptionStatus: "active",
            subscriptionPlan: "free"
          };
          setState({ user: fallbackUser, firebaseUser: fUser, loading: false });
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

export async function loginWithFacebook() {
  const provider = new FacebookAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function loginWithApple() {
  const provider = new OAuthProvider("apple.com");
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
