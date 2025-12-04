// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

// 🔹 models used by voice assistant intents
const Appointment = require("../models/Appointment");
const DiaryEntry = require("../models/DiaryEntry");

/* ============================================================
   MULTER SETUP FOR FILE-BASED REPORT EXPLANATION
   Files will be stored in: backend/uploads/ai-reports
============================================================ */
const aiUploadsDir = path.join(__dirname, "..", "uploads", "ai-reports");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, aiUploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}-ai-${baseName}${ext}`);
  },
});

const upload = multer({ storage });

/* ============================================================
   1) VOICE ASSISTANT CHAT + MULTI-INTENT
   POST /api/ai/chat
============================================================ */
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const text = content.toLowerCase().trim();

    // helper: infer mood keyword for diary entries
    function inferMood(t) {
      if (
        t.includes("happy") ||
        t.includes("excited") ||
        t.includes("good") ||
        t.includes("grateful")
      )
        return "happy";
      if (
        t.includes("sad") ||
        t.includes("cry") ||
        t.includes("lonely") ||
        t.includes("empty") ||
        t.includes("worthless")
      )
        return "sad";
      if (
        t.includes("anxious") ||
        t.includes("anxiety") ||
        t.includes("panic") ||
        t.includes("worried") ||
        t.includes("stressed") ||
        t.includes("stress")
      )
        return "anxious";
      if (
        t.includes("angry") ||
        t.includes("frustrated") ||
        t.includes("irritated") ||
        t.includes("pissed") ||
        t.includes("rage")
      )
        return "angry";
      return "neutral";
    }

    /* -----------------------------------------------
       A) DETECT INTENTS (can be more than one)
    ------------------------------------------------ */

    const hasAppointment = text.includes("appointment with");
    const hasDiary =
      text.includes("write in my diary") ||
      text.includes("add to my diary") ||
      text.includes("note in my diary") ||
      text.startsWith("dear diary");
    const hasDoctorHelp =
      text.includes("which doctor") ||
      text.includes("what doctor") ||
      text.includes("doctor should i see") ||
      text.includes("search doctor") ||
      text.includes("find a doctor");
    const hasPeriodMention =
      text.includes("log my period") ||
      text.includes("period started") ||
      text.includes("periods started") ||
      text.includes("my period started") ||
      text.includes("my periods started") ||
      text.includes("i got my period") ||
      text.includes("period ended") ||
      text.includes("my period ended");

    const replyParts = [];
    const intentSummary = {};

    /* -----------------------------------------------
       B) HANDLE APPOINTMENT INTENT (more forgiving)
       Examples:
       - "fix an appointment with doctor Tanmay on December 12 at 4pm"
       - "appointment with Dr Sri Charan on 11th December 2025 at 12:00 p.m."
       - "appointment with doctor X on 11 December 2025"
    ------------------------------------------------ */
    if (hasAppointment) {
      try {
        let clause = content;
        const lower = text;
        const startIdx = lower.indexOf("appointment with");
        if (startIdx !== -1) {
          clause = content.slice(startIdx);
        }

        const splitTokens = [" also ", " then ", " and then ", " and also "];
        for (const tok of splitTokens) {
          const idx = clause.toLowerCase().indexOf(tok);
          if (idx !== -1) {
            clause = clause.slice(0, idx);
            break;
          }
        }

        // clause is like: "appointment with doctor Tanmay on December 12 at 4pm"
        const lowerClause = clause.toLowerCase();
        const apptKey = "appointment with";
        const apptPos = lowerClause.indexOf(apptKey);
        let doctorName = "";
        let dateTimeRaw = "";

        if (apptPos !== -1) {
          const afterAppt = clause.slice(apptPos + apptKey.length).trim(); // "doctor Tanmay on December 12 at 4pm"
          const onIdx = afterAppt.toLowerCase().indexOf(" on ");
          if (onIdx !== -1) {
            const doctorPart = afterAppt.slice(0, onIdx).trim(); // "doctor Tanmay"
            const datePart = afterAppt.slice(onIdx + 4).trim(); // "December 12 at 4pm"

            doctorName = doctorPart.replace(/\s+/g, " ");

            // normalize datePart
            let dtRaw = datePart;

            // sometimes STT says "is 4pm" instead of "at 4pm"
            dtRaw = dtRaw.replace(/\bis\s+([0-9])/i, "at $1");

            // remove day suffixes: 11th -> 11
            dtRaw = dtRaw.replace(/(\d+)(st|nd|rd|th)/gi, "$1");

            // normalize a.m./p.m. => am/pm
            dtRaw = dtRaw.replace(
              /\b([0-9: ]+)\s*(a\.?m\.?|p\.?m\.?)/gi,
              (_, time, ap) => {
                const cleanAp = ap.toLowerCase().startsWith("p") ? "pm" : "am";
                return `${time.trim()} ${cleanAp}`;
              }
            );

            // remove trailing polite words if present
            dtRaw = dtRaw.replace(/\b(please|kindly)\b/gi, "").trim();

            dateTimeRaw = dtRaw;
          }
        }

        if (!doctorName || !dateTimeRaw) {
          replyParts.push(
            "I heard that you want to fix an appointment, but I couldn’t understand the details clearly. Try saying, for example: “Fix an appointment with Dr Sricharan on 11 December 2025 at 12 pm.”"
          );
          intentSummary.appointment = { type: "appointment_not_parsed" };
        } else {
          const parsed = new Date(dateTimeRaw);
          const isValidDate = !isNaN(parsed.getTime());

          if (!isValidDate) {
            replyParts.push(
              "I understood you want to fix an appointment, but I couldn’t clearly read the date and time. Try saying it like: “Fix an appointment with Dr Sricharan on 11 December 2025 at 12 pm.”"
            );
            intentSummary.appointment = { type: "appointment_parse_error" };
          } else {
            const appointment = await Appointment.create({
              user: req.user._id,
              doctorName,
              specialty: "",
              location: "",
              dateTime: parsed,
              source: "voice_assistant",
            });

            replyParts.push(
              `Okay, I’ve added this appointment:\n• Doctor: ${doctorName}\n• When: ${parsed.toLocaleString()}\nYou’ll see it in your Wellness page under “Next appointment”.`
            );

            intentSummary.appointment = {
              type: "appointment_created",
              appointmentId: appointment._id,
              doctorName,
              dateTime: appointment.dateTime,
            };
          }
        }
      } catch (e) {
        console.error("Voice appointment create error:", e);
        replyParts.push(
          "I tried to save your appointment, but something went wrong. Please try again or add it in the Wellness page."
        );
        intentSummary.appointment = { type: "appointment_error" };
      }
    }

    /* -----------------------------------------------
       C) HANDLE DIARY INTENT
       e.g. "write in my diary that I am feeling bad"
    ------------------------------------------------ */
    if (hasDiary) {
      try {
        let diaryText = content;

        const lowerContent = content.toLowerCase();
        const keyPhrases = [
          "write in my diary that",
          "add to my diary that",
          "note in my diary that",
        ];

        let startPos = -1;
        for (const phrase of keyPhrases) {
          const idx = lowerContent.indexOf(phrase);
          if (idx !== -1) {
            startPos = idx + phrase.length;
            break;
          }
        }

        if (startPos !== -1) {
          diaryText = content.slice(startPos).trim();
        } else if (lowerContent.startsWith("dear diary")) {
          diaryText = content.slice("dear diary".length).trim();
        }

        const mood = inferMood(text);

        const entry = await DiaryEntry.create({
          user: req.user._id,
          date: new Date(),
          text: diaryText,
          mood,
          private: true,
        });

        replyParts.push(
          "I’ve written that in your diary for today. 📝 You can see it in your Personal Diary section whenever you want."
        );
        intentSummary.diary = {
          type: "diary_created",
          diaryId: entry._id,
          mood,
        };
      } catch (e) {
        console.error("Voice diary create error:", e);
        replyParts.push(
          "I tried to write this in your diary, but something went wrong. Please try again later."
        );
        intentSummary.diary = { type: "diary_error" };
      }
    }

    /* -----------------------------------------------
       D) HANDLE DOCTOR TYPE SUGGESTION
       e.g. "which doctor should I see for heavy periods in Hyderabad"
    ------------------------------------------------ */
    if (hasDoctorHelp) {
      try {
        let city = null;
        const cityMatch = content.match(/\bin\s+([a-zA-Z\s]+)$/i);
        if (cityMatch) {
          city = cityMatch[1].trim();
        }

        const issue = text;

        let specialty = "General physician";
        if (
          issue.includes("period") ||
          issue.includes("pcos") ||
          issue.includes("pelvic") ||
          issue.includes("gyne")
        ) {
          specialty = "Gynecologist";
        } else if (issue.includes("thyroid") || issue.includes("hormone")) {
          specialty = "Endocrinologist";
        } else if (issue.includes("skin") || issue.includes("acne")) {
          specialty = "Dermatologist";
        } else if (
          issue.includes("anxiety") ||
          issue.includes("depression") ||
          issue.includes("panic") ||
          issue.includes("mental")
        ) {
          specialty = "Psychiatrist or Psychologist";
        } else if (
          issue.includes("fever") ||
          issue.includes("cold") ||
          issue.includes("cough")
        ) {
          specialty = "General physician";
        }

        const displayCity = city || "your area";
        const q = encodeURIComponent(`${specialty} near ${displayCity}`);
        const googleSearchUrl = `https://www.google.com/search?q=${q}`;
        const googleMapsUrl = `https://www.google.com/maps/search/${q}`;
        const practoSearchUrl = `https://www.practo.com/search/doctors?results_type=doctor&q=${encodeURIComponent(
          specialty
        )}&city=${encodeURIComponent(city || "")}`;

        const docText =
          `Based on what you told me, a **${specialty}** sounds like a good doctor to talk to.\n\n` +
          `You can look for:\n` +
          `• On Google: "${specialty} near ${displayCity}"\n` +
          `• On Google Maps or Practo to see ratings, reviews, and timings.\n\n` +
          `I can’t book directly for you, but I can help you remember appointments once you decide. 💊`;

        replyParts.push(docText);
        intentSummary.doctor = {
          type: "doctor_suggestion",
          specialty,
          city: city || null,
          searchLinks: {
            googleSearchUrl,
            googleMapsUrl,
            practoSearchUrl,
          },
        };
      } catch (e) {
        console.error("Voice doctor-suggest error:", e);
        replyParts.push(
          "I tried to think about which doctor you should see, but something went wrong. Please try again."
        );
        intentSummary.doctor = { type: "doctor_error" };
      }
    }

    /* -----------------------------------------------
       E) HANDLE PERIOD MENTION
       e.g. "my periods started today"
    ------------------------------------------------ */
    if (hasPeriodMention) {
      const periodText =
        "Thanks for telling me about your period. 🌸\n" +
        "I’ve noted it mentally for our conversation.\n\n" +
        "For proper tracking (cycle length, upcoming phases, reminders), please also log it in the **Period Tracker** tab – that’s where I calculate your phase and comfort tips.";
      replyParts.push(periodText);
      intentSummary.period = { type: "period_mentioned" };
    }

    /* -----------------------------------------------
       F) IF WE DID ANY ACTION ABOVE → RETURN COMBINED
    ------------------------------------------------ */
    if (replyParts.length > 0) {
      return res.json({
        text: replyParts.join("\n\n"),
        intent: intentSummary,
      });
    }

    /* -----------------------------------------------
       G) EMOTIONAL SUPPORT (fallback – your old logic)
    ------------------------------------------------ */

    let reply;

    const breakupWords = ["break up", "broke up", "breakup", "separated"];
    const relationshipWords = [
      "boyfriend",
      "gf",
      "girlfriend",
      "relationship",
      "ex",
    ];

    const isBreakup =
      breakupWords.some((w) => text.includes(w)) ||
      (relationshipWords.some((w) => text.includes(w)) &&
        (text.includes("left") ||
          text.includes("cheated") ||
          text.includes("hurt") ||
          text.includes("ended")));

    const isVerySad =
      text.includes("i am sad") ||
      text.includes("i'm sad") ||
      text.includes("feeling low") ||
      text.includes("very low") ||
      text.includes("depressed") ||
      text.includes("empty") ||
      text.includes("worthless") ||
      text.includes("crying") ||
      text.includes("cried");

    const isAnxious =
      text.includes("anxious") ||
      text.includes("anxiety") ||
      text.includes("overthinking") ||
      text.includes("over thinking") ||
      text.includes("panic") ||
      text.includes("scared") ||
      text.includes("worried") ||
      text.includes("nervous");

    const isAngry =
      text.includes("angry") ||
      text.includes("frustrated") ||
      text.includes("irritated") ||
      text.includes("pissed") ||
      text.includes("mad") ||
      text.includes("rage");

    const isLonely =
      text.includes("lonely") ||
      text.includes("alone") ||
      text.includes("no one cares") ||
      text.includes("nobody cares") ||
      text.includes("no one understands") ||
      text.includes("nobody understands") ||
      text.includes("ignored");

    const isPeriodRelated =
      text.includes("period") ||
      text.includes("cramp") ||
      text.includes("pms") ||
      text.includes("bleeding") ||
      text.includes("menstrual") ||
      text.includes("pcos");

    if (isBreakup) {
      reply = `
I’m really, really sorry that you’re going through this. 💔  
Breakups can feel like the ground has been pulled from under you, especially when it’s someone you deeply cared about.

Your pain is valid. It makes sense that you’re hurting right now.  
You don’t have to “move on” quickly or pretend you’re okay.

If you feel comfortable, tell me:
- What hurts the most about this breakup right now?
- Are you feeling more sad, angry, numb, or something else?

I’m here with you, and I’m not judging you at all. Just talk to me at your pace.
      `.trim();
    } else if (isVerySad) {
      reply = `
I'm really sorry that you're feeling this sad. 💜  
You don’t have to minimize your feelings — what you’re going through matters.

Sometimes sadness feels heavy, like you’re carrying it alone.  
But right now, you’re *not* alone. I’m here, listening just to you.

If you feel ready, you can tell me:
- What made today especially hard?
- Are there specific thoughts that keep coming back?

We can unpack it gently, step by step.
      `.trim();
    } else if (isAnxious) {
      reply = `
It sounds like your mind has been running non-stop, and that can be exhausting. 😔  
Anxiety can make even small things feel overwhelming, and that’s not your fault.

Let’s try something tiny together:
- Inhale slowly for 4 seconds  
- Hold for 4 seconds  
- Exhale for 6 seconds  

You can repeat that 3 times, and then tell me:
What are some of the thoughts that keep looping in your mind?  
You don’t have to solve everything right now — just share one piece with me.
      `.trim();
    } else if (isAngry) {
      reply = `
I can feel how much anger and frustration you're holding inside. 🔥  
It’s okay to feel angry — it usually means something important to you was hurt, disrespected, or ignored.

You don’t have to suppress it here. You can let it out in words.

If you want, you can tell me:
- What exactly happened?
- What feels the most unfair about it?

I’ll listen patiently, without telling you to “calm down” or “let it go.” Your feelings are real.
      `.trim();
    } else if (isLonely) {
      reply = `
Feeling lonely is such a heavy experience, especially when it seems like no one truly understands you. 💧

I’m really glad you reached out instead of staying completely silent inside your thoughts.  
You deserve connection, gentleness, and people who care.

Right now, I’m here with you. You’re not invisible to me.

If you’d like, tell me:
- When do you feel this loneliness the most — at night, after class, after talking to someone?
- Do you remember a moment when you felt a little less alone?

We can slowly explore this together.
      `.trim();
    } else if (isPeriodRelated) {
      reply = `
I'm sorry your body is feeling uncomfortable right now. 🌸  
Periods, cramps, hormonal swings — they can affect not only the body but also your mood and energy.

Some gentle comforts you might try (if they’re safe for you):
- Warm water bag on your lower abdomen  
- Light stretches or a slow walk  
- Warm water or herbal tea  
- Soft, non-judgmental rest (you *are* allowed to rest)

If you want, you can tell me:
- Are your cramps more physical, or do you feel emotionally drained too?

Remember: if pain is severe or bleeding is very heavy, it’s important to talk to a real doctor.
      `.trim();
    } else {
      reply = `
Thank you for sharing this with me. 💜  
From what you said:

"${content}"

…it sounds like you’re carrying a lot inside right now.

I’m here to listen, without judging or rushing you.  
If you’d like, you can tell me a bit more about:
- What made you feel this way today?
- What’s the one thing on your mind that feels the heaviest?

You don’t have to be “fine” with me. You’re allowed to feel exactly how you feel.
      `.trim();
    }

    return res.json({ text: reply, intent: null });
  } catch (err) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   2) MOOD SUGGESTIONS
   POST /api/ai/mood-suggestions
============================================================ */
router.post("/mood-suggestions", requireAuth, async (req, res) => {
  try {
    const { mood, cyclePhase, restrictions } = req.body || {};

    const actionsByMood = {
      anxious: [
        "Try 5-minute box breathing: inhale 4s, hold 4s, exhale 6s.",
        "Grounding method: name 5 things you see, 4 you can touch, 3 you hear.",
        "Take a short walk or stretch gently.",
      ],
      sad: [
        "Write down 3 things you are grateful for today.",
        "Listen to calming music you like.",
        "Talk to someone you trust or take a peaceful walk.",
      ],
      angry: [
        "Try progressive muscle relaxation.",
        "Step away for 5 minutes, take 3 slow deep breaths.",
        "Write your feelings on paper then close it.",
      ],
      calm: [
        "Continue your calming routine and hydrate.",
        "A short mindfulness check-in can help refresh your mind.",
        "Light stretching or yoga for balance.",
      ],
      neutral: [
        "Drink water and take a small break.",
        "Do one tiny activity you enjoy.",
        "Stretch for 2 minutes.",
      ],
    };

    const foodByPhase = {
      period: [
        "Iron-rich foods: spinach, lentils, tofu.",
        "Ginger tea to ease cramps (if safe for you).",
        "Oats or sweet potatoes for steady energy.",
      ],
      follicular: [
        "High-protein meals with colourful veggies.",
        "Berries and leafy greens.",
        "Nuts and seeds for energy.",
      ],
      ovulation: [
        "Foods with healthy fats like avocado and nuts.",
        "Pumpkin seeds, eggs, or plant-based zinc sources.",
        "High-fiber fruits.",
      ],
      luteal: [
        "Magnesium foods: bananas, nuts, dark chocolate (in moderation).",
        "Warm herbal teas.",
        "Sweet potato or millets for steady energy.",
      ],
    };

    const chosenMood = (mood || "neutral").toLowerCase();
    const chosenPhase = (cyclePhase || "period").toLowerCase();

    let actions = actionsByMood[chosenMood] || actionsByMood["neutral"];
    let foods = foodByPhase[chosenPhase] || foodByPhase["period"];

    if (restrictions && typeof restrictions === "string") {
      if (/vegan/i.test(restrictions)) {
        foods = foods.map((f) =>
          f.replace(/eggs|fish|dairy/gi, "plant-based alternatives")
        );
      }
    }

    return res.json({
      actions,
      foods,
      checkin:
        "If you ever feel severe pain, extremely heavy bleeding, or suicidal thoughts, please seek immediate medical help.",
    });
  } catch (err) {
    console.error("Mood Suggestion Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3) TEXT REPORT EXPLANATION
   POST /api/ai/report-explain
============================================================ */
router.post("/report-explain", requireAuth, async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText || !reportText.trim()) {
      return res.status(400).json({ error: "Report text is required" });
    }

    const explanation =
      "I can’t diagnose from this report, but here are some general pointers:\n\n" +
      "- Lab reports usually show a value and a normal range for each marker.\n" +
      "- Terms like Hb, RBC, WBC, TSH, etc. are different tests about blood or hormones.\n" +
      "- Anything clearly marked as 'high' or 'low' should be discussed with your doctor.\n\n" +
      "If you paste specific lines like “TSH: 6.5 mIU/L (0.4–4.0)” I can help explain what that marker usually means in simple language.\n\n" +
      "Always use this only to understand words, not to decide treatment. Follow your doctor’s advice for all medical decisions.";

    res.json({ explanation });
  } catch (err) {
    console.error("report-explain error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   3B) FILE REPORT EXPLANATION
   POST /api/ai/report-explain-file
============================================================ */
router.post(
  "/report-explain-file",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Report file is required" });
      }

      const explanation = `
I’ve received your report file: "${req.file.originalname}".

Right now, I can’t directly read or extract exact numbers from the file inside this app.  
But here’s how you can look at most medical reports in a simple way:

1) **Look for the summary / impression section**  
   This usually appears near the end of the report and tells you, in a few lines, what the main finding is.

2) **Check each test/value row**  
   Many reports show:
   - Name of the test or measurement  
   - Your value  
   - A “normal” or reference range  

   Anything clearly marked as “high”, “low”, or highlighted should be discussed with your doctor.

3) **Ask: is this urgent or routine?**  
   - Very abnormal or emergency results are usually highlighted, and your doctor will clearly mention them.  
   - Mild variations are often monitored over time.

If you’d like more help here, you can copy-paste the important values or lines (for example “TSH 6.5 mIU/L, normal range 0.4–4.0”) into the text explanation box. I can then explain those terms in simple language.

This space is only to help you feel a bit less confused. It **cannot** replace a real doctor’s advice or diagnosis.
      `.trim();

      return res.json({
        explanation,
        safeNotice:
          "This is general AI guidance, not a medical diagnosis. Always consult your doctor for report interpretation.",
      });
    } catch (err) {
      console.error("report-explain-file error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/* ============================================================
   4) DOCTOR TYPE SUGGESTION + SMART SEARCH LINKS (NO GOOGLE API)
   POST /api/ai/doctor-suggest
============================================================ */
router.post("/doctor-suggest", requireAuth, async (req, res) => {
  try {
    const { mainIssue, city } = req.body || {};
    const issue = (mainIssue || "").toLowerCase();
    const trimmedCity = (city || "").trim();

    let specialty = "General physician";
    if (
      issue.includes("period") ||
      issue.includes("pcos") ||
      issue.includes("pelvic") ||
      issue.includes("gyne")
    ) {
      specialty = "Gynecologist";
    } else if (issue.includes("thyroid") || issue.includes("hormone")) {
      specialty = "Endocrinologist";
    } else if (issue.includes("skin") || issue.includes("acne")) {
      specialty = "Dermatologist";
    } else if (
      issue.includes("anxiety") ||
      issue.includes("depression") ||
      issue.includes("panic") ||
      issue.includes("mental")
    ) {
      specialty = "Psychiatrist / Psychologist";
    } else if (
      issue.includes("fever") ||
      issue.includes("cold") ||
      issue.includes("cough")
    ) {
      specialty = "General physician";
    }

    const displayCity = trimmedCity || "your area";

    const message =
      `Based on what you wrote, a ${specialty} might be appropriate. ` +
      `This is not a diagnosis. Please visit a licensed doctor for proper evaluation.\n\n` +
      `Below are some helpful links where you can search for top-rated ${specialty}s near ${displayCity}. ` +
      `Please double-check reviews, timings, and availability yourself before visiting.`;

    const q = encodeURIComponent(`${specialty} near ${displayCity}`);
    const googleSearchUrl = `https://www.google.com/search?q=${q}`;
    const googleMapsUrl = `https://www.google.com/maps/search/${q}`;
    const practoSearchUrl = `https://www.practo.com/search/doctors?results_type=doctor&q=${encodeURIComponent(
      specialty
    )}&city=${encodeURIComponent(trimmedCity || "")}`;

    return res.json({
      specialty,
      city: trimmedCity || null,
      message,
      doctors: [],
      searchLinks: {
        googleSearchUrl,
        googleMapsUrl,
        practoSearchUrl,
      },
      note: "Use these links to see real doctors, ratings, and reviews near you. This app only guides you on the type of doctor.",
    });
  } catch (err) {
    console.error("doctor-suggest error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   5) COMFORT / REMEDY SUGGESTIONS
   POST /api/ai/remedy-suggest
============================================================ */
router.post("/remedy-suggest", requireAuth, async (req, res) => {
  try {
    const { symptom, cyclePhase } = req.body || {};
    const s = (symptom || "").toLowerCase();
    const phase = (cyclePhase || "period").toLowerCase();

    const baseWarning =
      "These are general comfort tips, not medical treatment. If pain is severe, bleeding is heavy, or you feel very unwell, please see a doctor urgently.";

    let tips = [
      "Rest when you feel tired.",
      "Drink water regularly.",
      "Track your symptoms to share with your doctor.",
    ];

    if (s.includes("cramp") || s.includes("pain")) {
      tips = [
        "Use a warm water bag on your lower abdomen if it is safe for you.",
        "Gentle stretching or slow walking can sometimes ease cramps.",
        "Try to eat light, balanced meals instead of skipping food.",
      ];
    } else if (s.includes("bloat") || s.includes("gas")) {
      tips = [
        "Limit very salty or processed foods and fizzy drinks.",
        "Sip warm water or light herbal tea.",
        "Wear loose, comfortable clothing around your stomach.",
      ];
    } else if (
      s.includes("mood") ||
      s.includes("anxiety") ||
      s.includes("low") ||
      s.includes("sad")
    ) {
      tips = [
        "Try 5–10 minutes of deep breathing or grounding exercises.",
        "Write your feelings in a journal without judging yourself.",
        "Reach out to a trusted person or helpline if you feel overwhelmed.",
      ];
    }

    res.json({
      tips,
      phase,
      warning: baseWarning,
    });
  } catch (err) {
    console.error("remedy-suggest error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
