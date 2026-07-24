const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const commonPasswords = new Set([
  "123456","12345678","123456789","password","password1","qwerty","qwerty123",
  "admin","admin123","letmein","welcome","monkey","dragon","football","iloveyou",
  "abc123","login","master","princess","sunshine","passw0rd"
]);

const policyMap = {
  standard: { length: 12, label: "Modern standard" },
  enterprise: { length: 16, label: "Enterprise strict" },
  nist: { length: 8, label: "NIST-inspired" }
};

const attackRates = { online: 100, offline: 1e10, gpu: 1e12 };
const input = $("#passwordInput");
let latestAnalysis = null;

function detectPatterns(value) {
  const lower = value.toLowerCase();
  const findings = [];
  if (commonPasswords.has(lower)) findings.push({ severity: "high", title: "COMMON CREDENTIAL", text: "This exact value appears in the local high-frequency password watchlist." });
  if (/(.)\1{2,}/i.test(value)) findings.push({ severity: "medium", title: "REPEATED CHARACTERS", text: "Three or more repeated characters reduce the effective search space." });
  if (/(?:1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwerty|asdf|zxcv)/i.test(value)) findings.push({ severity: "high", title: "PREDICTABLE SEQUENCE", text: "Keyboard walks and sequential characters are prioritized by guessing tools." });
  if (/(?:19|20)\d{2}/.test(value)) findings.push({ severity: "medium", title: "DATE-LIKE TOKEN", text: "A four-digit year is easy to target with personal-information rules." });
  if (/^[a-z]+[0-9]{1,4}[!@#$]?$/i.test(value) && value.length > 3) findings.push({ severity: "medium", title: "COMMON STRUCTURE", text: "Word + digits + optional symbol is a widely used mask attack pattern." });
  return findings;
}

function charsetSize(value) {
  let size = 0;
  if (/[a-z]/.test(value)) size += 26;
  if (/[A-Z]/.test(value)) size += 26;
  if (/\d/.test(value)) size += 10;
  if (/[^A-Za-z0-9\s]/.test(value)) size += 33;
  if (/\s/.test(value)) size += 1;
  return size;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds > 3.154e25) return "QUINTILLIONS OF YEARS";
  if (seconds < 1) return "INSTANT";
  const units = [["year",31557600],["day",86400],["hour",3600],["minute",60],["second",1]];
  for (const [name, unit] of units) {
    if (seconds >= unit) {
      const amount = Math.floor(seconds / unit);
      if (amount >= 1e12) return `${(amount / 1e12).toFixed(1)}T ${name.toUpperCase()}S`;
      if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}B ${name.toUpperCase()}S`;
      if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M ${name.toUpperCase()}S`;
      if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K ${name.toUpperCase()}S`;
      return `${amount} ${name.toUpperCase()}${amount === 1 ? "" : "S"}`;
    }
  }
}

function analyze(value) {
  const policy = policyMap[$("#policyProfile").value];
  const patterns = detectPatterns(value);
  const pool = charsetSize(value);
  const rawEntropy = value ? Math.log2(Math.pow(Math.max(pool, 1), value.length)) : 0;
  const penalty = patterns.reduce((sum, item) => sum + (item.severity === "high" ? 18 : 9), 0);
  const entropy = Math.max(0, Math.round(rawEntropy - penalty));
  const diversity = value.length > 0 && new Set(value.toLowerCase()).size / value.length >= .55 && !/(.)\1{2,}/.test(value);
  const isCommon = value.length > 0 && !commonPasswords.has(value.toLowerCase());
  const noPattern = value.length > 0 && patterns.length === 0;
  const rules = {
    length: value.length >= policy.length,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9\s]/.test(value),
    unique: diversity,
    common: isCommon,
    pattern: noPattern
  };
  const passed = Object.values(rules).filter(Boolean).length;
  let score = value ? Math.min(100, Math.round(entropy * .72 + passed * 4)) : 0;
  if (commonPasswords.has(value.toLowerCase())) score = Math.min(score, 8);
  if (value.length < 8) score = Math.min(score, 28);
  const crackSeconds = value ? Math.pow(2, entropy) / attackRates[$("#attackModel").value] : 0;
  return { policy, patterns, pool, entropy, rules, passed, score, crackSeconds };
}

function levelFor(score, hasValue) {
  if (!hasValue) return { label: "AWAITING INPUT", risk: "NOT ANALYZED", grade: "—", color: "#46614d", summary: "Enter a password to begin the audit." };
  if (score < 25) return { label: "CRITICAL", risk: "HIGH EXPOSURE", grade: "F", color: "#ff5d73", summary: "Likely to fall quickly under targeted or automated guessing." };
  if (score < 50) return { label: "WEAK", risk: "ELEVATED RISK", grade: "D", color: "#ff9f43", summary: "Some complexity exists, but practical attack patterns remain." };
  if (score < 70) return { label: "MODERATE", risk: "PARTIAL RESISTANCE", grade: "C", color: "#ffc857", summary: "Reasonable composition with meaningful room for hardening." };
  if (score < 88) return { label: "STRONG", risk: "LOW RISK", grade: "B", color: "#7cff6b", summary: "Strong resistance under the selected attack assumptions." };
  return { label: "FORTIFIED", risk: "HIGH RESISTANCE", grade: "A", color: "#25e461", summary: "Excellent length, diversity, and resistance to known patterns." };
}

function render() {
  latestAnalysis = analyze(input.value);
  const result = latestAnalysis;
  const level = levelFor(result.score, Boolean(input.value));
  document.documentElement.style.setProperty("--meter-color", level.color);
  $("#scoreNumber").textContent = result.score;
  $("#scoreGrade").textContent = level.grade;
  $("#scoreGrade").style.color = level.color;
  $("#scoreGrade").style.borderColor = level.color;
  $("#strengthText").textContent = level.label;
  $("#strengthText").style.color = level.color;
  $("#riskLabel").textContent = level.risk;
  $("#riskLabel").style.color = level.color;
  $("#riskSummary").textContent = level.summary;
  $("#entropyValue").textContent = `${result.entropy} bits`;
  $("#charsetValue").textContent = result.pool;
  $("#crackTime").textContent = input.value ? formatDuration(result.crackSeconds) : "—";
  $("#findingCount").textContent = result.patterns.length;
  $("#checksCount").textContent = `${result.passed}/8 PASS`;
  $("#lengthRule").textContent = `${result.policy.length}+ characters`;
  $("#segments").setAttribute("aria-valuenow", result.score);
  $$("#segments i").forEach((segment, index) => segment.classList.toggle("on", index < Math.ceil(result.score / 20)));
  $$("#rulesList .check").forEach(item => {
    const pass = result.rules[item.dataset.rule];
    item.classList.toggle("pass", pass);
    item.querySelector("b").textContent = pass ? "✓" : "×";
  });
  renderFindings(result);
}

function renderFindings(result) {
  const list = $("#findingsList");
  if (!input.value) {
    list.innerHTML = '<div class="empty-state"><span>⌁</span><p>Awaiting credential input.<small>Findings will appear here in real time.</small></p></div>';
    $("#severityBadge").textContent = "INFO";
    return;
  }
  const items = [...result.patterns];
  if (!result.rules.length) items.push({ severity: "medium", title: "INSUFFICIENT LENGTH", text: `Add ${result.policy.length - input.value.length} characters to meet the selected ${result.policy.label} policy.` });
  if (!result.rules.special) items.push({ severity: "medium", title: "NARROW CHARACTER SPACE", text: "A symbol increases the set of combinations an attacker must search." });
  if (!items.length) items.push({ severity: "good", title: "NO MAJOR HEURISTIC FLAGS", text: "The local rules engine found no obvious patterns. Keep this password unique and use MFA." });
  list.innerHTML = items.slice(0, 5).map(item => `<div class="finding ${item.severity === "high" ? "high" : item.severity === "good" ? "good" : ""}"><strong>${item.title}</strong>${item.text}</div>`).join("");
  const high = items.some(item => item.severity === "high");
  $("#severityBadge").textContent = high ? "HIGH" : items[0].severity === "good" ? "CLEAR" : "MEDIUM";
}

function secureRandom(max) {
  if (max <= 0) throw new Error("Invalid character pool");
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

function generatePassword() {
  const sets = [];
  if ($("#includeUpper").checked) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  if ($("#includeLower").checked) sets.push("abcdefghijklmnopqrstuvwxyz");
  if ($("#includeNumbers").checked) sets.push("0123456789");
  if ($("#includeSymbols").checked) sets.push("!@#$%^&*+-=?");
  if (!sets.length) {
    $("#generatorToast").textContent = "Select at least one character group.";
    return "";
  }
  const ambiguous = /[Il1O0]/g;
  const cleanSets = sets.map(set => $("#excludeAmbiguous").checked ? set.replace(ambiguous, "") : set);
  const length = Number($("#lengthRange").value);
  const output = cleanSets.map(set => set[secureRandom(set.length)]);
  const pool = cleanSets.join("");
  while (output.length < length) output.push(pool[secureRandom(pool.length)]);
  for (let i = output.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  const password = output.join("");
  $("#generatedPassword").value = password;
  $("#generatedEntropy").textContent = Math.floor(length * Math.log2(pool.length));
  $("#generatorToast").textContent = "";
  return password;
}

async function copyText(value, statusEl) {
  if (!value) return;
  try { await navigator.clipboard.writeText(value); }
  catch {
    const field = document.createElement("textarea");
    field.value = value; document.body.append(field); field.select(); document.execCommand("copy"); field.remove();
  }
  statusEl.textContent = "Copied securely to clipboard.";
  setTimeout(() => statusEl.textContent = "", 2200);
}

function openTab(name) {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name));
  $$(".tab-panel").forEach(panel => panel.classList.remove("active"));
  $(`#${name}Panel`).classList.add("active");
}

$$(".tab").forEach(tab => tab.addEventListener("click", () => openTab(tab.dataset.tab)));
input.addEventListener("input", render);
$("#attackModel").addEventListener("change", render);
$("#policyProfile").addEventListener("change", render);
$("#analyzeBtn").addEventListener("click", () => { render(); $("#toast").textContent = input.value ? "Audit complete. Results updated." : "Enter a password to run an audit."; });
$("#toggleVisibility").addEventListener("click", event => {
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  event.currentTarget.textContent = show ? "HIDE" : "SHOW";
  event.currentTarget.setAttribute("aria-label", show ? "Hide password" : "Show password");
});
$("#clearBtn").addEventListener("click", () => { input.value = ""; render(); input.focus(); });
$("#useGeneratedBtn").addEventListener("click", () => { openTab("generator"); generatePassword(); });
$("#lengthRange").addEventListener("input", event => { $("#lengthOutput").textContent = event.target.value; generatePassword(); });
$$(".option-grid input").forEach(option => option.addEventListener("change", generatePassword));
$("#regenerateBtn").addEventListener("click", generatePassword);
$("#copyGeneratedBtn").addEventListener("click", () => copyText($("#generatedPassword").value, $("#generatorToast")));

generatePassword();
render();
