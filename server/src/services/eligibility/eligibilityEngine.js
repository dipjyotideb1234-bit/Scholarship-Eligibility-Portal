const numericFields = new Set(['age', 'family_income', 'annual_percentage']);

export function ageFromDob(dateOfBirth) {
  if (!dateOfBirth) return null;
  const date = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const beforeBirthday = today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate());
  return age - (beforeBirthday ? 1 : 0);
}

function values(rule) {
  try { return JSON.parse(rule.value); } catch { return rule.value; }
}
function evaluate(actual, operator, expected) {
  if (numericFields.has(this?.field)) actual = Number(actual);
  switch (operator) {
    case 'EQUALS': return actual === expected;
    case 'NOT_EQUALS': return actual !== expected;
    case 'LESS_THAN': return Number(actual) < Number(expected);
    case 'LESS_THAN_OR_EQUAL': return Number(actual) <= Number(expected);
    case 'GREATER_THAN': return Number(actual) > Number(expected);
    case 'GREATER_THAN_OR_EQUAL': return Number(actual) >= Number(expected);
    case 'BETWEEN': return Array.isArray(expected) && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
    case 'IN': return Array.isArray(expected) && expected.includes(actual);
    case 'NOT_IN': return Array.isArray(expected) && !expected.includes(actual);
    default: throw new Error(`Unsupported operator: ${operator}`);
  }
}
export function evaluateScholarship(profile, rules) {
  const results = rules.map(rule => {
    const actualValue = rule.field === 'age' ? ageFromDob(profile.date_of_birth) : profile[rule.field];
    const expectedValue = values(rule);
    if (actualValue === null || actualValue === undefined || actualValue === '') return { ruleId: rule.id, label: rule.label, description: rule.description, required: Boolean(rule.required), status: rule.required ? 'MISSING' : 'PASS', actualValue: null, expectedValue };
    let pass;
    try { pass = evaluate.call(rule, actualValue, rule.operator, expectedValue); } catch (error) { return { ruleId: rule.id, label: rule.label, status: 'INVALID', actualValue, expectedValue, explanation: error.message }; }
    return { ruleId: rule.id, label: rule.label, description: rule.description, required: Boolean(rule.required), status: pass ? 'PASS' : 'FAIL', actualValue, expectedValue, explanation: pass ? `${rule.label} meets the recorded requirement.` : `${rule.label} does not meet the recorded requirement.` };
  });
  const failed = results.filter(r => r.status === 'FAIL');
  const missing = results.filter(r => r.status === 'MISSING');
  return { status: failed.length ? 'NOT_ELIGIBLE' : missing.length ? 'POSSIBLY_ELIGIBLE' : 'ELIGIBLE', rules: results, reason: failed[0]?.explanation || (missing.length ? `Add ${missing.map(r => r.label).join(', ')} to determine eligibility.` : 'All recorded requirements are satisfied.') };
}
