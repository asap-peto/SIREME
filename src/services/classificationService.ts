import { CaseFormData, ClassificationResult } from '../types';
import { classifyGravity } from '../rules/gravityRules';
import { classifyCategory, resolveCareLine } from '../rules/categoryRules';
import { generateAlerts } from '../rules/alertRules';
import { determineResources } from '../rules/resourceRules';

export function classifyCase(data: CaseFormData): ClassificationResult {
  const gravity = classifyGravity(data);
  const category = classifyCategory(data);
  const careLine = resolveCareLine(category);
  const { required, desired } = determineResources(category, gravity, data);
  const alerts = generateAlerts(data, gravity, category);

  return {
    gravity,
    category,
    careLine,
    requiredResources: required,
    desiredResources: desired,
    alerts,
  };
}
