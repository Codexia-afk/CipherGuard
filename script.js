const passwordInput = document.querySelector("#passwordInput");
const toggleVisibility = document.querySelector("#toggleVisibility");
const progressFill = document.querySelector("#progressFill");
const progressTrack = document.querySelector(".progress-track");
const strengthText = document.querySelector("#strengthText");
const scoreNumber = document.querySelector("#scoreNumber");
const ringProgress = document.querySelector("#ringProgress");
const ratingBadge = document.querySelector("#ratingBadge");
const crackTime = document.querySelector("#crackTime");
const checksCount = document.querySelector("#checksCount");
const suggestionsList = document.querySelector("#suggestionsList");
const copyToast = document.querySelector("#copyToast");

const ruleTests = {
  length: value => value.length >= 12,
  uppercase: value => /[A-Z]/.test(value),
  lowercase: value => /[a-z]/.test(value),
  number: value => /\d/.test(value),
  special: value => /[^A-Za-z0-9\s]/.test(value),
  space: value => !/\s/.test(value)
};

const levels = [
  { max: 0, label: "Waiting", color: "#8e9baa", rating: "Not analyzed" },
  { max: 34, label: "Critical", color: "#ff5470", rating: "Very weak" },
  { max: 54, label: "Vulnerable", color: "#ff7a45", rating: "Weak" },
  { max: 74, label: "Fair", color: "#ffb547", rating: "Moderate" },
  { max: 89, label: "Strong", color: "#72d68c", rating: "Strong" },
  { max: 100, label: "Fortified", color: "#25e6c8", rating: "Excellent" }
];

function calculateScore(value, rules) {
  if (!value) return 0;
  let score = Math.min(value.length * 3, 36);
  score += rules.uppercase ? 12 : 0;
  score += rules.lowercase ? 10 : 0;
  score += rules.number ? 12 : 0;
  score += rules.special ? 16 : 0;
  score += value.length >= 16 ? 9 : 0;
  score += new Set(value).size >= Math.min(value.length, 10) ? 5 : 0;
  if (!rules.space) score -= 8;
  if (/(.)\1{2,}/.test(value)) score -= 12;
  if (/^(password|qwerty|letmein|admin|welcome|123456)/i.test(value)) score -= 30;
  return Math.max(1, Math.min(100, score));
}

function estimateCrackTime(value) {
  if (!value) return "—";
  let pool = 0;
  if (/[a-z]/.test(value)) pool += 26;
  if (/[A-Z]/.test(value)) pool += 26;
  if (/\d/.test(value)) pool += 10;
  if (/[^A-Za-z0-9\s]/.test(value)) pool += 33;
  if (/\s/.test(value)) pool += 1;
  const seconds = Math.pow(Math.max(pool, 1), value.length) / 1e10;
  if (seconds < 1) return "Instantly";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31557600) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31557600 * 1000) return `${Math.round(seconds / 31557600)} years`;
  if (seconds < 31557600 * 1e6) return `${Math.round(seconds / (31557600 * 1000))}K years`;
  if (seconds < 31557600 * 1e9) return `${Math.round(seconds / (31557600 * 1e6))}M years`;
  return "Billions of years";
}

function getSuggestions(value, rules, score) {
  if (!value) return ["Enter a password to receive focused recommendations."];
  const items = [];
  if (!rules.length) items.push(`Add ${12 - value.length} more character${12 - value.length === 1 ? "" : "s"} to reach the recommended minimum.`);
  if (!rules.uppercase) items.push("Mix in at least one uppercase letter.");
  if (!rules.lowercase) items.push("Add a lowercase letter for a broader character set.");
  if (!rules.number) items.push("Include a number that is not an obvious date.");
  if (!rules.special) items.push("Use a symbol such as !, %, @, or #.");
  if (!rules.space) items.push("Remove spaces from the password.");
  if (/(.)\1{2,}/.test(value)) items.push("Avoid repeating the same character three or more times.");
  if (value.length < 16 && score >= 70) items.push("For maximum resistance, extend this to 16 or more characters.");
  return items.length ? items : ["Excellent composition. Keep this password unique to a single account."];
}

function analyze() {
  const value = passwordInput.value;
  const rules = Object.fromEntries(Object.entries(ruleTests).map(([name, test]) => [name, test(value)]));
  const score = calculateScore(value, rules);
  const level = levels.find(item => score <= item.max);
  const passed = Object.values(rules).filter(Boolean).length;

  document.querySelectorAll(".rule-item").forEach(item => {
    const success = rules[item.dataset.rule];
    item.classList.toggle("pass", success);
    item.querySelector(".rule-icon").textContent = success ? "✓" : "×";
  });

  scoreNumber.textContent = score;
  progressFill.style.width = `${score}%`;
  progressFill.style.background = level.color;
  ringProgress.style.stroke = level.color;
  ringProgress.style.strokeDashoffset = `${377 - (377 * score / 100)}`;
  strengthText.textContent = level.label;
  strengthText.style.color = level.color;
  ratingBadge.textContent = level.rating;
  ratingBadge.style.color = level.color;
  ratingBadge.style.borderColor = `${level.color}66`;
  crackTime.textContent = estimateCrackTime(value);
  checksCount.textContent = `${passed}/6`;
  progressTrack.setAttribute("aria-valuenow", score);

  const suggestions = getSuggestions(value, rules, score);
  suggestionsList.innerHTML = suggestions.map(item => `<li class="${score >= 90 && suggestions.length === 1 ? "success-suggestion" : ""}">${item}</li>`).join("");
}

function generatePassword() {
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*+-=?"];
  const random = max => crypto.getRandomValues(new Uint32Array(1))[0] % max;
  const required = groups.map(group => group[random(group.length)]);
  const all = groups.join("");
  const output = [...required, ...Array.from({ length: 14 }, () => all[random(all.length)])];
  for (let i = output.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  passwordInput.value = output.join("");
  analyze();
  passwordInput.focus();
}

async function copyPassword() {
  if (!passwordInput.value) {
    copyToast.textContent = "Enter or generate a password first.";
    return;
  }
  try {
    await navigator.clipboard.writeText(passwordInput.value);
    copyToast.textContent = "Password copied to clipboard.";
  } catch {
    passwordInput.select();
    document.execCommand("copy");
    copyToast.textContent = "Password copied to clipboard.";
  }
  window.setTimeout(() => { copyToast.textContent = ""; }, 2200);
}

passwordInput.addEventListener("input", analyze);
document.querySelector("#generateBtn").addEventListener("click", generatePassword);
document.querySelector("#copyBtn").addEventListener("click", copyPassword);
document.querySelector("#resetBtn").addEventListener("click", () => {
  passwordInput.value = "";
  passwordInput.type = "password";
  toggleVisibility.setAttribute("aria-label", "Show password");
  toggleVisibility.title = "Show password";
  copyToast.textContent = "";
  analyze();
  passwordInput.focus();
});

toggleVisibility.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  toggleVisibility.setAttribute("aria-label", hidden ? "Hide password" : "Show password");
  toggleVisibility.title = hidden ? "Hide password" : "Show password";
});

analyze();
