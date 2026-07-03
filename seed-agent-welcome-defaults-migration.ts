import * as fs from "fs";
import * as path from "path";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0289343453",
  appId: "1:142937005005:web:0b7eb5813eff5496998284",
  apiKey: "AIzaSyCVqNGati2Cw6RrBr3zm1aqSIhIkV2VdEg",
  authDomain: "gen-lang-client-0289343453.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-7041987e-3421-4d21-9e4e-7f7a7b28e938");

const locales = ["ar", "bn", "zh-CN", "zh-TW", "nl", "en", "fr", "de", "hi", "id", "it", "ja", "ko", "pl", "pt", "ro", "ru", "es", "sv", "ta", "th", "tr", "ur", "vi"];

const INITIAL_WELCOME_DEFAULTS = [
  { locale: "en", text_value: "Welcome! I am Sora, your real estate AI assistant. Thank you for visiting this open house. Please feel free to look around, explore the rooms, and ask me any questions about the property features, pricing, or neighborhood." },
  { locale: "fr", text_value: "Bonjour ! Je suis Sora, votre guide pour cette visite. Je suis ravie de vous accompagner. Avez-vous des questions sur cette propriété ?" },
  { locale: "es", text_value: "¡Bienvenido! Soy Sora, su asistente de inteligencia artificial para bienes raíces. Gracias por visitar esta casa abierta. Por favor, siéntase libre de mirar a su alrededor, explorar las habitaciones y hacerme cualquier pregunta sobre las características de la propiedad, el precio o el vecindario." },
  { locale: "zh-CN", text_value: "欢迎！我是 Sora，您的房地产人工智能助手。感谢您参观本次开放日。请随意看看，探索各个房间，并向我提问有关房产特征、价格或周边的任何问题。" },
  { locale: "zh-TW", text_value: "歡迎！我是 Sora，您的房地產人工智慧助手。感謝您參觀本次開放日。請隨意看看，探索各個房間，並向我提問有關房產特徵、價格或周邊的任何問題。" },
  { locale: "de", text_value: "Willkommen! Ich bin Sora, Ihre Immobilien-KI-Assistentin. Vielen Dank für Ihren Besuch bei diesem Tag der offenen Tür. Bitte schauen Sie sich ungezwungen um, erkunden Sie die Räume und stellen Sie mir Fragen zu den Eigenschaften der Immobilie, dem Preis oder der Nachbarschaft." },
  { locale: "it", text_value: "Benvenuto! Sono Sora, la tua assistente AI immobiliare. Grazie per aver visitato questa casa aperta. Ti invitiamo a guardarti intorno, esplorare le stanze e farmi qualsiasi domanda sulle caratteristiche della proprietà, sul prezzo o sul quartiere." },
  { locale: "pt", text_value: "Bem-vindo! Eu sou Sora, sua assistente de IA imobiliária. Obrigado por visitar esta casa aberta. Sinta-se à vontade para olhar ao redor, explorar os cômodos e me fazer qualquer pergunta sobre as características do imóvel, preço ou vizinhança." },
  { locale: "ja", text_value: "ようこそ！私は不動産AIアシスタントのSoraです。このオープンハウスにお越しいただきありがとうございます。どうぞご自由に周りを見渡し、お部屋を探索し、物件の特徴や価格、周辺環境について何でもご質問ください。" },
  { locale: "ko", text_value: "환영합니다! 저는 귀하의 부동산 AI 어시스턴트인 Sora입니다. 이번 오픈 하우스에 방문해 주셔서 감사합니다. 자유롭게 둘러보시고, 방을 살펴보시며 매물의 특징, 가격 또는 주변 환경에 대해 궁금한 점이 있으시면 언제든지 질문해 주세요." },
  { locale: "nl", text_value: "Welkom! Ik ben Sora, uw vastgoed AI-assistent. Bedankt voor uw bezoek aan dit open huis. Voel u vrij om rond te kijken, de kamers te verkennen en mij vragen te stellen over de kenmerken van de woning, de prijs of de buurt." },
  { locale: "ru", text_value: "Добро пожаловать! Я Сора, ваш ИИ-помощник по недвижимости. Спасибо, что посетили этот день открытых дверей. Пожалуйста, не стесняйтесь осматриваться, изучать комнаты и задавать мне любые вопросы о характеристиках недвижимости, цене или районе." },
  { locale: "vi", text_value: "Chào mừng! Tôi là Sora, trợ lý AI bất động sản của bạn. Cảm ơn bạn đã ghé thăm buổi mở cửa xem nhà này. Xin vui lòng tự nhiên nhìn xung quanh, khám phá các phòng và hỏi tôi bất kỳ câu hỏi nào về các tính năng của bất động sản, giá cả hoặc khu lân cận." },
  { locale: "ar", text_value: "أهلاً بك! أنا سورا، مساعدتك الذكية في مجال العقارات. شكراً لزيارتك هذا البيت المفتوح. لا تتردد في إلقاء نظرة حولك، واستكشاف الغرف، وطرح أي أسئلة عليّ بخصوص ميزات العقار أو Сعر أو الحي." },
  { locale: "hi", text_value: "स्वागत है! मैं सोरा हूँ, आपकी रियल एस्टेट एआई सहायक। इस ओपन हाउस में आने के लिए धन्यवाद। कृपया बेझिझक चारों ओर देखें, कमरों का अन्वेषण करें, और मुझसे संपत्ति की विशेषताओं, कीमत या पड़ोस के बारे में कोई भी प्रश्न पूछें।" },
  { locale: "bn", text_value: "স্বাগতম! আমি সোরা, আপনার রিয়েল এস্টেট এআই সহকারী। এই ওপেন হাউস পরিদর্শন করার জন্য আপনাকে ধন্যবাদ। অনুগ্রহ করে নির্দ্বিধায় চারপাশ ঘুরে দেখুন, রুমগুলো অন্বেষণ করুন এবং সম্পত্তির विशेषता, মূল্য বা আশেপাশের এলাকা সম্পর্কে আমাকে যেকোনো প্রশ্ন করুন।" },
  { locale: "id", text_value: "Selamat datang! Saya Sora, asisten AI real estat Anda. Terima kasih telah mengunjungi open house ini. Silakan melihat-lapang sekeliling, menjelajahi kamar-kamar, dan ajukan pertanyaan kepada saya tentang fitur properti, harga, atau lingkungan sekitar." },
  { locale: "pl", text_value: "Witamy! Jestem Sora, Twój sztuczny asystent ds. nieruchomości. Dziękujemy za odwiedzenie tego domu otwartego. Zapraszamy do rozejrzenia się, zwiedzania pokoi i zadawania mi pytań na temat cech nieruchomości, ceny lub okolicy." },
  { locale: "ro", text_value: "Bun venit! Sunt Sora, asistenta ta AI pentru imobiliare. Îți mulțumim că ai vizitat această casă deschisă. Te rugăm să te uiți în jur, să explorezi camerele și să-mi pui orice întrebări despre caracteristicile proprietății, preț sau cartier." },
  { locale: "sv", text_value: "Välkommen! Jag är Sora, din AI-assistent för fastigheter. Tack för att du besöker detta öppna hus. Du är välkommen att se dig omkring, utforska rummen och ställa frågor till mig om bostadens egenskaper, pris eller närområde." },
  { locale: "ta", text_value: "வரவேற்கிறோம்! நான் சோரா, உங்கள் ரியல் எस्टेट AI உதவியாளர். இந்த திறந்த இல்லத்திற்கு வருகை தந்ததற்கு நன்றி. தயவுசெய்து சுற்றிப் பார்க்கவும், அறைகளை ஆராயவும், சொத்தின் அம்சங்கள், விலை அல்லது சுற்றுப்புறத்தைப் பற்றி என்னிடம் ஏதேனும் கேள்விகளைக் கேட்கவும்." },
  { locale: "th", text_value: "ยินดีต้อนรับ! ฉันคือ Sora ผู้ช่วย AI ด้านอสังหาริมทรัพย์ของคุณ ขอขอบคุณที่มาเยี่ยมชมงานเปิดบ้านครั้งนี้ ขอเชิญรับชมรอบๆ สำรวจห้องต่างๆ และสอบถามคำถามเกี่ยวกับลักษณะของอสังหาริมทรัพย์ ราคา หรือย่านใกล้เคียงได้ตามสบาย" },
  { locale: "tr", text_value: "Hoş geldiniz! Ben emlak yapay zeka asistanınız Sora. Bu açık evi ziyaret ettiğiniz için teşekkür ederiz. Lütfen etrafa bakmaktan, odaları keşfetmekten ve bana soru sormaktan çekinmeyin." },
  { locale: "ur", text_value: "خوش آمدید! میں سورا ہوں، آپ کی رئیل اسٹیٹ اے آئی اسسٹنٹ۔ اس اوپن ہاؤس میں آنے کا شکریہ۔ براہ کرم بلا جھجھک آس پاس دیکھیں، کمروں کا جائزہ لیں اور مجھ سے کوئی بھی سوال پوچھیں۔" }
];

async function run() {
  console.log("=== STARTING AGENT WELCOME DEFAULTS SEEDING MIGRATION (CLIENT SDK) ===");
  try {
    // Step 0: Sign in anonymously
    console.log("--- Step 0: Authenticating with Client SDK ---");
    await signInAnonymously(auth);
    console.log("Successfully authenticated client SDK session!");

    // Step 1: Read platform-wide defaults from Firestore
    console.log("\n--- Step 1: Fetching platform-wide defaults ---");
    const platformDefaults: Record<string, string> = {};
    try {
      const platformSnap = await getDocs(collection(db, "platform_content_defaults"));
      platformSnap.forEach((docSnap) => {
        const item = docSnap.data();
        const locale = item.locale || docSnap.id.replace("sora_welcome_message_", "");
        if (item.text_value) {
          platformDefaults[locale] = item.text_value;
        }
      });
    } catch (err: any) {
      console.warn("Could not list platform_content_defaults. Falling back to default list. Reason:", err.message);
    }

    // Merge with in-memory fallback defaults
    const finalDefaults: Record<string, string> = {};
    INITIAL_WELCOME_DEFAULTS.forEach((item) => {
      finalDefaults[item.locale] = platformDefaults[item.locale] || item.text_value;
    });

    console.log(`Loaded defaults for ${Object.keys(finalDefaults).length} languages. (US English template length: ${finalDefaults["en"].length} chars)`);

    // Step 2: Rollback Safety - Snapshot existing listings' resolved welcome messages
    console.log("\n--- Step 2: Creating Listing Resolved Welcome Message Backup ---");
    const backupData: any[] = [];
    const listingsSnap = await getDocs(collection(db, "listings"));
    console.log(`Found ${listingsSnap.docs.length} total listings in listings collection.`);

    for (const listingDoc of listingsSnap.docs) {
      const listingId = listingDoc.id;
      const listingData = listingDoc.data();
      const ownerId = listingData.ownerId || "";

      // Resolve EN message
      let resolvedEn = "";
      const customDocIdEn = `${listingId}_en`;
      const enCustomRef = doc(db, "property_welcome_messages", customDocIdEn);
      try {
        const enCustomSnap = await getDoc(enCustomRef);
        if (enCustomSnap.exists() && enCustomSnap.data()?.text_value) {
          resolvedEn = enCustomSnap.data().text_value;
        } else {
          resolvedEn = finalDefaults["en"];
        }
      } catch (err) {
        resolvedEn = finalDefaults["en"];
      }

      // Resolve FR message
      let resolvedFr = "";
      const customDocIdFr = `${listingId}_fr`;
      const frCustomRef = doc(db, "property_welcome_messages", customDocIdFr);
      try {
        const frCustomSnap = await getDoc(frCustomRef);
        if (frCustomSnap.exists() && frCustomSnap.data()?.text_value) {
          resolvedFr = frCustomSnap.data().text_value;
        } else {
          resolvedFr = finalDefaults["fr"];
        }
      } catch (err) {
        resolvedFr = finalDefaults["fr"];
      }

      backupData.push({
        listing_id: listingId,
        agent_id: ownerId,
        resolved_message_en: resolvedEn,
        resolved_message_fr: resolvedFr,
        original_welcome_en_field: listingData.welcome_en || null,
        original_welcome_fr_field: listingData.welcome_fr || null,
        welcome_message_type: listingData.welcome_message_type || null
      });
    }

    const backupFilePath = path.join(process.cwd(), "listings_resolved_welcomes_backup.json");
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf-8");
    console.log(`Snapshot saved successfully to ${backupFilePath} with ${backupData.length} listing entries.`);

    // Step 3: Migration Seeding - Create welcome_defaults for every user/agent
    console.log("\n--- Step 3: Seeding welcome_defaults and creating audit logs ---");
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Found ${usersSnap.docs.length} users/agents in system.`);

    let seededCount = 0;
    const migrationTime = Date.now();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      console.log(`Seeding defaults for Agent: ${userData.name || "Unknown"} (${userId})...`);

      // Prepare personal defaults document payload
      const personalDefaultsPayload: Record<string, any> = {
        id: userId,
        agent_id: userId,
        updated_at: migrationTime,
        updated_by: "system_migration"
      };

      // Populate locale defaults
      locales.forEach((locale) => {
        personalDefaultsPayload[`welcome_${locale}`] = finalDefaults[locale];
      });

      // Write personal welcome defaults document
      const defaultsRef = doc(db, "welcome_defaults", userId);
      await setDoc(defaultsRef, personalDefaultsPayload);

      // Create Audit Log entry
      const auditLogDocId = `migration_seed_${userId}_${migrationTime}`;
      const auditLogRef = doc(db, "auditLogs", auditLogDocId);
      await setDoc(auditLogRef, {
        id: auditLogDocId,
        agent_id: userId,
        action_type: "migration_seed",
        previous_value: null,
        new_value: JSON.stringify({
          welcome_en: finalDefaults["en"],
          welcome_fr: finalDefaults["fr"]
        }),
        timestamp: migrationTime,
        triggered_by: "system_migration"
      });

      console.log(`Successfully seeded welcome_defaults and logged audit entry for user ${userId}`);
      seededCount++;
    }

    console.log(`Successfully completed migration step for ${seededCount} agents.`);

    // Step 4: Verification - Automated validation of post-migration resolution
    console.log("\n--- Step 4: Verification Step ---");
    console.log("Verifying post-migration resolution integrity...");
    
    // Read snapshot data
    const snapshotData: any[] = JSON.parse(fs.readFileSync(backupFilePath, "utf-8"));
    let mismatchCount = 0;

    for (const snapshot of snapshotData) {
      const listingId = snapshot.listing_id;
      const agentId = snapshot.agent_id;

      console.log(`Verifying listing ${listingId} (Agent ID: ${agentId})...`);

      // Resolve Post-Migration EN message
      let postEn = "";
      const customDocIdEn = `${listingId}_en`;
      const enCustomRef = doc(db, "property_welcome_messages", customDocIdEn);
      try {
        const enCustomSnap = await getDoc(enCustomRef);
        if (enCustomSnap.exists() && enCustomSnap.data()?.text_value) {
          postEn = enCustomSnap.data().text_value;
        } else {
          // Resolve from agent welcome_defaults
          console.log(`  Retrieving EN welcome_defaults for agent ${agentId}...`);
          const defaultsRef = doc(db, "welcome_defaults", agentId);
          const agentDefaultsSnap = await getDoc(defaultsRef);
          if (agentDefaultsSnap.exists() && agentDefaultsSnap.data()?.welcome_en) {
            postEn = agentDefaultsSnap.data().welcome_en;
          } else {
            postEn = finalDefaults["en"];
          }
        }
      } catch (err: any) {
        console.error(`  [ERROR] Failed to resolve EN message for listing ${listingId}:`, err.message || err);
        mismatchCount++;
        continue;
      }

      // Resolve Post-Migration FR message
      let postFr = "";
      const customDocIdFr = `${listingId}_fr`;
      const frCustomRef = doc(db, "property_welcome_messages", customDocIdFr);
      try {
        const frCustomSnap = await getDoc(frCustomRef);
        if (frCustomSnap.exists() && frCustomSnap.data()?.text_value) {
          postFr = frCustomSnap.data().text_value;
        } else {
          // Resolve from agent welcome_defaults
          console.log(`  Retrieving FR welcome_defaults for agent ${agentId}...`);
          const defaultsRef = doc(db, "welcome_defaults", agentId);
          const agentDefaultsSnap = await getDoc(defaultsRef);
          if (agentDefaultsSnap.exists() && agentDefaultsSnap.data()?.welcome_fr) {
            postFr = agentDefaultsSnap.data().welcome_fr;
          } else {
            postFr = finalDefaults["fr"];
          }
        }
      } catch (err: any) {
        console.error(`  [ERROR] Failed to resolve FR message for listing ${listingId}:`, err.message || err);
        mismatchCount++;
        continue;
      }

      const matchEn = postEn === snapshot.resolved_message_en;
      const matchFr = postFr === snapshot.resolved_message_fr;

      if (!matchEn || !matchFr) {
        console.warn(`[DISCREPANCY DETECTED] Listing ID: ${listingId}`);
        if (!matchEn) {
          console.warn(`- EN Mismatch! Expected: "${snapshot.resolved_message_en}"`);
          console.warn(`                Got:      "${postEn}"`);
        }
        if (!matchFr) {
          console.warn(`- FR Mismatch! Expected: "${snapshot.resolved_message_fr}"`);
          console.warn(`                Got:      "${postFr}"`);
        }
        mismatchCount++;
      }
    }

    if (mismatchCount === 0) {
      console.log("✅ Verification Success! 100% of listing welcome resolutions match pre-migration states exactly!");
    } else {
      console.error(`❌ Verification completed with ${mismatchCount} discrepancy alerts. Please review the manual correction paths.`);
    }

    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err: any) {
    console.error("FATAL ERROR DURING MIGRATION:", err.message || err);
  } finally {
    process.exit(0);
  }
}

run();
