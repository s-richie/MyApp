const fil: Record<string, string> = {
  // Shared
  "Amount": "Halaga",
  "Amount (₱)": "Halaga (₱)",
  "Note (optional)": "Tala (opsyonal)",
  "Recent": "Kamakailan",
  "See everything in the History tab.": "Tingnan ang lahat sa tab na Kasaysayan.",
  "Category": "Kategorya",

  // Ipon screen
  "My goals": "Mga goal ko",
  "New goal": "Bagong goal",
  "Edit goal": "I-edit ang goal",
  "Tap a goal to choose where your next ipon goes.":
    "I-tap ang goal para piliin kung saan mapupunta ang susunod mong ipon.",
  "Add ipon": "Magdagdag ng ipon",
  "Adding to:": "Idadagdag sa:",
  "No ipon yet. Add your first one!": "Wala pang ipon. Idagdag ang una mo!",
  "Goal name (e.g. Laptop)": "Pangalan ng goal (hal. Laptop)",
  "Target amount (₱)": "Target na halaga (₱)",
  "You need at least one goal.": "Kailangan mo ng kahit isang goal.",
  "Your ipon entries stay in History, but they won't count toward any goal.":
    "Mananatili sa Kasaysayan ang mga entry mo sa ipon, pero hindi na ito mabibilang sa kahit anong goal.",

  // Budget screen
  "Monthly budget (₱)": "Buwanang budget (₱)",
  "Remaining": "Natitira",
  "Spent: ₱{n}": "Nagastos: ₱{n}",
  "Add gastos": "Magdagdag ng gastos",

  // History screen
  "Search note, category, wallet or amount": "Maghanap ng tala, kategorya, wallet o halaga",
  "All": "Lahat",
  "Tap an entry to edit it.": "I-tap ang entry para i-edit.",
  "No matches found.": "Walang nahanap.",
  "Nothing here yet.": "Wala pa dito.",
  "Delete entry?": "Burahin ang entry?",
  "This can't be undone.": "Hindi na ito mababawi.",
  "Edit ipon": "I-edit ang ipon",
  "Edit expense": "I-edit ang gastos",

  // Utang screen
  "They owe me": "Utang nila sa akin",
  "I owe": "Utang ko",
  "Owed to me": "Utang sa akin",
  "New": "Bago",
  "Nobody owes you anything. 🎉": "Walang may utang sa iyo. 🎉",
  "You don't owe anyone. 🙌": "Wala kang utang kanino man. 🙌",
  "Paid ✅": "Bayad na ✅",
  "of ₱{n}": "ng ₱{n}",
  "Record payment received": "I-record ang natanggap na bayad",
  "Record payment I made": "I-record ang bayad ko",
  "New utang": "Bagong utang",
  "I owe them": "Utang ko sa kanila",
  "Person's name": "Pangalan ng tao",
  "Payment received": "Natanggap na bayad",
  "Payment made": "Bayad na ginawa",
  "{name} • remaining {n}": "{name} • natitira {n}",
  "Mark fully paid": "Markahan bilang bayad na",
  "Delete utang with {name}?": "Burahin ang utang kay {name}?",

  // Ambagan
  "I paid": "Ako ang nagbayad",
  "A friend paid": "Kaibigan ang nagbayad",
  "Total bill (₱)": "Kabuuang bill (₱)",
  "What was it for? (e.g. Samgyup)": "Para saan ito? (hal. Samgyup)",
  "How many people (including you)?": "Ilan kayo (kasama ka)?",
  "Each friend pays": "Bayad ng bawat kaibigan",
  "Your share: {n}": "Parte mo: {n}",
  "Your share": "Parte mo",
  "This is added to what you owe the friend who paid.":
    "Idadagdag ito sa utang mo sa kaibigang nagbayad.",
  "Friends (names are optional)": "Mga kaibigan (opsyonal ang pangalan)",
  "Friend {n} name": "Pangalan ng Kaibigan {n}",
  "Friend {n}": "Kaibigan {n}",
  "Record my share as an expense": "I-record ang parte ko bilang gastos",
  "Counts in your budget and wallet.": "Mabibilang sa budget at wallet mo.",
  "Who paid? (name)": "Sino ang nagbayad? (pangalan)",
  "Save and add to utang": "I-save at idagdag sa utang",
  "Add to what I owe": "Idagdag sa utang ko",
  "Enter the total bill first.": "Ilagay muna ang kabuuang bill.",
  "Saved!": "Na-save!",
  "Added {n} utang entries of {amt} each.":
    "Nagdagdag ng {n} utang na {amt} bawat isa.",
  "Added {n} utang entries of {amt} each and your share of {share} as an expense.":
    "Nagdagdag ng {n} utang na {amt} bawat isa at ang parte mo na {share} bilang gastos.",
  "Who paid?": "Sino ang nagbayad?",
  "Enter the name of the person who paid.": "Ilagay ang pangalan ng nagbayad.",
  "Added {amt} to what you owe {name}.": "Nadagdag ang {amt} sa utang mo kay {name}.",

  // PIN lock
  "Too many tries. Wait {s}s": "Napakaraming subok. Maghintay ng {s}s",
  "Wrong PIN. Try again.": "Maling PIN. Subukan ulit.",
  "Enter your PIN": "Ilagay ang PIN mo",
  "Unlock Ipon Bot": "I-unlock ang Ipon Bot",
  "Use PIN": "Gamitin ang PIN",

  // Security card
  "Security": "Seguridad",
  "PIN lock": "PIN lock",
  "Asks for your PIN when you open the app and after 30 seconds away.":
    "Hihingin ang PIN mo kapag binuksan ang app at pagkatapos ng 30 segundong pagkawala.",
  "Change PIN": "Palitan ang PIN",
  "Unlock with fingerprint": "I-unlock gamit ang fingerprint",
  "You can always use your PIN instead.": "Pwede mo pa ring gamitin ang PIN.",
  "⚠️ If you forget your PIN, the only way back in is to clear the app's data, which also erases your entries. Make a CSV backup in Export & share first.":
    "⚠️ Kapag nakalimutan mo ang PIN, ang tanging paraan para makapasok ay burahin ang data ng app, kasama ang mga entry mo. Gumawa muna ng CSV backup sa I-export at ibahagi.",
  "Set a PIN": "Mag-set ng PIN",
  "Turn off PIN lock": "I-off ang PIN lock",
  "Enter your current PIN": "Ilagay ang kasalukuyang PIN",
  "Enter a new 4-digit PIN": "Maglagay ng bagong 4-digit na PIN",
  "Enter the PIN again to confirm": "Ilagay ulit ang PIN para kumpirmahin",
  "PINs don't match. Start again.": "Hindi magkapareho ang mga PIN. Ulitin.",
  "PIN lock is off": "Naka-off na ang PIN lock",
  "PIN saved": "Na-save ang PIN",
  "The app will ask for it next time you open it.":
    "Hihingin ito ng app sa susunod na pagbukas mo.",
};

export default fil;