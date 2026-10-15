// Ported from zovie_chatbot-main/backend_django/chatbot/views.py
// The Zoiko knowledge base + keyword fallback used when OpenAI is unavailable.

export type ChatItem = string | { text: string; url: string };

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  reply: string;
  items: ChatItem[];
  history: ChatTurn[];
}

export const ZOIKO_KB = `
You are Zovie, the friendly AI assistant for Zoiko Mobile UK.
Website: https://zoikomobile.co.uk

ABOUT ZOIKO MOBILE:
- UK MVNO (Mobile Virtual Network Operator) offering SIM-only plans
- Uses a major UK network with excellent coverage
- Offers eSIM and physical SIM cards
- No long-term contracts on most plans
- Supports Wi-Fi Calling and VoLTE
- Free international calls on many plans (35+ countries)
- EU Roaming included on all plans

ZOIKO PLANS (Flagship — 24 month):
- Zoiko Standard 10GB:  £12.14/month | 500 Calls & Texts | Wi-Fi Calling & eSIM | EU Roaming: 5GB/500min/500Texts
- Zoiko Max 30GB:       £16.99/month | Unlimited Calls & Texts | Free International Calls | EU Roaming: 15GB/1000min
- Zoiko Elite 100GB:    £28.34/month | Unlimited Calls & Texts | Free International Calls | EU Roaming: 30GB/2000min
- Zoiko Unlimited Data: £29.50/month | Unlimited Calls & Texts | Free International Calls | EU Roaming: 40GB/Unlimited

STUDENT PLANS:
- Zoiko Student 5GB:  £6.99/month  | 500 Calls & Texts | Student Discount
- Zoiko Student 15GB: £9.99/month  | Unlimited Calls & Texts | Student Discount  (MOST POPULAR)
- Zoiko Student 30GB: £12.99/month | Unlimited Calls & Texts | Student Discount
More info: https://zoikomobile.co.uk/student-discount-programme/

ESSENTIAL PLANS (Public sector / Civil servants):
- Zoiko Essential 5GB:  £5.99/month  | 250 Calls & Texts | No Contract
- Zoiko Essential 10GB: £8.49/month  | 500 Calls & Texts | No Contract  (MOST POPULAR)
- Zoiko Essential 20GB: £11.99/month | Unlimited Calls & Texts | No Contract
More info: https://zoikomobile.co.uk/civilservants/

SOCIAL TARIFF PLANS (Low income / benefits customers):
- Zoiko Social 3GB:  £3.99/month | Unlimited Calls & Texts | Social Media Included
- Zoiko Social 10GB: £7.49/month | Unlimited Calls & Texts | Social Media Included  (MOST POPULAR)
More info: https://zoikomobile.co.uk/social-tariff-plans/

DATA ONLY PLANS:
- Zoiko Data 10GB:      £8.99/month  | Data Only SIM
- Zoiko Data 30GB:      £14.99/month | Data Only SIM  (MOST POPULAR)
- Zoiko Data Unlimited: £22.99/month | Data Only SIM
More info: https://zoikomobile.co.uk/data-only-plans/

30 DAY ROLLING PLANS (cancel anytime):
- Zoiko Plus 3GB:    £5.66/month  | Unlimited Calls & Texts
- Zoiko Max 30GB:    £16.99/month | Unlimited Calls & Texts | Free International Calls  (MOST POPULAR)
- Zoiko Elite 100GB: £28.34/month | Unlimited Calls & Texts | Free International Calls
More info: https://zoikomobile.co.uk/30-day-plan/

BUSINESS DEALS:
- Business Starter 20GB: £14.99/month | Unlimited Calls & Texts | Dedicated Account Manager | Priority Support
- Business Pro 50GB:     £24.99/month | Unlimited Calls & Texts | Dedicated Account Manager | 5 SIMs (MOST POPULAR)
- Business Unlimited:    £39.99/month | Unlimited Everything | 10 SIMs Included
More info: https://zoikomobile.co.uk/business-deals_sim-only-plans/

CHECKOUT URL FORMAT:
https://zoikomobile.co.uk/checkout/?add-to-cart=PRODUCT_ID

DEVICES:         https://zoikomobile.co.uk/devices/
ANIMALS & MUSIC: https://zoikomobile.co.uk/animals-and-music/
ABOUT US:        https://zoikomobile.co.uk/about-us/

SIM ACTIVATION:
- Physical SIM delivered in 2-3 working days
- eSIM activated instantly via QR code
- Port your number with PAC code (text PAC to 65075)
- Activation page: https://zoikomobile.co.uk/activate-your-sim/

TOP UP:
- Online portal: https://zoikomobile.co.uk/recharge/
- Auto top-up available via My Account

SWITCH & SAVE:
- Get PAC code by texting PAC to 65075
- Enter it when ordering on zoikomobile.co.uk
- Keep existing number, switch in up to 1 working day
- Page: https://zoikomobile.co.uk/switch-and-save/

INTERNATIONAL CALLS (free on eligible plans, 35+ countries):
- Countries include: India, Pakistan, Bangladesh, Nigeria, USA, Canada, Australia, all EU/EEA
- Full list: https://zoikomobile.co.uk/international-calling/

SUPPORT & CONTACT:
- Email:   support@zoikomobile.co.uk
- Contact: https://zoikomobile.co.uk/contact-us/
- Support: https://zoikomobile.co.uk/support/
- Response within 24 hours (priority customers: 2 hours)

IMPORTANT BEHAVIOUR RULES:
- Be friendly, warm, and concise.
- Give a SPECIFIC answer to each question — never give the same generic response.
- If the user asks about plans, give them the exact plan details from the knowledge base above.
- If the user asks about devices, activation, top-up, or any other topic, answer that topic specifically.
- Never invent prices or plan details not listed above.
- Always end your reply with: [MENU_ITEMS: option1 | option2 | option3]
- Keep chip options short and relevant (max 4 items).
- Always include "🏠 Main Menu" as the last chip option.
- Suggested chips should match what the user might want to do next based on their question.

EXAMPLES OF GOOD CHIP SUGGESTIONS:
- After answering about student plans: [MENU_ITEMS: Student Plans | 30 Day Plans | Contact Us | 🏠 Main Menu]
- After answering about international calls: [MENU_ITEMS: Zoiko Plans | International Calls | 🏠 Main Menu]
- After answering about activation: [MENU_ITEMS: Activate SIM | Top Up | Contact Us | 🏠 Main Menu]
- After answering about devices: [MENU_ITEMS: Devices | Zoiko Plans | 🏠 Main Menu]
`.trim();

export function fallbackResponse(message: string): { reply: string; items: ChatItem[] } {
  const msg = (message || "").toLowerCase();

  const has = (...words: string[]) => words.some((w) => msg.includes(w));

  if (has("student", "uni", "university", "college", "discount")) {
    return {
      reply:
        "🎓 Our Student Plans start from just £6.99/month!\n\n• 5GB — £6.99/mo | 500 Calls & Texts\n• 15GB — £9.99/mo | Unlimited Calls & Texts ⭐ Most Popular\n• 30GB — £12.99/mo | Unlimited Calls & Texts\n\nAll include EU Roaming, Wi-Fi Calling & eSIM. Student verification required.\n\nVisit: zoikomobile.co.uk/student-discount-programme/",
      items: ["Student Plans", "Zoiko Plans", "Contact Us", "🏠 Main Menu"],
    };
  }

  if (has("business", "company", "corporate", "enterprise", "office", "team")) {
    return {
      reply:
        "💼 Zoiko Business Plans — built for teams:\n\n• Starter 20GB — £14.99/mo | Account Manager + Priority Support\n• Pro 50GB — £24.99/mo | 5 SIMs included ⭐ Most Popular\n• Unlimited — £39.99/mo | 10 SIMs + everything unlimited\n\nAll plans include a dedicated account manager.\n\nVisit: zoikomobile.co.uk/business-deals_sim-only-plans/",
      items: ["Business Deals", "Contact Us", "🏠 Main Menu"],
    };
  }

  if (has("data", "gb", "gigabyte", "internet", "data only")) {
    return {
      reply:
        "📶 Our Data Only SIM plans:\n\n• 10GB — £8.99/mo\n• 30GB — £14.99/mo ⭐ Most Popular\n• Unlimited — £22.99/mo\n\nPerfect for tablets, dongles, or secondary devices. Includes EU Roaming.\n\nVisit: zoikomobile.co.uk/data-only-plans/",
      items: ["Data Only Plans", "Zoiko Plans", "🏠 Main Menu"],
    };
  }

  if (has("international", "abroad", "overseas", "india", "pakistan", "nigeria", "call", "calling")) {
    return {
      reply:
        "🌍 Zoiko offers FREE international calls to 35+ countries on eligible plans, including India, Pakistan, Bangladesh, Nigeria, USA, Canada, Australia and all EU countries.\n\nEligible plans: Zoiko Max 30GB (£16.99/mo), Elite 100GB (£28.34/mo) and Unlimited (£29.50/mo).\n\nFull country list: zoikomobile.co.uk/international-calling/",
      items: ["Zoiko Plans", "International Calls", "🏠 Main Menu"],
    };
  }

  if (has("activate", "activation", "new sim", "start", "setup", "set up")) {
    return {
      reply:
        "✅ Activating your Zoiko SIM is simple:\n\n1. Physical SIM — delivered in 2-3 working days\n2. eSIM — activated instantly via QR code\n3. Keep your number — text PAC to 65075, then enter it when ordering\n\nActivation page: zoikomobile.co.uk/activate-your-sim/",
      items: ["Activate SIM", "Top Up", "Support", "🏠 Main Menu"],
    };
  }

  if (has("top up", "topup", "topup", "recharge")) {
    return {
      reply:
        "💳 You can top up your Zoiko SIM online:\n\nVisit https://zoikomobile.co.uk/recharge/\n\nTop ups apply instantly. Contact support@zoikomobile.co.uk if you need help.",
      items: ["Top Up", "Zoiko Plans", "🏠 Main Menu"],
    };
  }

  if (has("switch", "port", "keep my number", "pac")) {
    return {
      reply:
        "🔄 Switching to Zoiko is easy:\n\n1. Text PAC to 65075 to get your code\n2. Enter it when you order at checkout\n3. Your number moves over automatically\n\nVisit: zoikomobile.co.uk/switch-and-save/",
      items: ["Switch & Save", "Zoiko Plans", "🏠 Main Menu"],
    };
  }

  if (has("price", "cost", "cheap", "how much", "pricing")) {
    return {
      reply:
        "💰 Our plans start from £3.99/month.\n\n• Social 3GB — £3.99/mo\n• Student 5GB — £6.99/mo\n• Standard 10GB — £12.14/mo\n• Max 30GB — £16.99/mo\n\nSee all plans at zoikomobile.co.uk/plans/",
      items: ["Zoiko Plans", "Student Plans", "🏠 Main Menu"],
    };
  }

  return {
    reply:
      "I'm Zovie, your Zoiko Mobile assistant. 😊\n\nI can help with plans, devices, SIM activation, top ups, international calls and more. Please choose an option below or ask me anything.",
    items: ["Zoiko Plans", "Devices", "Support", "🏠 Main Menu"],
  };
}
